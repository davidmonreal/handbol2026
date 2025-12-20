import { Request, Response } from 'express';
import { Player } from '@prisma/client';
import { BaseController } from './base-controller';
import { PlayerService } from '../services/player-service';
import { createPlayerSchema, updatePlayerSchema } from '../schemas/player';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const HANDEDNESS_MESSAGE = 'Handedness must be LEFT or RIGHT';

export class PlayerController extends BaseController<Player> {
  private playerService: PlayerService;

  constructor(service: PlayerService) {
    super(service, 'Player');
    this.playerService = service;
  }

  private parsePagination(query: Request['query']) {
    const skip = Math.max(0, parseInt(query.skip as string) || 0);
    const take = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.take as string) || DEFAULT_PAGE_SIZE),
    );
    const search = (query.search as string) || undefined;
    const clubId = (query.clubId as string) || undefined;
    return { skip, take, search, clubId };
  }

  private useLegacyList(query: Request['query']) {
    return !query.skip && !query.take && !query.search && !query.clubId;
  }

  private extractErrorMessage(issue: { path?: PropertyKey[]; message?: string } | undefined) {
    if (issue?.path?.[0] === 'handedness') return HANDEDNESS_MESSAGE;
    return issue?.message ?? 'Invalid player payload';
  }

  async getAll(req: Request, res: Response) {
    try {
      if (this.useLegacyList(req.query)) {
        return super.getAll(req, res);
      }

      const { skip, take, search, clubId } = this.parsePagination(req.query);

      const [data, total] = await Promise.all([
        this.playerService.getAllPaginated({ skip, take, search, clubId }),
        this.playerService.count({ search, clubId }),
      ]);

      res.json({ data, total, skip, take });
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async create(req: Request, res: Response) {
    const parsed = createPlayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: this.extractErrorMessage(parsed.error.issues[0]),
      });
    }
    req.body = parsed.data;
    return super.create(req, res);
  }

  async update(req: Request, res: Response) {
    const parsed = updatePlayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: this.extractErrorMessage(parsed.error.issues[0]),
      });
    }
    req.body = parsed.data;
    return super.update(req, res);
  }
}
