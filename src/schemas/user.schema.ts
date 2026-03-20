import { z } from "zod/v4";

export const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
