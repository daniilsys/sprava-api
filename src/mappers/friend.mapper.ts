import type { FriendRequest, User } from "@prisma/client";
import { toPublicUser } from "./user.mapper.js";

type FriendRequestRow = FriendRequest & {
  sender: Pick<User, "id" | "username" | "avatarUrl">;
  receiver: Pick<User, "id" | "username" | "avatarUrl">;
};

export function toFriendRequest(request: FriendRequestRow) {
  return {
    id: request.id,
    senderId: request.senderId,
    receiverId: request.receiverId,
    status: request.status,
    createdAt: request.createdAt,
    sender: toPublicUser(request.sender),
    receiver: toPublicUser(request.receiver),
  };
}

/** Retourne le user "ami" du point de vue de userId */
export function toFriend(request: FriendRequestRow, userId: string) {
  const friend = request.senderId === userId ? request.receiver : request.sender;
  return {
    ...toPublicUser(friend),
    since: request.updatedAt,
  };
}
