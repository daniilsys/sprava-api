import "../mocks/prisma.js";
import "../mocks/socket.js";
import "../mocks/redis.js";

import { signAccessToken } from "../../src/utils/jwt.js";
import app from "../../src/app.js";

export { app };

export function authHeader(userId = "user1") {
  return `Bearer ${signAccessToken({ userId })}`;
}
