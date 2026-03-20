import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app, authHeader } from "./setup.js";
import { prismaMock } from "../mocks/prisma.js";

const user = { id: "user1", username: "alice", email: "a@b.com", avatarUrl: null, createdAt: new Date() };

describe("GET /users/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without token", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });

  it("returns current user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(user as any);

    const res = await request(app)
      .get("/users/me")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.body).not.toHaveProperty("password");
  });
});

describe("PATCH /users/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates username", async () => {
    prismaMock.user.update.mockResolvedValue({ ...user, username: "bob" } as any);

    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", authHeader())
      .send({ username: "bob" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("bob");
  });

  it("rejects invalid username", async () => {
    const res = await request(app)
      .patch("/users/me")
      .set("Authorization", authHeader())
      .send({ username: "ab" });

    expect(res.status).toBe(400);
  });
});

describe("GET /users/search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns matching users", async () => {
    prismaMock.block.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([{ id: "u2", username: "bob", avatarUrl: null }] as any);

    const res = await request(app)
      .get("/users/search?q=bob")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].username).toBe("bob");
  });
});
