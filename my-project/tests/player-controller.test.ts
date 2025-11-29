import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PlayerController } from '../src/controllers/player-controller';
import { PlayerService } from '../src/services/player-service';

vi.mock('../src/services/player-service');

describe('PlayerController', () => {
    let controller: PlayerController;
    let service: PlayerService;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        service = new PlayerService({} as any);
        controller = new PlayerController(service);
        req = {};
        res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };
        vi.clearAllMocks();
    });

    it('getAll returns players', async () => {
        const mockPlayers = [{ id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' }];
        (service.getAll as any).mockResolvedValue(mockPlayers);

        await controller.getAll(req as Request, res as Response);

        expect(service.getAll).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });

    it('getById returns a player if found', async () => {
        req.params = { id: '1' };
        const mockPlayer = { id: '1', name: 'Alice', number: 10, handedness: 'RIGHT' };
        (service.getById as any).mockResolvedValue(mockPlayer);

        await controller.getById(req as Request, res as Response);

        expect(service.getById).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith(mockPlayer);
    });

    it('getById returns 404 if not found', async () => {
        req.params = { id: '1' };
        (service.getById as any).mockResolvedValue(null);

        await controller.getById(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
    });

    it('create creates a new player', async () => {
        req.body = { name: 'Bob', number: '7', handedness: 'LEFT' };
        const createdPlayer = { id: '2', name: 'Bob', number: 7, handedness: 'LEFT' };
        (service.create as any).mockResolvedValue(createdPlayer);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith({ name: 'Bob', number: 7, handedness: 'LEFT' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createdPlayer);
    });

    it('create returns 400 for invalid number', async () => {
        req.body = { name: 'Invalid', number: '0', handedness: 'RIGHT' };
        (service.create as any).mockRejectedValue(new Error('Player number must be positive'));

        await controller.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player number must be positive' });
    });

    it('update modifies a player', async () => {
        req.params = { id: '1' };
        req.body = { name: 'Alice Updated' };
        const updatedPlayer = { id: '1', name: 'Alice Updated', number: 10, handedness: 'RIGHT' };
        (service.update as any).mockResolvedValue(updatedPlayer);

        await controller.update(req as Request, res as Response);

        expect(service.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(updatedPlayer);
    });

    it('delete removes a player', async () => {
        req.params = { id: '1' };
        (service.delete as any).mockResolvedValue({});

        await controller.delete(req as Request, res as Response);

        expect(service.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });
});
