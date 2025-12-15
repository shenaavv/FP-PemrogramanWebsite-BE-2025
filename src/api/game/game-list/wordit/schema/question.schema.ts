import z from 'zod';

// Schema for creating a single question
export const CreateQuestionSchema = z.object({
  sentence: z.string().min(1).max(500).trim(),
  options: z.array(z.string().min(1).max(100).trim()).min(2).max(6),
  correct_answer: z.string().min(1).max(100).trim(),
  explanation: z.string().max(500).trim().optional(),
});

// Schema for updating a question
export const UpdateQuestionSchema = z.object({
  sentence: z.string().min(1).max(500).trim().optional(),
  options: z.array(z.string().min(1).max(100).trim()).min(2).max(6).optional(),
  correct_answer: z.string().min(1).max(100).trim().optional(),
  explanation: z.string().max(500).trim().optional(),
});

export type ICreateQuestion = z.infer<typeof CreateQuestionSchema>;
export type IUpdateQuestion = z.infer<typeof UpdateQuestionSchema>;
