import app from '../src/app';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log('🔧 Backend received request:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      host: req.headers.host,
      timestamp: new Date().toISOString(),
    });

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
