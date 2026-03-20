import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { generateSnowflake } from "@/utils/snowflake.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";
import { toSelfUser } from "../mappers/user.mapper.js";

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function register(input: RegisterInput) {
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (exists) {
    throw new ConflictError("Email ou nom d'utilisateur déjà pris");
  }

  const user = await prisma.user.create({
    data: {
      id: generateSnowflake(),
      username: input.username,
      email: input.email,
      password: await hashPassword(input.password),
    },
  });

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      id: generateSnowflake(),
      token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return {
    user: toSelfUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await comparePassword(input.password, user.password))) {
    throw new UnauthorizedError("Identifiants invalides");
  }

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: {
      id: generateSnowflake(),
      token: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      userId: user.id,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return {
    user: toSelfUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refresh(token: string) {
  const payload = verifyRefreshToken(token);
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const stored = await prisma.refreshToken.findUnique({
    where: { token: hash },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token invalide ou expiré");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = signAccessToken({ userId: payload.userId });
  const newRefreshToken = signRefreshToken({ userId: payload.userId });

  await prisma.refreshToken.create({
    data: {
      id: generateSnowflake(),
      token: crypto.createHash("sha256").update(newRefreshToken).digest("hex"),
      userId: payload.userId,
      expiresAt: refreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.refreshToken.deleteMany({ where: { token: hash } });
}
