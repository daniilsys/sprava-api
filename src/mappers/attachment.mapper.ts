import type { Attachment } from "@prisma/client";

export function toAttachment(attachment: Attachment) {
  return {
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    messageId: attachment.messageId,
    createdAt: attachment.createdAt,
  };
}
