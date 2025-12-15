import z from 'zod';

export const ICompleteTheSentenceQuestionSchema = z.object({
  leftClause: z.string().max(2000).trim(),
  rightClause: z.string().max(2000).trim(),
  availableConjunctions: z.array(z.string().max(16)),
  correctAnswer: z.string().max(2000).trim(),
  explanation: z.string().max(2000).trim().optional(),
});

export const ICompleteTheSentenceGameSchema = z.object({
  questions: z.array(ICompleteTheSentenceQuestionSchema).min(1),
});
