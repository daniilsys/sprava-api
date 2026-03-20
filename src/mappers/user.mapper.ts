import type { User } from "@prisma/client";

type UserRow = Pick<User, "id" | "username" | "avatarUrl">;
type UserSelfRow = Pick<User, "id" | "username" | "email" | "avatarUrl" | "createdAt">;

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

export function toSelfUser(user: UserSelfRow) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
