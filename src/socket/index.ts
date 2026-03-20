import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Token manquant"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Token invalide"));
    }
  });

  io.on("connection", async (socket) => {
    const userId: string = socket.data.userId;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    for (const m of memberships) {
      socket.join(`conversation:${m.conversationId}`);
    }
    socket.join(`user:${userId}`);

    socket.on("typing:start", (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:start", { userId, conversationId });
    });

    socket.on("typing:stop", (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("typing:stop", { userId, conversationId });
    });

    const conversationRooms = [...socket.rooms].filter((r) =>
      r.startsWith("conversation:"),
    );
    socket.to(conversationRooms).emit("user:online", { userId });

    socket.on("disconnect", () => {
      socket.to(conversationRooms).emit("user:offline", { userId });
    });
  });

  return io;
}

export function getIO(): Server {
  return io;
}
