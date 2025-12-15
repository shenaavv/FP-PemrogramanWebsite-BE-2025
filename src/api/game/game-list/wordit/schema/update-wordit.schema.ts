import z from 'zod';

import { fileSchema, StringToBooleanSchema } from '@/common';

// Schema for updating a WordIt game (all fields optional)
export const UpdateWorditSchema = z.object({
  title: z.string().min(1).max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail: fileSchema({}).optional(),
  is_published: StringToBooleanSchema.optional(),
});

export type IUpdateWordit = z.infer<typeof UpdateWorditSchema>;
