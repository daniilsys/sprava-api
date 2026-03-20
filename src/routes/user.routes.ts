import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateUserSchema } from "../schemas/user.schema.js";
import * as userService from "../services/user.service.js";
import { userRateLimit } from "../middleware/ratelimit.js";

const router: RouterType = Router();

router.use(authenticate);
router.use(userRateLimit);

router.get("/me", async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.userId!);
  res.json(user);
});

router.patch("/me", validate(updateUserSchema), async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.userId!, req.body);
  res.json(user);
});

router.get("/search", async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const users = await userService.searchUsers(query, req.userId!);
  res.json(users);
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id as string);
  res.json(user);
});

export default router;
