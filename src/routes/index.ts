import { Router } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import uploadRoutes from "./upload.routes.js";
import friendRoutes from "./friend.routes.js";

const router: RouterType = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/upload", uploadRoutes);
router.use("/friends", friendRoutes);

export default router;
