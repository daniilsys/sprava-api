import { prisma } from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";
import type { UpdateUserInput } from "../schemas/user.schema.js";
import { toSelfUser, toPublicUser } from "../mappers/user.mapper.js";
import { emitUserUpdate } from "../socket/emitters.js";
import { getBlockedIds } from "./friend.service.js";

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw new NotFoundError("Utilisateur introuvable");
  return toSelfUser(user);
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, email: true, avatarUrl: true, createdAt: true },
  });
  const mapped = toSelfUser(user);
  emitUserUpdate(id, mapped);
  return mapped;
}

export async function searchUsers(query: string, userId: string) {
  const blockedIds = await getBlockedIds(userId);

  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      id: { notIn: [userId, ...blockedIds] },
    },
    select: { id: true, username: true, avatarUrl: true },
    take: 20,
  });
  return users.map(toPublicUser);
}
