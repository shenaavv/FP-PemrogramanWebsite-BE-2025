import z from 'zod';

export const CheckAnswerSchema = z.object({
  // Menerima format ID 'text-001' atau 'auto-mode-timestamp'
  text_id: z.string().regex(/^(text-\d{3}|auto-.*)$/, 'Invalid text_id format'),
  // Batas maksimum 8000, trim untuk membersihkan spasi awal/akhir
  user_input: z.string().min(0).max(8000).trim(),
  time_taken: z.coerce.number().min(1).max(300), // coerce.number() untuk menjamin tipe
});

export type ICheckAnswer = z.infer<typeof CheckAnswerSchema>;
