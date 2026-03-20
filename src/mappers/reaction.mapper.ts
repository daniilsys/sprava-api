import type { Reaction, User } from "@prisma/client";
import { toPublicUser } from "./user.mapper.js";

type ReactionRow = Reaction & {
  user: Pick<User, "id" | "username" | "avatarUrl">;
};

export function toReaction(reaction: ReactionRow) {
  return {
    userId: reaction.userId,
    messageId: reaction.messageId,
    emoji: reaction.emoji,
    createdAt: reaction.createdAt,
    user: toPublicUser(reaction.user),
  };
}
