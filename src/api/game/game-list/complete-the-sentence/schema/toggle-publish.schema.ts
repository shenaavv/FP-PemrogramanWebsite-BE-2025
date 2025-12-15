import z from 'zod';

export const TogglePublishSchema = z.object({
  is_published: z.boolean(),
});

export type ITogglePublish = z.infer<typeof TogglePublishSchema>;
