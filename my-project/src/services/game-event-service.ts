import { GameEvent } from '@prisma/client';
import { GameEventRepository } from '../repositories/game-event-repository';

export class GameEventService {
  constructor(private repository: GameEventRepository) {}

  async getAll(filters?: { teamId?: string; playerId?: string }): Promise<GameEvent[]> {
    return this.repository.findAll(filters);
  }

  async getByMatchId(matchId: string): Promise<GameEvent[]> {
    return this.repository.findByMatchId(matchId);
  }

  async getById(id: string): Promise<GameEvent | null> {
    return this.repository.findById(id);
  }

  async create(data: {
    matchId: string;
    timestamp: number;
    playerId?: string;
    teamId: string;
    type: string;
    subtype?: string;
    position?: string;
    distance?: string;
    isCollective?: boolean;
    goalZone?: string;
    sanctionType?: string;
    hasOpposition?: boolean;
    isCounterAttack?: boolean;
  }): Promise<GameEvent> {
    return this.repository.create(data);
  }

  async update(
    id: string,
    data: Partial<{
      timestamp: number;
      playerId: string;
      type: string;
      subtype: string;
      position: string;
      distance: string;
      isCollective: boolean;
      goalZone: string;
      sanctionType: string;
      hasOpposition: boolean;
      isCounterAttack: boolean;
    }>,
  ): Promise<GameEvent> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<GameEvent> {
    return this.repository.delete(id);
  }
}
