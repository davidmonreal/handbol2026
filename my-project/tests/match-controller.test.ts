import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchController } from '../src/controllers/match-controller';
import { MatchService } from '../src/services/match-service';
import { MatchRepository } from '../src/repositories/match-repository';
import { Request, Response } from 'express';

vi.mock('../src/services/match-service');

describe('MatchController', () => {
  let controller: MatchController;
  let service: MatchService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: ReturnType<typeof vi.fn>;
  let status: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new MatchService({} as MatchRepository);
    controller = new MatchController(service);
    json = vi.fn();
    status = vi.fn().mockReturnValue({ json });
    res = { json, status } as unknown as Response;
    vi.clearAllMocks();
  });

  it('create returns 201 on success', async () => {
    req = { body: { date: '2024-10-10', homeTeamId: 'h1', awayTeamId: 'a1' } };
    const createdMatch = { id: '1', ...req.body };
    vi.mocked(service.create).mockResolvedValue(createdMatch);

    await controller.create(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdMatch);
  });

  it('create returns 400 on validation error', async () => {
    req = { body: { date: 'invalid' } };
    vi.mocked(service.create).mockRejectedValue(new Error('Invalid date format'));

    await controller.create(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid date format' });
  });

  it('getById returns 404 if not found', async () => {
    req = { params: { id: '1' } };
    vi.mocked(service.getById).mockResolvedValue(null);

    await controller.getById(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Match not found' });
  });
});
