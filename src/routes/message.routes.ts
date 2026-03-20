import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema, getMessagesQuerySchema, updateMessageSchema } from "../schemas/message.schema.js";
import * as messageService from "../services/message.service.js";
import * as reactionService from "../services/reaction.service.js";
import { userRateLimit } from "../middleware/ratelimit.js";

const router: RouterType = Router();

router.use(authenticate);
router.use(userRateLimit);

router.post("/", validate(sendMessageSchema), async (req: Request, res: Response) => {
  const message = await messageService.sendMessage(req.userId!, req.body);
  res.status(201).json(message);
});

router.get("/:conversationId", validate(getMessagesQuerySchema, "query"), async (req: Request, res: Response) => {
  const messages = await messageService.getMessages(
    req.userId!,
    req.params.conversationId as string,
    req.query as any,
  );
  res.json(messages);
});

router.patch("/:id", validate(updateMessageSchema), async (req: Request, res: Response) => {
  const message = await messageService.updateMessage(req.userId!, req.params.id as string, req.body);
  res.json(message);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await messageService.deleteMessage(req.userId!, req.params.id as string);
  res.status(204).end();
});

router.put("/:messageId/reactions/:emoji", async (req: Request, res: Response) => {
  const reaction = await reactionService.addReaction(
    req.userId!,
    req.params.messageId as string,
    req.params.emoji as string,
  );
  res.status(201).json(reaction);
});

router.delete("/:messageId/reactions/:emoji", async (req: Request, res: Response) => {
  await reactionService.removeReaction(
    req.userId!,
    req.params.messageId as string,
    req.params.emoji as string,
  );
  res.status(204).end();
});

router.get("/:messageId/reactions", async (req: Request, res: Response) => {
  const reactions = await reactionService.getReactions(
    req.userId!,
    req.params.messageId as string,
  );
  res.json(reactions);
});

export default router;
