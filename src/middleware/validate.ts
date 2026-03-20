import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v4";
import { AppError } from "../utils/errors.js";

type Target = "body" | "query" | "params";

export function validate(schema: z.ZodType, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = z.prettifyError(result.error);
      throw new AppError(400, message);
    }
    req[target] = result.data;
    next();
  };
}
