import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

import { ICompleteTheSentenceQuestionSchema } from './create-complete-the-sentence.schema';

// Schema for form-data requests (with file upload)
export const UpdateCompleteTheSentenceSchema = z.object({
  title: z.string().max(128).trim().optional(),
  name: z.string().max(128).trim().optional(), // alias for title
  description: z.string().max(256).trim().optional(),
  thumbnail: fileSchema({}).optional(),
  is_published: StringToBooleanSchema.optional(),
  questions: StringToObjectSchema(
    z.array(ICompleteTheSentenceQuestionSchema).min(1).max(50),
  ).optional(),
});

// Schema for JSON requests (from frontend edit page)
export const UpdateCompleteTheSentenceJsonSchema = z.object({
  title: z.string().max(128).trim().optional(),
  name: z.string().max(128).trim().optional(), // alias for title
  description: z.string().max(256).trim().optional(),
  is_published: z.boolean().optional(),
  questions: z
    .array(ICompleteTheSentenceQuestionSchema)
    .min(1)
    .max(50)
    .optional(),
});

export type IUpdateCompleteTheSentence = z.infer<
  typeof UpdateCompleteTheSentenceSchema
>;

export type IUpdateCompleteTheSentenceJson = z.infer<
  typeof UpdateCompleteTheSentenceJsonSchema
>;
