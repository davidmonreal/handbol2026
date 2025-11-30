import { GameEvent } from '@prisma/client';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchRepository } from '../repositories/match-repository';

export class GameEventService {
  constructor(
    private repository: GameEventRepository,
    private matchRepository: MatchRepository,
  ) { }

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
    const event = await this.repository.create(data);

    // Update match score if it's a goal
    if (data.type === 'Shot' && data.subtype === 'Goal') {
      const match = await this.matchRepository.findById(data.matchId);
      if (match) {
        if (data.teamId === match.homeTeamId) {
          await this.matchRepository.update(match.id, { homeScore: match.homeScore + 1 });
        } else if (data.teamId === match.awayTeamId) {
          await this.matchRepository.update(match.id, { awayScore: match.awayScore + 1 });
        }
      }
    }

    return event;
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
