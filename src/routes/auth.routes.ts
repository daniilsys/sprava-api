import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express-serve-static-core";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";
import { ipRateLimit } from "../middleware/ratelimit.js";

const router: RouterType = Router();

router.use(ipRateLimit);

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  res.json(result);
});

router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  res.status(204).end();
});

export default router;
