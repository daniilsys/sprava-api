import type { Attachment, Message, Reaction, User } from "@prisma/client";
import { toPublicUser } from "./user.mapper.js";
import { toAttachment } from "./attachment.mapper.js";

type ReactionWithUser = Reaction & {
  user: Pick<User, "id" | "username" | "avatarUrl">;
};

type ReplyRow = Pick<Message, "id" | "content" | "senderId" | "deletedAt"> & {
  sender: Pick<User, "id" | "username" | "avatarUrl">;
};

type MessageRow = Message & {
  sender: Pick<User, "id" | "username" | "avatarUrl">;
  attachments?: Attachment[];
  reactions?: ReactionWithUser[];
  replyTo?: ReplyRow | null;
};

function groupReactions(reactions: ReactionWithUser[]) {
  const map = new Map<string, { emoji: string; count: number; users: ReturnType<typeof toPublicUser>[] }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, users: [] };
    entry.count++;
    entry.users.push(toPublicUser(r.user));
    map.set(r.emoji, entry);
  }
  return [...map.values()];
}

export function toMessage(message: MessageRow) {
  const deleted = !!message.deletedAt;

  return {
    id: message.id,
    content: deleted ? null : message.content,
    conversationId: message.conversationId,
    senderId: message.senderId,
    deleted,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    sender: toPublicUser(message.sender),
    attachments: deleted ? [] : (message.attachments?.map(toAttachment) ?? []),
    reactions: deleted ? [] : groupReactions(message.reactions ?? []),
    replyTo: message.replyTo ? {
      id: message.replyTo.id,
      content: message.replyTo.deletedAt ? null : message.replyTo.content.slice(0, 200),
      senderId: message.replyTo.senderId,
      sender: toPublicUser(message.replyTo.sender),
      deleted: !!message.replyTo.deletedAt,
    } : null,
  };
}
