import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import importRouter from '../../src/routes/import.routes';
import * as openaiService from '../../src/services/openai.service';

// Mock OpenAI service
vi.mock('../../src/services/openai.service', () => ({
  extractPlayersFromImage: vi.fn(),
}));

describe('POST /api/import-players-from-image', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();

    // Construct app with the same configuration as src/app.ts
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use('/api', importRouter);

    // Global error handler for body-parser errors
    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
      if (
        err &&
        typeof err === 'object' &&
        'type' in err &&
        (err as { type: string }).type === 'entity.too.large'
      ) {
        return res.status(413).json({
          error: 'Image is too large. Please upload an image smaller than 1MB.',
        });
      }
      next(err);
    });
  });

  it('should successfully import players from a valid image', async () => {
    const mockPlayers = [
      { name: 'Player 1', number: 10, handedness: 'RIGHT' as const, isGoalkeeper: false },
    ];

    vi.mocked(openaiService.extractPlayersFromImage).mockResolvedValue(mockPlayers);

    const validImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const response = await request(app)
      .post('/api/import-players-from-image')
      .send({ image: validImage });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ players: mockPlayers });
  });

  it('should return 413 if image is too large (>1MB)', async () => {
    const largeImage = 'data:image/png;base64,' + 'a'.repeat(1024 * 1024 + 100);

    const response = await request(app)
      .post('/api/import-players-from-image')
      .send({ image: largeImage });

    expect(response.status).toBe(413);
    expect(response.body.error).toContain('Image is too large');
  });

  it('should return 400 if image format is invalid', async () => {
    const invalidImage = 'data:application/pdf;base64,JVBERi0xLjQK...';

    const response = await request(app)
      .post('/api/import-players-from-image')
      .send({ image: invalidImage });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid image format');
  });

  it('should return 400 if image is missing', async () => {
    const response = await request(app).post('/api/import-players-from-image').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Image data is required');
  });
});
