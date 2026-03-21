import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { authenticate } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/ratelimit.js";
import { uploadImage, uploadAttachment } from "../middleware/upload.js";
import { AppError } from "../utils/errors.js";
import * as uploadService from "../services/upload.service.js";
import * as conversationService from "../services/conversation.service.js";
import { prisma } from "../config/db.js";
import { NotFoundError } from "../utils/errors.js";
import { toSelfUser } from "../mappers/user.mapper.js";
import { generateSnowflake } from "@/utils/snowflake.js";
import { toAttachment } from "../mappers/attachment.mapper.js";

const router: RouterType = Router();

router.use(authenticate);
router.use(userRateLimit);

function requireFile(req: Request): Express.Multer.File {
  if (!req.file) throw new AppError(400, "No file provided");
  return req.file;
}

router.put(
  "/avatar",
  uploadImage.single("file"),
  async (req: Request, res: Response) => {
    const current = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { avatarUrl: true },
    });
    if (!current) throw new NotFoundError("User not found");

    const file = requireFile(req);
    const url = await uploadService.uploadFile("avatars", file);

    if (current.avatarUrl) {
      await uploadService.deleteFile(current.avatarUrl);
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { avatarUrl: url },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    res.json(toSelfUser(user));
  },
);

router.put(
  "/conversations/:id/icon",
  uploadImage.single("file"),
  async (req: Request, res: Response) => {
    const conversationId = req.params.id as string;
    await conversationService.assertMember(req.userId!, conversationId);

    const current = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { iconUrl: true, isGroup: true, ownerId: true },
    });
    if (!current) throw new NotFoundError("Conversation not found");
    if (!current.isGroup)
      throw new AppError(
        400,
        "Only group conversations can have an icon",
      );
    if (current.ownerId !== req.userId)
      throw new AppError(
        403,
        "Only the group owner can change the icon",
      );

    const file = requireFile(req);
    const url = await uploadService.uploadFile("icons", file);

    if (current.iconUrl) {
      await uploadService.deleteFile(current.iconUrl);
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { iconUrl: url },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    const { toConversation } =
      await import("../mappers/conversation.mapper.js");
    res.json(toConversation(conversation));
  },
);

router.post(
  "/attachments",
  uploadAttachment.single("file"),
  async (req: Request, res: Response) => {
    const file = requireFile(req);
    const url = await uploadService.uploadFile("attachments", file);

    const attachment = await prisma.attachment.create({
      data: {
        id: generateSnowflake(),
        url,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploaderId: req.userId!,
      },
    });

    res.status(201).json(toAttachment(attachment));
  },
);

export default router;
