import { z } from "zod/v4";

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  conversationId: z.string(),
  replyToId: z.string().optional(),
  attachmentIds: z.array(z.string()).max(10).optional(),
});

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
