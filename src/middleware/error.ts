import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/errors.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: "File exceeds maximum allowed size",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };
    res.status(400).json({ error: messages[err.code] ?? "File upload error" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
