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
      LIMIT_FILE_SIZE: "Le fichier dépasse la taille maximale autorisée",
      LIMIT_UNEXPECTED_FILE: "Champ de fichier inattendu",
    };
    res.status(400).json({ error: messages[err.code] ?? "Erreur lors de l'upload du fichier" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
