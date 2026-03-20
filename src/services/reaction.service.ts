import { prisma } from "../config/db.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { assertMember } from "./conversation.service.js";
import { toReaction } from "../mappers/reaction.mapper.js";
import { emitReactionAdd, emitReactionRemove } from "../socket/emitters.js";

const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;

function getMessageWithConversation(messageId: string) {
  return prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true },
  });
}

export async function addReaction(userId: string, messageId: string, emoji: string) {
  if (!EMOJI_REGEX.test(emoji)) {
    throw new AppError(400, "Emoji invalide");
  }

  const message = await getMessageWithConversation(messageId);
  if (!message) throw new NotFoundError("Message introuvable");

  await assertMember(userId, message.conversationId);

  const reaction = await prisma.reaction.upsert({
    where: { userId_messageId_emoji: { userId, messageId, emoji } },
    create: { userId, messageId, emoji },
    update: {},
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

  const mapped = toReaction(reaction);
  emitReactionAdd(message.conversationId, mapped);
  return mapped;
}

export async function removeReaction(userId: string, messageId: string, emoji: string) {
  const message = await getMessageWithConversation(messageId);
  if (!message) throw new NotFoundError("Message introuvable");

  await assertMember(userId, message.conversationId);

  await prisma.reaction.delete({
    where: { userId_messageId_emoji: { userId, messageId, emoji } },
  }).catch(() => {
    throw new NotFoundError("Réaction introuvable");
  });

  emitReactionRemove(message.conversationId, { userId, messageId, emoji });
}

export async function getReactions(userId: string, messageId: string) {
  const message = await getMessageWithConversation(messageId);
  if (!message) throw new NotFoundError("Message introuvable");

  await assertMember(userId, message.conversationId);

  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  return reactions.map(toReaction);
}
