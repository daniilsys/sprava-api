import { prisma } from "../config/db.js";
import { generateSnowflake } from "../utils/snowflake.js";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import { toFriendRequest, toFriend } from "../mappers/friend.mapper.js";
import { emitFriendRequest, emitFriendRequestUpdate, emitFriendRemove } from "../socket/emitters.js";

const friendRequestInclude = {
  sender: { select: { id: true, username: true, avatarUrl: true } },
  receiver: { select: { id: true, username: true, avatarUrl: true } },
} as const;

export async function assertNotBlocked(userId: string, targetId: string) {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetId },
        { blockerId: targetId, blockedId: userId },
      ],
    },
  });
  if (block) throw new ForbiddenError("Action blocked between these users");
}

export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });
  return !!block;
}

export async function getBlockedIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    throw new AppError(400, "Cannot send a friend request to yourself");
  }

  await assertNotBlocked(senderId, receiverId);

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new NotFoundError("User not found");

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw new ConflictError("Already friends");
    }
    if (existing.senderId === receiverId) {
      return acceptFriendRequest(senderId, existing.id);
    }
    throw new ConflictError("Friend request already sent");
  }

  const request = await prisma.friendRequest.create({
    data: { id: generateSnowflake(), senderId, receiverId },
    include: friendRequestInclude,
  });

  const mapped = toFriendRequest(request);
  emitFriendRequest(receiverId, mapped);
  return mapped;
}

export async function acceptFriendRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: friendRequestInclude,
  });
  if (!request) throw new NotFoundError("Friend request not found");
  if (request.receiverId !== userId) {
    throw new ForbiddenError("Only the receiver can accept this request");
  }
  if (request.status !== "PENDING") {
    throw new AppError(400, "This request is no longer pending");
  }

  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
    include: friendRequestInclude,
  });

  const mapped = toFriendRequest(updated);
  emitFriendRequestUpdate(request.senderId, mapped);
  emitFriendRequestUpdate(request.receiverId, mapped);
  return mapped;
}

export async function declineFriendRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: friendRequestInclude,
  });
  if (!request) throw new NotFoundError("Friend request not found");
  if (request.receiverId !== userId) {
    throw new ForbiddenError("Only the receiver can decline this request");
  }
  if (request.status !== "PENDING") {
    throw new AppError(400, "This request is no longer pending");
  }

  await prisma.friendRequest.delete({ where: { id: requestId } });
}

export async function cancelFriendRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError("Friend request not found");
  if (request.senderId !== userId) {
    throw new ForbiddenError("Only the sender can cancel this request");
  }
  if (request.status !== "PENDING") {
    throw new AppError(400, "This request is no longer pending");
  }

  await prisma.friendRequest.delete({ where: { id: requestId } });
}

export async function getFriends(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: friendRequestInclude,
  });
  return requests.map((r) => toFriend(r, userId));
}

export async function getPendingRequests(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: friendRequestInclude,
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toFriendRequest);
}

export async function getSentRequests(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { senderId: userId, status: "PENDING" },
    include: friendRequestInclude,
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toFriendRequest);
}

export async function removeFriend(userId: string, friendId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });
  if (!request) throw new NotFoundError("Friend not found");

  await prisma.friendRequest.delete({ where: { id: request.id } });
  emitFriendRemove(friendId, userId);
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new AppError(400, "Cannot block yourself");
  }

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new NotFoundError("User not found");

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  if (existing) throw new ConflictError("User already blocked");

  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: blockerId, receiverId: blockedId },
        { senderId: blockedId, receiverId: blockerId },
      ],
    },
  });

  await prisma.block.create({ data: { blockerId, blockedId } });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  if (!existing) throw new NotFoundError("User is not blocked");

  await prisma.block.delete({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
}

export async function getBlockedUsers(userId: string) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map((b) => ({
    ...{ id: b.blocked.id, username: b.blocked.username, avatarUrl: b.blocked.avatarUrl },
    blockedAt: b.createdAt,
  }));
}
