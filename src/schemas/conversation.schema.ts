import { z } from "zod/v4";

export const createConversationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  memberIds: z.array(z.string()).min(1).max(49),
});

export const addMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1).max(49),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
