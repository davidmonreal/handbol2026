import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEventController } from '../src/controllers/game-event-controller';
import { GameEventService } from '../src/services/game-event-service';
import { GameEventRepository } from '../src/repositories/game-event-repository';
import { Request, Response } from 'express';

vi.mock('../src/services/game-event-service');

describe('GameEventcontroller - Context Fields', () => {
    let controller: GameEventController;
    let service: GameEventService;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let json: ReturnType<typeof vi.fn>;
    let status: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        service = new GameEventService({} as GameEventRepository);
        controller = new GameEventController(service);
        json = vi.fn();
        status = vi.fn().mockReturnValue({ json });
        res = { json, status } as unknown as Response;
        vi.clearAllMocks();
    });

    it('should save hasOpposition=true correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 100,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '9M',
                isCollective: false,
                hasOpposition: true,
                isCounterAttack: false,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-1', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith(createdEvent);
        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                hasOpposition: true,
            })
        );
    });

    it('should save hasOpposition=false correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 200,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '9M',
                isCollective: false,
                hasOpposition: false,
                isCounterAttack: false,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-2', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                hasOpposition: false,
            })
        );
    });

    it('should save isCounterAttack=true correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 300,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '6M',
                isCollective: false,
                hasOpposition: true,
                isCounterAttack: true,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-3', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                isCounterAttack: true,
            })
        );
    });

    it('should save isCounterAttack=false correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 400,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '9M',
                isCollective: false,
                hasOpposition: true,
                isCounterAttack: false,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-4', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                isCounterAttack: false,
            })
        );
    });

    it('should save isCollective=true correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 500,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '9M',
                isCollective: true,
                hasOpposition: true,
                isCounterAttack: false,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-5', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                isCollective: true,
            })
        );
    });

    it('should save isCollective=false correctly', async () => {
        req = {
            body: {
                matchId: 'match-1',
                timestamp: 600,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '9M',
                isCollective: false,
                hasOpposition: false,
                isCounterAttack: false,
                goalZone: 'TM',
            },
        };

        const createdEvent = { id: 'event-6', ...req.body };
        vi.mocked(service.create).mockResolvedValue(createdEvent);

        await controller.create(req as Request, res as Response);

        expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining({
                isCollective: false,
            })
        );
    });
});
