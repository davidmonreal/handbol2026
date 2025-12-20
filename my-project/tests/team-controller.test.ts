/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { TeamController } from '../src/controllers/team-controller';
import { TeamService } from '../src/services/team-service';
import { makeTeamPayload } from './factories/team';

vi.mock('../src/services/team-service');

describe('TeamController', () => {
  let controller: TeamController;
  let service: TeamService;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new TeamService({} as never);
    controller = new TeamController(service);
    req = {};
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    vi.clearAllMocks();
  });

  it('getAll returns teams', async () => {
    const mockTeams = [{ id: '1', name: 'Team A' }];
    vi.mocked(service.getAll).mockResolvedValue(mockTeams as any);

    await controller.getAll(req as Request, res as Response);

    expect(service.getAll).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockTeams);
  });

  it('getById returns a team if found', async () => {
    req.params = { id: '1' };
    const mockTeam = { id: '1', name: 'Team A' };
    vi.mocked(service.getById).mockResolvedValue(mockTeam as any);

    await controller.getById(req as Request, res as Response);

    expect(service.getById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(mockTeam);
  });

  it('getById returns 404 if not found', async () => {
    req.params = { id: '1' };
    vi.mocked(service.getById).mockResolvedValue(null);

    await controller.getById(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Team not found' });
  });

  it('create creates a new team', async () => {
    req.body = makeTeamPayload({ isMyTeam: true, clubId: 'c1', seasonId: 's1' });
    const createdTeam = { id: '1', ...req.body };
    vi.mocked(service.create).mockResolvedValue(createdTeam);

    await controller.create(req as Request, res as Response);

    expect(service.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdTeam);
  });

  it('create returns 400 if club not found', async () => {
    req.body = makeTeamPayload({ clubId: 'invalid', seasonId: 's1' });
    vi.mocked(service.create).mockRejectedValue(new Error('Club not found'));

    await controller.create(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Club not found' });
  });

  it('update modifies a team', async () => {
    req.params = { id: '1' };
    req.body = { name: 'Team A Updated' };
    const updatedTeam = { id: '1', name: 'Team A Updated' };
    vi.mocked(service.update).mockResolvedValue(updatedTeam as any);

    await controller.update(req as Request, res as Response);

    expect(service.update).toHaveBeenCalledWith('1', { name: 'Team A Updated' });
    expect(res.json).toHaveBeenCalledWith(updatedTeam);
  });

  it('delete removes a team', async () => {
    req.params = { id: '1' };
    vi.mocked(service.delete).mockResolvedValue({ id: '1' } as any);

    await controller.delete(req as Request, res as Response);

    expect(service.delete).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('getTeamPlayers returns players', async () => {
    req.params = { id: '1' };
    const mockPlayers = [{ playerId: 'p1', teamId: '1', role: 'Player' }];
    vi.mocked(service.getTeamPlayers).mockResolvedValue(mockPlayers as any);

    await controller.getTeamPlayers(req as Request, res as Response);

    expect(service.getTeamPlayers).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(mockPlayers);
  });

  it('assignPlayer assigns a player', async () => {
    req.params = { id: '1' };
    req.body = { playerId: 'p1', role: 'Captain' };
    const assignment = { playerId: 'p1', teamId: '1', role: 'Captain' };
    vi.mocked(service.assignPlayer).mockResolvedValue(assignment as any);

    await controller.assignPlayer(req as Request, res as Response);

    expect(service.assignPlayer).toHaveBeenCalledWith('1', 'p1', 'Captain');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(assignment);
  });

  it('unassignPlayer removes a player', async () => {
    req.params = { id: '1', playerId: 'p1' };
    vi.mocked(service.unassignPlayer).mockResolvedValue({} as any);

    await controller.unassignPlayer(req as Request, res as Response);

    expect(service.unassignPlayer).toHaveBeenCalledWith('1', 'p1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
