import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { Handedness } from '@prisma/client';
import { PlayerController } from '../src/controllers/player-controller';
import { PlayerService } from '../src/services/player-service';

vi.mock('../src/services/player-service');

describe('PlayerController', () => {
  let controller: PlayerController;
  let service: PlayerService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new PlayerService({} as never);
    controller = new PlayerController(service);
    req = {};
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('getAll returns players (legacy mode - no query params)', async () => {
    req.query = {}; // Empty query = legacy mode
    const mockPlayers = [
      { id: '1', name: 'Alice', number: 10, handedness: Handedness.RIGHT, isGoalkeeper: false },
    ];
    vi.mocked(service.getAll).mockResolvedValue(mockPlayers);

    await controller.getAll(req as Request, res as Response);

    expect(service.getAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockPlayers);
  });

  it('getAll returns paginated players when skip/take provided', async () => {
    req.query = { skip: '0', take: '20' };
    const mockPlayers = [
      { id: '1', name: 'Alice', number: 10, handedness: Handedness.RIGHT, isGoalkeeper: false },
    ];
    vi.mocked(service.getAllPaginated).mockResolvedValue(mockPlayers);
    vi.mocked(service.count).mockResolvedValue(50);

    await controller.getAll(req as Request, res as Response);

    expect(service.getAllPaginated).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      search: undefined,
      clubId: undefined,
    });
    expect(service.count).toHaveBeenCalledWith({ search: undefined, clubId: undefined });
    expect(res.json).toHaveBeenCalledWith({ data: mockPlayers, total: 50, skip: 0, take: 20 });
  });

  it('getById returns a player if found', async () => {
    req.params = { id: '1' };
    const mockPlayer = {
      id: '1',
      name: 'Alice',
      number: 10,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    vi.mocked(service.getById).mockResolvedValue(mockPlayer);

    await controller.getById(req as Request, res as Response);

    expect(service.getById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(mockPlayer);
  });

  it('getById returns 404 if not found', async () => {
    req.params = { id: '1' };
    vi.mocked(service.getById).mockResolvedValue(null);

    await controller.getById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
  });

  it('create creates a new player', async () => {
    req.body = { name: 'Bob', number: '7', handedness: 'LEFT' };
    const createdPlayer = {
      id: '2',
      name: 'Bob',
      number: 7,
      handedness: Handedness.LEFT,
      isGoalkeeper: false,
    };
    vi.mocked(service.create).mockResolvedValue(createdPlayer);

    await controller.create(req as Request, res as Response);

    expect(service.create).toHaveBeenCalledWith({
      name: 'Bob',
      number: 7,
      handedness: 'LEFT',
      isGoalkeeper: false,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdPlayer);
  });

  it('create creates a new goalkeeper', async () => {
    req.body = { name: 'Nico', number: '1', handedness: 'RIGHT', isGoalkeeper: true };
    const createdPlayer = {
      id: '3',
      name: 'Nico',
      number: 1,
      handedness: Handedness.RIGHT,
      isGoalkeeper: true,
    };
    vi.mocked(service.create).mockResolvedValue(createdPlayer);

    await controller.create(req as Request, res as Response);

    expect(service.create).toHaveBeenCalledWith({
      name: 'Nico',
      number: 1,
      handedness: 'RIGHT',
      isGoalkeeper: true,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdPlayer);
  });

  it('create returns 400 for invalid number', async () => {
    req.body = { name: 'Invalid', number: '0', handedness: 'RIGHT' };
    vi.mocked(service.create).mockRejectedValue(new Error('Player number must be positive'));

    await controller.create(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Player number must be positive' });
  });

  it('update modifies a player', async () => {
    req.params = { id: '1' };
    req.body = { name: 'Alice Updated' };
    const updatedPlayer = {
      id: '1',
      name: 'Alice Updated',
      number: 10,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    vi.mocked(service.update).mockResolvedValue(updatedPlayer);

    await controller.update(req as Request, res as Response);

    expect(service.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updatedPlayer);
  });

  it('update modifies a player to be a goalkeeper', async () => {
    req.params = { id: '1' };
    req.body = { isGoalkeeper: true };
    const updatedPlayer = {
      id: '1',
      name: 'Alice',
      number: 10,
      handedness: Handedness.RIGHT,
      isGoalkeeper: true,
    };
    vi.mocked(service.update).mockResolvedValue(updatedPlayer);

    await controller.update(req as Request, res as Response);

    expect(service.update).toHaveBeenCalledWith('1', { isGoalkeeper: true });
    expect(res.json).toHaveBeenCalledWith(updatedPlayer);
  });

  it('delete removes a player', async () => {
    req.params = { id: '1' };
    const mockDeleteResult = {
      id: '1',
      name: 'Deleted',
      number: 10,
      handedness: Handedness.RIGHT,
      isGoalkeeper: false,
    };
    vi.mocked(service.delete).mockResolvedValue(mockDeleteResult);

    await controller.delete(req as Request, res as Response);

    expect(service.delete).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
