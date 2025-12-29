import { Player } from '@prisma/client';
import { BaseService } from './base-service';
import { PlayerRepository } from '../repositories/player-repository';
import {
  createPlayerSchema,
  updatePlayerSchema,
  CreatePlayerInput,
  UpdatePlayerInput,
} from '../schemas';
import { ZodError, ZodIssue } from 'zod';

const HAND_MESSAGE = 'Handedness must be LEFT or RIGHT';

function mapPlayerIssue(issue: ZodIssue | undefined) {
  // Normalize Zod issues to stable business-facing messages used by tests/clients
  const pathHead = Array.isArray(issue?.path) ? issue?.path[0] : undefined;
  if (pathHead === 'handedness') return HAND_MESSAGE;
  return issue?.message ?? 'Invalid player payload';
}

export class PlayerService extends BaseService<Player> {
  private playerRepository: PlayerRepository;

  constructor(repository: PlayerRepository) {
    super(repository);
    this.playerRepository = repository;
  }

  async getAllPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    clubId?: string;
  }): Promise<Player[]> {
    return this.playerRepository.findAllPaginated(params);
  }

  async count(params: { search?: string; clubId?: string }): Promise<number> {
    return this.playerRepository.count(params);
  }

  async create(data: CreatePlayerInput): Promise<Player> {
    let payload;
    try {
      payload = createPlayerSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapPlayerIssue(error.issues[0]));
      }
      throw error;
    }
    return super.create(payload);
  }

  async update(id: string, data: UpdatePlayerInput): Promise<Player> {
    let payload;
    try {
      payload = updatePlayerSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapPlayerIssue(error.issues[0]));
      }
      throw error;
    }
    return this.repository.update(id, payload);
  }

  async delete(id: string): Promise<Player> {
    return this.repository.delete(id);
  }
}
