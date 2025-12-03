import { Request, Response } from 'express';
import { extractPlayersFromImage } from '../services/openai.service';

// Middleware to check if request is from localhost
export function isLocalhost(req: Request): boolean {
  const ip = req.ip || req.connection.remoteAddress || '';
  return (
    ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost')
  );
}

export async function importPlayersFromImage(req: Request, res: Response) {
  try {
    // Security check: only allow from localhost
    if (!isLocalhost(req)) {
      return res.status(403).json({
        error: 'Access denied. This endpoint is only accessible from localhost.',
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate image format (must be png, jpeg, webp, or gif)
    if (!image.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/)) {
      return res.status(400).json({
        error: 'Invalid image format. Please upload a PNG, JPEG, or WebP image.',
      });
    }

    // Remove data:image prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Extract players using OpenAI
    const players = await extractPlayersFromImage(base64Data);

    res.json({ players });
  } catch (error) {
    console.error('Error importing players from image:', error);
    res.status(500).json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
