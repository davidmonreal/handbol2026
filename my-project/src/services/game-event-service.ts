import { GameEvent } from '@prisma/client';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchRepository } from '../repositories/match-repository';

export class GameEventService {
  constructor(
    private repository: GameEventRepository,
    private matchRepository: MatchRepository,
  ) {}

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
    videoTimestamp?: number;
    activeGoalkeeperId?: string;
  }): Promise<GameEvent> {
    // Fetch match to check status
    const match = await this.matchRepository.findById(data.matchId);
    if (!match) {
      throw new Error(`Match ${data.matchId} not found`);
    }

    // Block new events if the team is locked
    const isHome = data.teamId === match.homeTeamId;
    const isAway = data.teamId === match.awayTeamId;
    const homeLocked = (match as { homeEventsLocked?: boolean }).homeEventsLocked ?? false;
    const awayLocked = (match as { awayEventsLocked?: boolean }).awayEventsLocked ?? false;
    if ((isHome && homeLocked) || (isAway && awayLocked)) {
      throw new Error('Events are locked for this team');
    }

    if (!match.realTimeFirstHalfStart) {
      throw new Error('Match has not been started yet');
    }

    const firstHalfBoundarySeconds =
      match.realTimeFirstHalfStart && match.realTimeSecondHalfStart
        ? Math.max(
            0,
            Math.floor((match.realTimeSecondHalfStart - match.realTimeFirstHalfStart) / 1000),
          )
        : match.realTimeFirstHalfStart && match.realTimeFirstHalfEnd
          ? Math.max(
              0,
              Math.floor((match.realTimeFirstHalfEnd - match.realTimeFirstHalfStart) / 1000),
            )
          : null;

    if (
      firstHalfBoundarySeconds !== null &&
      data.timestamp > firstHalfBoundarySeconds &&
      !match.realTimeSecondHalfStart
    ) {
      throw new Error('Second half has not started yet');
    }

    // Only update match scores while the match is live
    const shouldUpdateScore = !match.isFinished;

    const event = await this.repository.create(data);

    // Update match score if it's a goal AND match is not finished
    if (shouldUpdateScore && data.type === 'Shot' && data.subtype === 'Goal') {
      if (data.teamId === match.homeTeamId) {
        await this.matchRepository.update(match.id, { homeScore: match.homeScore + 1 });
      } else if (data.teamId === match.awayTeamId) {
        await this.matchRepository.update(match.id, { awayScore: match.awayScore + 1 });
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
      activeGoalkeeperId: string;
    }>,
  ): Promise<GameEvent> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<GameEvent> {
    // First get the event to check if it's a goal
    const event = await this.repository.findById(id);
    const match = event ? await this.matchRepository.findById(event.matchId) : null;
    const shouldUpdateScore = !!match && !match.isFinished;

    // Delete the event
    const deletedEvent = await this.repository.delete(id);

    // If it was a goal, recalculate match score
    if (shouldUpdateScore && event && match && event.type === 'Shot' && event.subtype === 'Goal') {
      if (event.teamId === match.homeTeamId && match.homeScore > 0) {
        await this.matchRepository.update(match.id, { homeScore: match.homeScore - 1 });
      } else if (event.teamId === match.awayTeamId && match.awayScore > 0) {
        await this.matchRepository.update(match.id, { awayScore: match.awayScore - 1 });
      }
    }

    return deletedEvent;
  }
}
