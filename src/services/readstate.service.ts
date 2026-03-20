import { prisma } from "../config/db.js";
import { assertMember } from "./conversation.service.js";
import { NotFoundError } from "../utils/errors.js";
import { emitReadState } from "../socket/emitters.js";

export async function markAsRead(userId: string, conversationId: string, messageId: string) {
  await assertMember(userId, conversationId);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { conversationId: true },
  });
  if (!message || message.conversationId !== conversationId) {
    throw new NotFoundError("Message introuvable dans cette conversation");
  }

  const current = await prisma.readState.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
    select: { lastMessageId: true },
  });
  if (current && BigInt(current.lastMessageId) >= BigInt(messageId)) {
    return { userId, conversationId, lastMessageId: current.lastMessageId };
  }

  const readState = await prisma.readState.upsert({
    where: { userId_conversationId: { userId, conversationId } },
    create: { userId, conversationId, lastMessageId: messageId },
    update: { lastMessageId: messageId },
  });

  emitReadState(conversationId, { userId, conversationId, lastMessageId: messageId });
  return readState;
}

export async function getReadStates(userId: string, conversationId: string) {
  await assertMember(userId, conversationId);

  return prisma.readState.findMany({
    where: { conversationId },
    select: { userId: true, lastMessageId: true },
  });
}

export async function getUnreadCounts(userId: string) {
  const conversations = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true },
  });

  const counts = await Promise.all(
    conversations.map(async ({ conversationId }) => {
      const readState = await prisma.readState.findUnique({
        where: { userId_conversationId: { userId, conversationId } },
        select: { lastMessageId: true },
      });

      const count = await prisma.message.count({
        where: {
          conversationId,
          ...(readState && { id: { gt: readState.lastMessageId } }),
        },
      });

      return { conversationId, unreadCount: count };
    }),
  );

  return counts.filter((c) => c.unreadCount > 0);
}
