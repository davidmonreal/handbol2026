import { z } from 'zod';

export const importPlayersImageSchema = z.object({
  image: z
    .string({
      required_error: 'Image data is required',
      invalid_type_error: 'Image data is required',
    })
    .regex(
      /^data:image\/(png|jpeg|jpg|webp|gif);base64,/,
      'Invalid image format. Please upload a PNG, JPEG, or WebP image.',
    ),
});

export type ImportPlayersImageInput = z.infer<typeof importPlayersImageSchema>;
