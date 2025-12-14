import z from 'zod';

export const CompoundSentencesQuestionSchema = z.object({
  leftClause: z.string().max(2000).trim(),
  rightClause: z.string().max(2000).trim(),
  availableConjunctions: z.array(z.string().max(16)),
  correctAnswer: z.string().max(2000).trim(),
  explanation: z.string().max(2000).trim().optional(),
});

export const CompoundSentencesGameSchema = z.object({
  questions: z.array(CompoundSentencesQuestionSchema).min(1),
});
