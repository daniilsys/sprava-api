import type { Attachment } from "@prisma/client";

export function toAttachment(attachment: Attachment) {
  return {
    id: attachment.id,
    type: attachment.type,
    url: attachment.url,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    duration: attachment.duration,
    waveform: attachment.waveform,
    messageId: attachment.messageId,
    createdAt: attachment.createdAt,
  };
}
