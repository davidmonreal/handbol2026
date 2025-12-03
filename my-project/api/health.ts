import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple health check endpoint that doesn't depend on Express or database.
 * This helps verify that serverless functions work independently.
 */
export default (req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: !!process.env.VERCEL,
    nodeVersion: process.version,
  });
};
