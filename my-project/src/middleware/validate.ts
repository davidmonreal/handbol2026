import { ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

type RequestLocation = 'body' | 'query' | 'params';

type ValidateOptions = {
  fallbackMessage?: string;
};

export function validateRequest(
  schema: ZodTypeAny,
  location: RequestLocation = 'body',
  options: ValidateOptions = {},
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = (req as unknown as Record<string, unknown>)[location];

    const result = schema.safeParse(data);
    if (!result.success) {
      const first = result.error?.issues?.[0];
      const shouldUseFallback = options.fallbackMessage && first && first.code === 'invalid_type';
      const message =
        (shouldUseFallback ? options.fallbackMessage : first?.message) ??
        options.fallbackMessage ??
        'Invalid request';
      return res.status(400).json({ error: message });
    }

    (req as unknown as Record<string, unknown>)[location] = result.data;
    return next();
  };
}
