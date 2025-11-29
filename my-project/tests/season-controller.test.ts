import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { SeasonController } from '../src/controllers/season-controller';
import { SeasonService } from '../src/services/season-service';

// Mock service
vi.mock('../src/services/season-service');

describe('SeasonController', () => {
    let controller: SeasonController;
    let service: SeasonService;
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        service = new SeasonService({} as any);
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
        const mockSeasons = [{ id: '1', name: '2024-2025' }];
        (service.getAll as any).mockResolvedValue(mockSeasons);

        await controller.getAll(req as Request, res as Response);

        expect(service.getAll).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockSeasons);
    });

    it('getById returns a season if found', async () => {
        req.params = { id: '1' };
        const mockSeason = { id: '1', name: '2024-2025' };
        (service.getById as any).mockResolvedValue(mockSeason);

        await controller.getById(req as Request, res as Response);

        expect(service.getById).toHaveBeenCalledWith('1');
        expect(res.json).toHaveBeenCalledWith(mockSeason);
    });

    it('getById returns 404 if not found', async () => {
        req.params = { id: '1' };
        (service.getById as any).mockResolvedValue(null);

        await controller.getById(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Season not found' });
    });

    it('create creates a new season', async () => {
        req.body = { name: '2025-2026', startDate: '2025-09-01', endDate: '2026-06-30' };
        const createdSeason = { id: '2', ...req.body, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate) };
        (service.create as any).mockResolvedValue(createdSeason);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(createdSeason);
    });

    it('create returns 400 for invalid dates', async () => {
        req.body = { name: 'Invalid', startDate: '2026-06-30', endDate: '2025-09-01' };
        (service.create as any).mockRejectedValue(new Error('End date must be after start date'));

        await controller.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'End date must be after start date' });
    });

    it('update modifies a season', async () => {
        req.params = { id: '1' };
        req.body = { name: 'Updated' };
        const updatedSeason = { id: '1', name: 'Updated' };
        (service.update as any).mockResolvedValue(updatedSeason);

        await controller.update(req as Request, res as Response);

        expect(service.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(updatedSeason);
    });

    it('delete removes a season', async () => {
        req.params = { id: '1' };
        (service.delete as any).mockResolvedValue({});

        await controller.delete(req as Request, res as Response);

        expect(service.delete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });
});
