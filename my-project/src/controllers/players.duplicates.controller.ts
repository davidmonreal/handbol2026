import { Request, Response } from 'express';
import { findSimilarPlayers } from '../services/levenshtein.service';

/**
 * Check for duplicate players based on name similarity
 */
export const checkDuplicates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { names, threshold = 3 } = req.body;

    if (!Array.isArray(names) || names.length === 0) {
      res.status(400).json({ error: 'Names array is required' });
      return;
    }

    const duplicates = await Promise.all(
      names.map(async (name: string) => {
        const matches = await findSimilarPlayers(name, threshold);
        return {
          name,
          hasDuplicates: matches.length > 0,
          matches,
        };
      }),
    );

    res.json({ duplicates });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({
      error: 'Failed to check duplicates',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
