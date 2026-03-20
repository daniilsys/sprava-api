import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app, authHeader } from "./setup.js";
import { prismaMock } from "../mocks/prisma.js";

const now = new Date();
const friendRequestInclude = {
  sender: { id: "user1", username: "alice", avatarUrl: null },
  receiver: { id: "u2", username: "bob", avatarUrl: null },
};

describe("POST /friends/requests/:userId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a friend request", async () => {
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u2" } as any);
    prismaMock.friendRequest.findFirst.mockResolvedValue(null);
    prismaMock.friendRequest.create.mockResolvedValue({
      id: "fr1", senderId: "user1", receiverId: "u2", status: "PENDING",
      createdAt: now, updatedAt: now, ...friendRequestInclude,
    } as any);

    const res = await request(app)
      .post("/friends/requests/u2")
      .set("Authorization", authHeader());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.receiver.username).toBe("bob");
  });

  it("returns 400 when adding yourself", async () => {
    const res = await request(app)
      .post("/friends/requests/user1")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
  });

  it("returns 403 if blocked", async () => {
    prismaMock.block.findFirst.mockResolvedValue({ blockerId: "u2", blockedId: "user1", createdAt: now });

    const res = await request(app)
      .post("/friends/requests/u2")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
  });

  it("returns 409 if already friends", async () => {
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: "u2" } as any);
    prismaMock.friendRequest.findFirst.mockResolvedValue({
      id: "fr1", senderId: "user1", receiverId: "u2", status: "ACCEPTED",
    } as any);

    const res = await request(app)
      .post("/friends/requests/u2")
      .set("Authorization", authHeader());

    expect(res.status).toBe(409);
  });
});

describe("POST /friends/requests/:id/accept", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a pending request", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "fr1", senderId: "u2", receiverId: "user1", status: "PENDING",
      createdAt: now, updatedAt: now, ...friendRequestInclude,
    } as any);
    prismaMock.friendRequest.update.mockResolvedValue({
      id: "fr1", senderId: "u2", receiverId: "user1", status: "ACCEPTED",
      createdAt: now, updatedAt: now, ...friendRequestInclude,
    } as any);

    const res = await request(app)
      .post("/friends/requests/fr1/accept")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ACCEPTED");
  });

  it("returns 403 if not the receiver", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "fr1", senderId: "user1", receiverId: "u2", status: "PENDING",
      createdAt: now, updatedAt: now,
    } as any);

    const res = await request(app)
      .post("/friends/requests/fr1/accept")
      .set("Authorization", authHeader());

    expect(res.status).toBe(403);
  });
});

describe("POST /friends/requests/:id/decline", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the request", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "fr1", senderId: "u2", receiverId: "user1", status: "PENDING",
      createdAt: now, updatedAt: now,
    } as any);
    prismaMock.friendRequest.delete.mockResolvedValue({} as any);

    const res = await request(app)
      .post("/friends/requests/fr1/decline")
      .set("Authorization", authHeader());

    expect(res.status).toBe(204);
  });
});

describe("POST /friends/block/:userId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks a user and removes friendship", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u2" } as any);
    prismaMock.block.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.block.create.mockResolvedValue({} as any);

    const res = await request(app)
      .post("/friends/block/u2")
      .set("Authorization", authHeader());

    expect(res.status).toBe(204);
    expect(prismaMock.friendRequest.deleteMany).toHaveBeenCalled();
  });

  it("returns 400 when blocking yourself", async () => {
    const res = await request(app)
      .post("/friends/block/user1")
      .set("Authorization", authHeader());

    expect(res.status).toBe(400);
  });

  it("returns 409 if already blocked", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u2" } as any);
    prismaMock.block.findUnique.mockResolvedValue({ blockerId: "user1", blockedId: "u2", createdAt: now });

    const res = await request(app)
      .post("/friends/block/u2")
      .set("Authorization", authHeader());

    expect(res.status).toBe(409);
  });
});

describe("GET /friends", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns friends list", async () => {
    prismaMock.friendRequest.findMany.mockResolvedValue([{
      id: "fr1", senderId: "user1", receiverId: "u2", status: "ACCEPTED",
      createdAt: now, updatedAt: now,
      sender: { id: "user1", username: "alice", avatarUrl: null },
      receiver: { id: "u2", username: "bob", avatarUrl: null },
    }] as any);

    const res = await request(app)
      .get("/friends")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].username).toBe("bob");
  });
});
