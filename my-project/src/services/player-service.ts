import { Player } from '@prisma/client';
import { BaseService } from './base-service';
import { PlayerRepository } from '../repositories/player-repository';

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

  // Override create to add business logic validation
  async create(data: Omit<Player, 'id'>): Promise<Player> {
    // Validation: allow unknown dorsals as 0, otherwise must be positive
    if (data.number < 0) {
      throw new Error('Player number must be zero or positive');
    }

    // Validation: handedness must be LEFT or RIGHT
    if (!['LEFT', 'RIGHT'].includes(data.handedness)) {
      throw new Error('Handedness must be LEFT or RIGHT');
    }

    return super.create(data);
  }

  // Override update to add business logic validation
  async update(id: string, data: Partial<Omit<Player, 'id'>>): Promise<Player> {
    // Validation: allow unknown dorsals as 0, otherwise must be positive
    if (data.number !== undefined && data.number < 0) {
      throw new Error('Player number must be zero or positive');
    }

    // Validation: handedness must be LEFT or RIGHT if provided
    if (data.handedness && !['LEFT', 'RIGHT'].includes(data.handedness)) {
      throw new Error('Handedness must be LEFT or RIGHT');
    }

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<Player> {
    return this.repository.delete(id);
  }
}
