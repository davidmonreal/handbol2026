import { Request, Response } from 'express';
import { GameEventService } from '../services/game-event-service';
import { createGameEventSchema, updateGameEventSchema } from '../schemas/game-event';

export class GameEventController {
  constructor(private gameEventService: GameEventService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const filters = {
        teamId: req.query.teamId as string,
        playerId: req.query.playerId as string,
      };
      const events = await this.gameEventService.getAll(filters);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch game events' });
    }
  };

  getByMatchId = async (req: Request, res: Response) => {
    try {
      const events = await this.gameEventService.getByMatchId(req.params.matchId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch game events for match' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const event = await this.gameEventService.getById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Game event not found' });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch game event' });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const parsed = createGameEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? 'Invalid game event payload' });
      }
      const event = await this.gameEventService.create(parsed.data);
      res.status(201).json(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create game event';
      res.status(400).json({ error: message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const parsed = updateGameEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? 'Invalid game event payload' });
      }
      const event = await this.gameEventService.update(req.params.id, parsed.data);
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update game event' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.gameEventService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete game event' });
    }
  };
}
