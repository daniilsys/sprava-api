import { vi } from "vitest";

vi.mock("../../src/socket/emitters.js", () => ({
  emitNewMessage: vi.fn(),
  emitMessageUpdate: vi.fn(),
  emitMessageDelete: vi.fn(),
  emitNewConversation: vi.fn(),
  emitUserUpdate: vi.fn(),
  emitFriendRequest: vi.fn(),
  emitFriendRequestUpdate: vi.fn(),
  emitFriendRemove: vi.fn(),
  emitToConversation: vi.fn(),
  emitToUser: vi.fn(),
  joinConversationRoom: vi.fn(),
}));
