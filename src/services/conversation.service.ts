import { prisma } from "../config/db.js";
import { ForbiddenError, NotFoundError } from "../utils/errors.js";
import type { CreateConversationInput, AddMembersInput } from "../schemas/conversation.schema.js";
import { AppError } from "../utils/errors.js";
import { generateSnowflake } from "../utils/snowflake.js";
import {
  toConversation,
  toConversationWithLastMessage,
} from "../mappers/conversation.mapper.js";
import { emitNewConversation, emitToConversation, joinConversationRoom } from "../socket/emitters.js";
import { isBlocked } from "./friend.service.js";

export async function createConversation(
  userId: string,
  input: CreateConversationInput,
) {
  const allMemberIds = [...new Set([userId, ...input.memberIds])];
  const isGroup = allMemberIds.length > 2;

  if (!isGroup) {
    for (const memberId of input.memberIds) {
      if (await isBlocked(userId, memberId)) {
        throw new ForbiddenError("Cannot create a conversation with a blocked user");
      }
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      id: generateSnowflake(),
      name: input.name,
      isGroup,
      ...(isGroup && { ownerId: userId }),
      members: {
        createMany: {
          data: allMemberIds.map((id) => ({ userId: id })),
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });
  const mapped = toConversation(conversation);

  for (const id of allMemberIds) {
    await joinConversationRoom(id, conversation.id);
  }
  emitNewConversation(allMemberIds, mapped);

  return mapped;
}

export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return conversations.map(toConversationWithLastMessage);
}

export async function assertMember(userId: string, conversationId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  if (!member)
    throw new ForbiddenError("You are not a member of this conversation");
}

export async function assertNotBlockedInConversation(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true, members: { select: { userId: true } } },
  });
  if (!conversation || conversation.isGroup) return;

  const otherMember = conversation.members.find((m) => m.userId !== userId);
  if (otherMember && (await isBlocked(userId, otherMember.userId))) {
    throw new ForbiddenError("Cannot send a message in this conversation");
  }
}

const MAX_GROUP_MEMBERS = 50;

async function assertGroupOwner(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true, ownerId: true },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (!conversation.isGroup) throw new AppError(400, "This action is only available for group conversations");
  if (conversation.ownerId !== userId) throw new ForbiddenError("Only the group owner can perform this action");
}

export async function addMembers(userId: string, conversationId: string, input: AddMembersInput) {
  await assertMember(userId, conversationId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true, _count: { select: { members: true } } },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (!conversation.isGroup) throw new AppError(400, "Cannot add members to a DM");

  const newCount = conversation._count.members + input.memberIds.length;
  if (newCount > MAX_GROUP_MEMBERS) {
    throw new AppError(400, `Group cannot exceed ${MAX_GROUP_MEMBERS} members`);
  }

  const existing = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { in: input.memberIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((m) => m.userId));
  const newMemberIds = input.memberIds.filter((id) => !existingIds.has(id));

  if (newMemberIds.length === 0) return getConversationById(conversationId);

  await prisma.conversationMember.createMany({
    data: newMemberIds.map((id) => ({ userId: id, conversationId })),
  });

  for (const id of newMemberIds) {
    await joinConversationRoom(id, conversationId);
  }

  const updated = await getConversationById(conversationId);
  emitToConversation(conversationId, "conversation:members:add", {
    conversationId,
    memberIds: newMemberIds,
  });
  return updated;
}

export async function removeMember(userId: string, conversationId: string, targetId: string) {
  await assertGroupOwner(userId, conversationId);

  if (userId === targetId) throw new AppError(400, "Cannot remove yourself");

  const member = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId: targetId, conversationId } },
  });
  if (!member) throw new NotFoundError("Member not found in this group");

  await prisma.conversationMember.delete({
    where: { userId_conversationId: { userId: targetId, conversationId } },
  });

  emitToConversation(conversationId, "conversation:members:remove", {
    conversationId,
    userId: targetId,
  });
}

export async function transferOwnership(userId: string, conversationId: string, newOwnerId: string) {
  await assertGroupOwner(userId, conversationId);

  if (userId === newOwnerId) throw new AppError(400, "You are already the owner");

  const member = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId: newOwnerId, conversationId } },
  });
  if (!member) throw new NotFoundError("Member not found in this group");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { ownerId: newOwnerId },
  });

  emitToConversation(conversationId, "conversation:owner:update", {
    conversationId,
    ownerId: newOwnerId,
  });
}

export async function leaveConversation(userId: string, conversationId: string) {
  await assertMember(userId, conversationId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true, ownerId: true },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (!conversation.isGroup) throw new AppError(400, "Cannot leave a DM");

  await prisma.conversationMember.delete({
    where: { userId_conversationId: { userId, conversationId } },
  });

  if (conversation.ownerId === userId) {
    const nextOwner = await prisma.conversationMember.findFirst({
      where: { conversationId },
      orderBy: { joinedAt: "asc" },
      select: { userId: true },
    });

    if (nextOwner) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { ownerId: nextOwner.userId },
      });
      emitToConversation(conversationId, "conversation:owner:update", {
        conversationId,
        ownerId: nextOwner.userId,
      });
    } else {
      await prisma.conversation.delete({ where: { id: conversationId } });
      return;
    }
  }

  emitToConversation(conversationId, "conversation:members:remove", {
    conversationId,
    userId,
  });
}

export async function getConversationById(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  return toConversation(conversation);
}
