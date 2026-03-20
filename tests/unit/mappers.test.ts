import { describe, it, expect } from "vitest";
import { toPublicUser, toSelfUser } from "../../src/mappers/user.mapper.js";
import { toMessage } from "../../src/mappers/message.mapper.js";
import { toConversation, toConversationWithLastMessage } from "../../src/mappers/conversation.mapper.js";
import { toAttachment } from "../../src/mappers/attachment.mapper.js";
import { toFriendRequest, toFriend } from "../../src/mappers/friend.mapper.js";

const now = new Date();

describe("user mapper", () => {
  it("toPublicUser strips email and createdAt", () => {
    const result = toPublicUser({ id: "1", username: "alice", avatarUrl: null });
    expect(result).toEqual({ id: "1", username: "alice", avatarUrl: null });
    expect(result).not.toHaveProperty("email");
  });

  it("toSelfUser includes email and createdAt", () => {
    const result = toSelfUser({ id: "1", username: "alice", email: "a@b.c", avatarUrl: null, createdAt: now });
    expect(result).toEqual({ id: "1", username: "alice", email: "a@b.c", avatarUrl: null, createdAt: now });
  });
});

describe("message mapper", () => {
  it("maps message with sender and empty attachments", () => {
    const result = toMessage({
      id: "m1", content: "hello", conversationId: "c1", senderId: "u1",
      createdAt: now, updatedAt: now,
      sender: { id: "u1", username: "alice", avatarUrl: null },
    });
    expect(result.sender).toEqual({ id: "u1", username: "alice", avatarUrl: null });
    expect(result.attachments).toEqual([]);
  });

  it("maps message with attachments", () => {
    const result = toMessage({
      id: "m1", content: "file", conversationId: "c1", senderId: "u1",
      createdAt: now, updatedAt: now,
      sender: { id: "u1", username: "alice", avatarUrl: null },
      attachments: [{ id: "a1", url: "https://cdn/f.png", filename: "f.png", mimeType: "image/png", size: 1024, messageId: "m1", uploaderId: "u1", createdAt: now }],
    });
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].filename).toBe("f.png");
  });
});

describe("conversation mapper", () => {
  const conv = {
    id: "c1", name: "test", iconUrl: null, isGroup: false, createdAt: now, updatedAt: now,
    members: [{ userId: "u1", conversationId: "c1", joinedAt: now, user: { id: "u1", username: "alice", avatarUrl: null } }],
  };

  it("toConversation maps members", () => {
    const result = toConversation(conv);
    expect(result.members[0].user.username).toBe("alice");
    expect(result.members[0]).not.toHaveProperty("conversationId");
  });

  it("toConversationWithLastMessage returns null lastMessage when no messages", () => {
    const result = toConversationWithLastMessage({ ...conv, messages: [] });
    expect(result.lastMessage).toBeNull();
  });

  it("toConversationWithLastMessage maps last message", () => {
    const result = toConversationWithLastMessage({
      ...conv,
      messages: [{
        id: "m1", content: "hi", conversationId: "c1", senderId: "u1",
        createdAt: now, updatedAt: now,
        sender: { id: "u1", username: "alice", avatarUrl: null },
      }],
    });
    expect(result.lastMessage?.content).toBe("hi");
  });
});

describe("attachment mapper", () => {
  it("maps all fields", () => {
    const result = toAttachment({ id: "a1", url: "https://cdn/f.png", filename: "f.png", mimeType: "image/png", size: 2048, messageId: "m1", uploaderId: "u1", createdAt: now });
    expect(result).toEqual({ id: "a1", url: "https://cdn/f.png", filename: "f.png", mimeType: "image/png", size: 2048, messageId: "m1", createdAt: now });
  });
});

describe("friend mapper", () => {
  const request = {
    id: "fr1", senderId: "u1", receiverId: "u2", status: "PENDING" as const,
    createdAt: now, updatedAt: now,
    sender: { id: "u1", username: "alice", avatarUrl: null },
    receiver: { id: "u2", username: "bob", avatarUrl: null },
  };

  it("toFriendRequest maps both users", () => {
    const result = toFriendRequest(request);
    expect(result.sender.username).toBe("alice");
    expect(result.receiver.username).toBe("bob");
    expect(result.status).toBe("PENDING");
  });

  it("toFriend returns the other user from sender perspective", () => {
    const result = toFriend(request, "u1");
    expect(result.username).toBe("bob");
    expect(result).toHaveProperty("since");
  });

  it("toFriend returns the other user from receiver perspective", () => {
    const result = toFriend(request, "u2");
    expect(result.username).toBe("alice");
  });
});
