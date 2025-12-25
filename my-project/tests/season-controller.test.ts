import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { SeasonController } from '../src/controllers/season-controller';
import { SeasonService } from '../src/services/season-service';

vi.mock('../src/services/season-service');

describe('SeasonController', () => {
  let controller: SeasonController;
  let service: SeasonService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new SeasonService({} as never);
    controller = new SeasonController(service);
    req = {};
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('getAll returns seasons', async () => {
    const mockSeasons = [{ id: '1', name: 'test-2024-2025' }];
    vi.mocked(service.getAll).mockResolvedValue(mockSeasons);

    await controller.getAll(req as Request, res as Response);

    expect(service.getAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockSeasons);
  });

  it('getById returns a season if found', async () => {
    req.params = { id: '1' };
    const mockSeason = { id: '1', name: 'test-2024-2025' };
    vi.mocked(service.getById).mockResolvedValue(mockSeason);

    await controller.getById(req as Request, res as Response);

    expect(service.getById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(mockSeason);
  });

  it('getById returns 404 if not found', async () => {
    req.params = { id: '1' };
    vi.mocked(service.getById).mockResolvedValue(null);

    await controller.getById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Season not found' });
  });

  it('create creates a new season', async () => {
    req.body = { name: 'test-2025-2026', startDate: '2025-09-01', endDate: '2026-06-30' };
    const createdSeason = {
      id: '2',
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    };
    vi.mocked(service.create).mockResolvedValue(createdSeason);

    await controller.create(req as Request, res as Response);

    expect(service.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdSeason);
  });

  it('create returns 400 for invalid dates', async () => {
    req.body = { name: 'test-Invalid', startDate: '2026-06-30', endDate: '2025-09-01' };
    vi.mocked(service.create).mockRejectedValue(new Error('End date must be after start date'));

    await controller.create(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'End date must be after start date' });
  });

  it('update modifies a season', async () => {
    req.params = { id: '1' };
    req.body = { name: 'test-Updated' };
    const updatedSeason = { id: '1', name: 'test-Updated' };
    vi.mocked(service.update).mockResolvedValue(updatedSeason);

    await controller.update(req as Request, res as Response);

    expect(service.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updatedSeason);
  });

  it('delete removes a season', async () => {
    req.params = { id: '1' };
    const mockDeleteResult = {
      id: '1',
      name: 'test-Deleted',
      startDate: new Date(),
      endDate: new Date(),
    };
    vi.mocked(service.delete).mockResolvedValue(mockDeleteResult);

    await controller.delete(req as Request, res as Response);

    expect(service.delete).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
