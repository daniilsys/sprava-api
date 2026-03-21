import { prisma } from "../config/db.js";
import { assertMember } from "./conversation.service.js";
import type {
  SendMessageInput,
  GetMessagesQuery,
} from "../schemas/message.schema.js";
import { generateSnowflake } from "@/utils/snowflake.js";
import { toMessage } from "../mappers/message.mapper.js";
import { AppError } from "../utils/errors.js";
import { emitNewMessage, emitMessageUpdate, emitMessageDelete } from "../socket/emitters.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type { UpdateMessageInput } from "../schemas/message.schema.js";
import { assertNotBlockedInConversation } from "./conversation.service.js";

const messageInclude = {
  sender: { select: { id: true, username: true, avatarUrl: true } },
  attachments: true,
  reactions: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
  replyTo: { include: { sender: { select: { id: true, username: true, avatarUrl: true } } } },
} as const;

export async function sendMessage(userId: string, input: SendMessageInput) {
  await assertMember(userId, input.conversationId);
  await assertNotBlockedInConversation(userId, input.conversationId);

  const messageId = generateSnowflake();

  if (input.attachmentIds?.length) {
    const count = await prisma.attachment.count({
      where: {
        id: { in: input.attachmentIds },
        uploaderId: userId,
        messageId: null,
      },
    });
    if (count !== input.attachmentIds.length) {
      throw new AppError(400, "One or more attachments are invalid");
    }

    await prisma.attachment.updateMany({
      where: { id: { in: input.attachmentIds } },
      data: { messageId },
    });
  }

  if (input.replyToId) {
    const parent = await prisma.message.findUnique({
      where: { id: input.replyToId },
      select: { conversationId: true },
    });
    if (!parent || parent.conversationId !== input.conversationId) {
      throw new AppError(400, "Reply message not found in this conversation");
    }
  }

  const message = await prisma.message.create({
    data: {
      id: messageId,
      content: input.content,
      conversationId: input.conversationId,
      senderId: userId,
      replyToId: input.replyToId,
    },
    include: messageInclude,
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  const mapped = toMessage(message);
  emitNewMessage(input.conversationId, mapped);
  return mapped;
}

export async function getMessages(
  userId: string,
  conversationId: string,
  query: GetMessagesQuery,
) {
  await assertMember(userId, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    ...(query.cursor && {
      cursor: { id: query.cursor },
      skip: 1,
    }),
  });
  return messages.map(toMessage);
}

async function getOwnMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, conversationId: true, deletedAt: true },
  });
  if (!message || message.deletedAt) throw new NotFoundError("Message not found");
  if (message.senderId !== userId) {
    throw new ForbiddenError("You can only act on your own messages");
  }
  return message;
}

export async function updateMessage(
  userId: string,
  messageId: string,
  input: UpdateMessageInput,
) {
  const existing = await getOwnMessage(userId, messageId);

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { content: input.content },
    include: messageInclude,
  });

  const mapped = toMessage(message);
  emitMessageUpdate(existing.conversationId, mapped);
  return mapped;
}

export async function deleteMessage(userId: string, messageId: string) {
  const existing = await getOwnMessage(userId, messageId);

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  emitMessageDelete(existing.conversationId, messageId);
}
