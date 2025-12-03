import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Lazy load the app to catch initialization errors
    const app = (await import('../src/app')).default;
    return app(req, res);
  } catch (error: unknown) {
    console.error('Failed to initialize app:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return res.status(500).json({
      error: 'Failed to initialize app',
      details: errorMessage,
      stack: errorStack,
    });
  }
};
