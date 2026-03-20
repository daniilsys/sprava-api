import crypto from "node:crypto";
import path from "node:path";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, R2_BUCKET, R2_PUBLIC_URL } from "../config/s3.js";

function objectKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName) || ".bin";
  const id = crypto.randomUUID();
  return `${folder}/${id}${ext}`;
}

export async function uploadFile(
  folder: string,
  file: Express.Multer.File,
): Promise<string> {
  const key = objectKey(folder, file.originalname);

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith(R2_PUBLIC_URL)) return;
  const key = url.slice(R2_PUBLIC_URL.length + 1);

  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );
}
