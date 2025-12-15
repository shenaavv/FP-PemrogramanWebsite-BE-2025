import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

// Schema for a single question
export const WorditQuestionSchema = z.object({
  sentence: z.string().min(1).max(500).trim(),
  options: z.array(z.string().min(1).max(100).trim()).min(2).max(6),
  correct_answer: z.string().min(1).max(100).trim(),
  explanation: z.string().max(500).trim().optional(),
});

// Schema for creating a new WordIt game
export const CreateWorditSchema = z.object({
  title: z.string().min(1).max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail: fileSchema({}),
  is_published: StringToBooleanSchema.default(false),
  questions: StringToObjectSchema(
    z.array(WorditQuestionSchema).min(1).max(50),
  ).optional(),
});

export type ICreateWordit = z.infer<typeof CreateWorditSchema>;
export type IWorditQuestion = z.infer<typeof WorditQuestionSchema>;
