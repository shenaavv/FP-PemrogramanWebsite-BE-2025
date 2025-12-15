import z from 'zod';

// Schema for checking a single answer
export const CheckAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string().min(1).max(100).trim(),
});

// Schema for submitting all answers
export const SubmitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        answer: z.string().min(1).max(100).trim(),
      }),
    )
    .min(1),
  time_taken: z.number().int().min(0).optional(),
});

export type ICheckAnswer = z.infer<typeof CheckAnswerSchema>;
export type ISubmitAnswers = z.infer<typeof SubmitAnswersSchema>;
