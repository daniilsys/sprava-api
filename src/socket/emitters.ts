import { getIO } from "./index.js";

function toRoom(prefix: string, id: string) {
  return `${prefix}:${id}`;
}

export function emitToConversation(conversationId: string, event: string, data: unknown) {
  getIO()?.to(toRoom("conversation", conversationId)).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  getIO()?.to(toRoom("user", userId)).emit(event, data);
}

export async function joinConversationRoom(userId: string, conversationId: string) {
  const sockets = await getIO()?.in(toRoom("user", userId)).fetchSockets();
  for (const s of sockets ?? []) {
    s.join(toRoom("conversation", conversationId));
  }
}

export function emitNewMessage(conversationId: string, message: unknown) {
  emitToConversation(conversationId, "message:create", message);
}

export function emitNewConversation(memberIds: string[], conversation: unknown) {
  for (const id of memberIds) {
    emitToUser(id, "conversation:create", conversation);
  }
}

export function emitMessageUpdate(conversationId: string, message: unknown) {
  emitToConversation(conversationId, "message:update", message);
}

export function emitMessageDelete(conversationId: string, messageId: string) {
  emitToConversation(conversationId, "message:delete", { id: messageId, conversationId });
}

export function emitUserUpdate(userId: string, user: unknown) {
  emitToUser(userId, "user:update", user);
}

export function emitFriendRequest(receiverId: string, request: unknown) {
  emitToUser(receiverId, "friend:request", request);
}

export function emitFriendRequestUpdate(userId: string, request: unknown) {
  emitToUser(userId, "friend:request:update", request);
}

export function emitFriendRemove(userId: string, removedBy: string) {
  emitToUser(userId, "friend:remove", { userId: removedBy });
}

export function emitReactionAdd(conversationId: string, reaction: unknown) {
  emitToConversation(conversationId, "reaction:add", reaction);
}

export function emitReactionRemove(conversationId: string, data: { userId: string; messageId: string; emoji: string }) {
  emitToConversation(conversationId, "reaction:remove", data);
}

export function emitReadState(conversationId: string, data: { userId: string; conversationId: string; lastMessageId: string }) {
  emitToConversation(conversationId, "readstate:update", data);
}
