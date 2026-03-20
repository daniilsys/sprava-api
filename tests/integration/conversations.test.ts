import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app, authHeader } from "./setup.js";
import { prismaMock } from "../mocks/prisma.js";

const now = new Date();

describe("POST /conversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a conversation", async () => {
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.conversation.create.mockResolvedValue({
      id: "c1", name: null, iconUrl: null, isGroup: false, createdAt: now, updatedAt: now,
      members: [
        { userId: "user1", conversationId: "c1", joinedAt: now, user: { id: "user1", username: "alice", avatarUrl: null } },
        { userId: "u2", conversationId: "c1", joinedAt: now, user: { id: "u2", username: "bob", avatarUrl: null } },
      ],
    } as any);

    const res = await request(app)
      .post("/conversations")
      .set("Authorization", authHeader())
      .send({ memberIds: ["u2"] });

    expect(res.status).toBe(201);
    expect(res.body.members).toHaveLength(2);
  });

  it("returns 403 if blocked in DM", async () => {
    prismaMock.block.findFirst.mockResolvedValue({ blockerId: "u2", blockedId: "user1", createdAt: now });

    const res = await request(app)
      .post("/conversations")
      .set("Authorization", authHeader())
      .send({ memberIds: ["u2"] });

    expect(res.status).toBe(403);
  });

  it("allows group creation even with blocked user", async () => {
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.conversation.create.mockResolvedValue({
      id: "c2", name: "group", iconUrl: null, isGroup: true, createdAt: now, updatedAt: now,
      members: [
        { userId: "user1", conversationId: "c2", joinedAt: now, user: { id: "user1", username: "alice", avatarUrl: null } },
        { userId: "u2", conversationId: "c2", joinedAt: now, user: { id: "u2", username: "bob", avatarUrl: null } },
        { userId: "u3", conversationId: "c2", joinedAt: now, user: { id: "u3", username: "charlie", avatarUrl: null } },
      ],
    } as any);

    const res = await request(app)
      .post("/conversations")
      .set("Authorization", authHeader())
      .send({ memberIds: ["u2", "u3"], name: "group" });

    expect(res.status).toBe(201);
    expect(res.body.isGroup).toBe(true);
  });
});

describe("GET /conversations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user conversations with lastMessage", async () => {
    prismaMock.conversation.findMany.mockResolvedValue([{
      id: "c1", name: null, iconUrl: null, isGroup: false, createdAt: now, updatedAt: now,
      members: [{ userId: "user1", conversationId: "c1", joinedAt: now, user: { id: "user1", username: "alice", avatarUrl: null } }],
      messages: [{ id: "m1", content: "hi", conversationId: "c1", senderId: "user1", createdAt: now, updatedAt: now, sender: { id: "user1", username: "alice", avatarUrl: null } }],
    }] as any);

    const res = await request(app)
      .get("/conversations")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body[0].lastMessage.content).toBe("hi");
    expect(res.body[0]).not.toHaveProperty("messages");
  });
});
