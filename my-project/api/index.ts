import { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';

let app: Express | null = null;
let appLoadError: Error | null = null;

// Try to load the app at module level
(async () => {
  try {
    const appModule = await import('../src/app');
    app = appModule.default;
    console.log('✅ Express app loaded successfully');
  } catch (error) {
    appLoadError = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Failed to load Express app:', {
      message: appLoadError.message,
      stack: appLoadError.stack,
      name: appLoadError.name,
    });
  }
})();

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log('🔧 Backend received request:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      host: req.headers.host,
      timestamp: new Date().toISOString(),
    });

    // If app failed to load, return the error
    if (appLoadError) {
      console.error('❌ App not available due to load error');
      return res.status(500).json({
        error: 'Failed to initialize application',
        message: appLoadError.message,
        details: 'Check function logs for full stack trace',
        timestamp: new Date().toISOString(),
      });
    }

    // If app is not loaded yet (shouldn't happen, but TypeScript requires the check)
    if (!app) {
      console.error('❌ App is null but no load error was captured');
      return res.status(500).json({
        error: 'Application not initialized',
        message: 'App is still loading or failed to load',
        timestamp: new Date().toISOString(),
      });
    }

    // Call the Express app
    return app(req, res);
  } catch (error) {
    console.error('❌ Error in serverless function:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
