import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { authenticate } from "../middleware/auth.js";
import { userRateLimit } from "../middleware/ratelimit.js";
import * as friendService from "../services/friend.service.js";

const router: RouterType = Router();

router.use(authenticate);
router.use(userRateLimit);

router.get("/", async (req: Request, res: Response) => {
  const friends = await friendService.getFriends(req.userId!);
  res.json(friends);
});

router.delete("/:friendId", async (req: Request, res: Response) => {
  await friendService.removeFriend(req.userId!, req.params.friendId as string);
  res.status(204).end();
});

router.get("/requests/pending", async (req: Request, res: Response) => {
  const requests = await friendService.getPendingRequests(req.userId!);
  res.json(requests);
});

router.get("/requests/sent", async (req: Request, res: Response) => {
  const requests = await friendService.getSentRequests(req.userId!);
  res.json(requests);
});

router.post("/requests/:userId", async (req: Request, res: Response) => {
  const request = await friendService.sendFriendRequest(
    req.userId!,
    req.params.userId as string,
  );
  res.status(201).json(request);
});

router.post("/requests/:requestId/accept", async (req: Request, res: Response) => {
  const request = await friendService.acceptFriendRequest(
    req.userId!,
    req.params.requestId as string,
  );
  res.json(request);
});

router.post("/requests/:requestId/decline", async (req: Request, res: Response) => {
  await friendService.declineFriendRequest(
    req.userId!,
    req.params.requestId as string,
  );
  res.status(204).end();
});

router.delete("/requests/:requestId", async (req: Request, res: Response) => {
  await friendService.cancelFriendRequest(
    req.userId!,
    req.params.requestId as string,
  );
  res.status(204).end();
});

router.get("/blocked", async (req: Request, res: Response) => {
  const blocked = await friendService.getBlockedUsers(req.userId!);
  res.json(blocked);
});

router.post("/block/:userId", async (req: Request, res: Response) => {
  await friendService.blockUser(req.userId!, req.params.userId as string);
  res.status(204).end();
});

router.delete("/block/:userId", async (req: Request, res: Response) => {
  await friendService.unblockUser(req.userId!, req.params.userId as string);
  res.status(204).end();
});

export default router;
