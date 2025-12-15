import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

export const ICompleteTheSentenceQuestionSchema = z.object({
  left_clause: z.string().max(2000).trim(),
  right_clause: z.string().max(2000).trim(),
  conjunctions: z.array(z.string().max(64)).min(1),
  explanation: z.string().max(2000).trim().optional(),
});

export const CreateCompleteTheSentenceSchema = z.object({
  title: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail: fileSchema({}),
  is_published: StringToBooleanSchema.default(false),
  questions: StringToObjectSchema(
    z.array(ICompleteTheSentenceQuestionSchema).min(1).max(50),
  ),
});

export type ICreateCompleteTheSentence = z.infer<
  typeof CreateCompleteTheSentenceSchema
>;

// Keep old schemas for backward compatibility
export const ICompleteTheSentenceGameSchema = z.object({
  questions: z.array(ICompleteTheSentenceQuestionSchema).min(1),
});
