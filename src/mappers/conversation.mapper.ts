import type { Conversation, ConversationMember, Message, User } from "@prisma/client";
import { toPublicUser } from "./user.mapper.js";
import { toMessage } from "./message.mapper.js";

type MemberRow = ConversationMember & {
  user: Pick<User, "id" | "username" | "avatarUrl">;
};

type MessageRow = Message & {
  sender: Pick<User, "id" | "username" | "avatarUrl">;
};

type ConversationRow = Conversation & {
  members: MemberRow[];
};

type ConversationWithLastMessage = ConversationRow & {
  messages: MessageRow[];
};

function mapMembers(members: MemberRow[]) {
  return members.map((m) => ({
    userId: m.userId,
    joinedAt: m.joinedAt,
    user: toPublicUser(m.user),
  }));
}

export function toConversation(conversation: ConversationRow) {
  return {
    id: conversation.id,
    name: conversation.name,
    iconUrl: conversation.iconUrl,
    isGroup: conversation.isGroup,
    ownerId: conversation.ownerId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    members: mapMembers(conversation.members),
  };
}

export function toConversationWithLastMessage(conversation: ConversationWithLastMessage) {
  return {
    ...toConversation(conversation),
    lastMessage: conversation.messages[0] ? toMessage(conversation.messages[0]) : null,
  };
}
