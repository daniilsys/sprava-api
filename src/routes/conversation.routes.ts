import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createConversationSchema, addMembersSchema } from "../schemas/conversation.schema.js";
import * as conversationService from "../services/conversation.service.js";
import * as readStateService from "../services/readstate.service.js";
import { userRateLimit } from "../middleware/ratelimit.js";

const router: RouterType = Router();

router.use(authenticate);
router.use(userRateLimit);

router.post(
  "/",
  validate(createConversationSchema),
  async (req: Request, res: Response) => {
    const conversation = await conversationService.createConversation(
      req.userId!,
      req.body,
    );
    res.status(201).json(conversation);
  },
);

router.get("/", async (req: Request, res: Response) => {
  const conversations = await conversationService.getUserConversations(
    req.userId!,
  );
  res.json(conversations);
});

router.get("/unread/counts", async (req: Request, res: Response) => {
  const counts = await readStateService.getUnreadCounts(req.userId!);
  res.json(counts);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await conversationService.assertMember(req.userId!, id);
  const conversation = await conversationService.getConversationById(id);
  res.json(conversation);
});

router.post("/:id/members", validate(addMembersSchema), async (req: Request, res: Response) => {
  const conversation = await conversationService.addMembers(
    req.userId!,
    req.params.id as string,
    req.body,
  );
  res.json(conversation);
});

router.delete("/:id/members/:userId", async (req: Request, res: Response) => {
  await conversationService.removeMember(
    req.userId!,
    req.params.id as string,
    req.params.userId as string,
  );
  res.status(204).end();
});

router.put("/:id/owner", async (req: Request, res: Response) => {
  const { userId } = req.body;
  await conversationService.transferOwnership(req.userId!, req.params.id as string, userId);
  res.status(204).end();
});

router.post("/:id/leave", async (req: Request, res: Response) => {
  await conversationService.leaveConversation(req.userId!, req.params.id as string);
  res.status(204).end();
});

router.put("/:id/read", async (req: Request, res: Response) => {
  const { messageId } = req.body;
  const readState = await readStateService.markAsRead(
    req.userId!,
    req.params.id as string,
    messageId,
  );
  res.json(readState);
});

router.get("/:id/readstates", async (req: Request, res: Response) => {
  const readStates = await readStateService.getReadStates(
    req.userId!,
    req.params.id as string,
  );
  res.json(readStates);
});

export default router;
