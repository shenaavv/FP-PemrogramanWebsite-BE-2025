import z from 'zod';

export const CheckCompleteTheSentenceAnswerSchema = z.object({
  question_index: z.number().int().min(0),
  selected_conjunction: z.string().max(64).trim(),
});

export type ICheckCompleteTheSentenceAnswer = z.infer<
  typeof CheckCompleteTheSentenceAnswerSchema
>;
