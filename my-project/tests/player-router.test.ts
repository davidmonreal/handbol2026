import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerController } from '../src/controllers/player-controller';
import { createPlayerRouter } from '../src/routes/players';

describe('createPlayerRouter', () => {
  let app: express.Express;
  let getAll: ReturnType<typeof vi.fn>;
  let getById: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let controller: PlayerController;

  beforeEach(() => {
    getAll = vi.fn((_, res) => res.json([{ id: '1' }]));
    getById = vi.fn((req, res) => res.json({ id: req.params.id }));
    create = vi.fn((req, res) => res.status(201).json({ id: 'new', ...req.body }));
    update = vi.fn((req, res) => res.json({ id: req.params.id, ...req.body }));
    remove = vi.fn((_, res) => res.status(204).send());

    controller = {
      getAll,
      getById,
      create,
      update,
      delete: remove,
    } as unknown as PlayerController;

    app = express();
    app.use(express.json());
    app.use('/players', createPlayerRouter({ controller }));
  });

  it('wires GET /players to controller.getAll', async () => {
    const response = await request(app).get('/players');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: '1' }]);
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  it('wires GET /players/:id to controller.getById', async () => {
    const response = await request(app).get('/players/abc');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'abc' });
    expect(getById).toHaveBeenCalledTimes(1);
    expect(getById.mock.calls[0]?.[0]?.params).toEqual({ id: 'abc' });
  });

  it('wires POST /players to controller.create', async () => {
    const payload = { name: 'New Player', number: 9, handedness: 'RIGHT' };
    const response = await request(app).post('/players').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 'new', ...payload, isGoalkeeper: false });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0]?.body).toEqual({ ...payload, isGoalkeeper: false });
  });

  it('wires PUT /players/:id to controller.update', async () => {
    const payload = { name: 'Updated', number: 5 };
    const response = await request(app).put('/players/abc').send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'abc', ...payload });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]?.params).toEqual({ id: 'abc' });
    expect(update.mock.calls[0]?.[0]?.body).toEqual(payload);
  });

  it('wires DELETE /players/:id to controller.delete', async () => {
    const response = await request(app).delete('/players/abc');

    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0]?.[0]?.params).toEqual({ id: 'abc' });
  });
});
