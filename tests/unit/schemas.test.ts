import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../../src/schemas/auth.schema.js";
import { sendMessageSchema, updateMessageSchema, getMessagesQuerySchema } from "../../src/schemas/message.schema.js";
import { createConversationSchema } from "../../src/schemas/conversation.schema.js";
import { updateUserSchema } from "../../src/schemas/user.schema.js";

describe("auth schemas", () => {
  it("registerSchema accepts valid input", () => {
    const result = registerSchema.safeParse({ username: "alice", email: "a@b.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("registerSchema rejects missing email", () => {
    const result = registerSchema.safeParse({ username: "alice", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("loginSchema accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("message schemas", () => {
  it("sendMessageSchema accepts content + conversationId", () => {
    const result = sendMessageSchema.safeParse({ content: "hello", conversationId: "c1" });
    expect(result.success).toBe(true);
  });

  it("sendMessageSchema accepts optional attachmentIds", () => {
    const result = sendMessageSchema.safeParse({ content: "hi", conversationId: "c1", attachmentIds: ["a1"] });
    expect(result.success).toBe(true);
  });

  it("sendMessageSchema rejects empty content", () => {
    const result = sendMessageSchema.safeParse({ content: "", conversationId: "c1" });
    expect(result.success).toBe(false);
  });

  it("sendMessageSchema rejects too many attachments", () => {
    const ids = Array.from({ length: 11 }, (_, i) => `a${i}`);
    const result = sendMessageSchema.safeParse({ content: "hi", conversationId: "c1", attachmentIds: ids });
    expect(result.success).toBe(false);
  });

  it("updateMessageSchema accepts valid content", () => {
    const result = updateMessageSchema.safeParse({ content: "edited" });
    expect(result.success).toBe(true);
  });

  it("getMessagesQuerySchema defaults limit to 50", () => {
    const result = getMessagesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(50);
  });
});

describe("conversation schema", () => {
  it("accepts valid input", () => {
    const result = createConversationSchema.safeParse({ memberIds: ["u1"] });
    expect(result.success).toBe(true);
  });

  it("rejects empty memberIds", () => {
    const result = createConversationSchema.safeParse({ memberIds: [] });
    expect(result.success).toBe(false);
  });
});

describe("user schema", () => {
  it("accepts username update", () => {
    const result = updateUserSchema.safeParse({ username: "newname" });
    expect(result.success).toBe(true);
  });

  it("rejects too short username", () => {
    const result = updateUserSchema.safeParse({ username: "ab" });
    expect(result.success).toBe(false);
  });
});
