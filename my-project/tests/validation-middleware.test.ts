import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../src/middleware/validate';

describe('validateRequest middleware', () => {
  it('returns 400 with zod message on invalid body', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/test',
      validateRequest(
        z.object({
          name: z.string().min(1, 'Name is required'),
          count: z.number(),
        }),
      ),
      (_req, res) => res.json({ ok: true }),
    );

    const res = await request(app).post('/test').send({ name: '', count: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('coerces and replaces the body when valid', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/test',
      validateRequest(
        z.object({
          count: z.coerce.number().int(),
        }),
      ),
      (req, res) => res.json(req.body),
    );

    const res = await request(app).post('/test').send({ count: '5' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 5 });
  });
});
