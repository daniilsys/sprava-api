import multer from "multer";
import { AppError } from "../utils/errors.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_ATTACHMENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "text/plain",
  "audio/mpeg",
  "audio/ogg",
  "video/mp4",
  "video/webm",
];

function fileFilter(allowedTypes: string[]) {
  return (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Unsupported file type"));
    }
  };
}

/** Upload image (avatar, icon) — max 5 MB */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

/** Upload attachment — max 25 MB */
export const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_ATTACHMENT_TYPES),
});
