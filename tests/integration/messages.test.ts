import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app, authHeader } from "./setup.js";
import { prismaMock } from "../mocks/prisma.js";

const now = new Date();
const message = {
  id: "m1", content: "hello", conversationId: "c1", senderId: "user1",
  createdAt: now, updatedAt: now,
  sender: { id: "user1", username: "alice", avatarUrl: null },
  attachments: [],
};

describe("POST /messages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 on send", async () => {
    prismaMock.conversationMember.findUnique.mockResolvedValue({ userId: "user1", conversationId: "c1", joinedAt: now } as any);
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "c1", isGroup: false, members: [{ userId: "user1" }, { userId: "user2" }] } as any);
    prismaMock.block.findFirst.mockResolvedValue(null);
    prismaMock.message.create.mockResolvedValue(message as any);
    prismaMock.conversation.update.mockResolvedValue({} as any);

    const res = await request(app)
      .post("/messages")
      .set("Authorization", authHeader())
      .send({ content: "hello", conversationId: "c1" });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe("hello");
    expect(res.body.sender.username).toBe("alice");
    expect(res.body.attachments).toEqual([]);
  });

  it("returns 400 on empty content", async () => {
    const res = await request(app)
      .post("/messages")
      .set("Authorization", authHeader())
      .send({ content: "", conversationId: "c1" });

    expect(res.status).toBe(400);
  });

  it("returns 403 if not member", async () => {
    prismaMock.conversationMember.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/messages")
      .set("Authorization", authHeader())
      .send({ content: "hello", conversationId: "c1" });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /messages/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates own message", async () => {
    prismaMock.message.findUnique.mockResolvedValue({ senderId: "user1", conversationId: "c1" } as any);
    prismaMock.message.update.mockResolvedValue({ ...message, content: "edited" } as any);

    const res = await request(app)
      .patch("/messages/m1")
      .set("Authorization", authHeader())
      .send({ content: "edited" });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe("edited");
  });

  it("returns 403 for other user message", async () => {
    prismaMock.message.findUnique.mockResolvedValue({ senderId: "other", conversationId: "c1" } as any);

    const res = await request(app)
      .patch("/messages/m1")
      .set("Authorization", authHeader())
      .send({ content: "edited" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /messages/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes own message", async () => {
    prismaMock.message.findUnique.mockResolvedValue({ senderId: "user1", conversationId: "c1" } as any);
    prismaMock.message.delete.mockResolvedValue({} as any);

    const res = await request(app)
      .delete("/messages/m1")
      .set("Authorization", authHeader());

    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown message", async () => {
    prismaMock.message.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/messages/m1")
      .set("Authorization", authHeader());

    expect(res.status).toBe(404);
  });
});
