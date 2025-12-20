import { GameEvent, Match } from '@prisma/client';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchRepository } from '../repositories/match-repository';
import { CreateGameEventInput, UpdateGameEventInput } from '../schemas/game-event';

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

  private async getMatchOrThrow(matchId: string): Promise<Match> {
    const match = await this.matchRepository.findById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }
    return match;
  }

  private assertTeamUnlocked(match: Match, teamId: string) {
    const isHome = teamId === match.homeTeamId;
    const isAway = teamId === match.awayTeamId;
    const homeLocked = (match as { homeEventsLocked?: boolean }).homeEventsLocked ?? false;
    const awayLocked = (match as { awayEventsLocked?: boolean }).awayEventsLocked ?? false;
    if ((isHome && homeLocked) || (isAway && awayLocked)) {
      throw new Error('Events are locked for this team');
    }
  }

  // For live matches we need kickoff; for video matches we need calibration timestamps.
  private assertMatchStarted(match: Match) {
    const hasLiveStart = !!match.realTimeFirstHalfStart;
    const hasVideoStart =
      match.firstHalfVideoStart !== null && match.firstHalfVideoStart !== undefined;
    if (!hasLiveStart && !hasVideoStart) {
      throw new Error('Match has not been started yet');
    }
  }

  private computeFirstHalfBoundarySeconds(match: Match): number | null {
    return match.realTimeFirstHalfStart && match.realTimeSecondHalfStart
      ? Math.max(
          0,
          Math.floor((match.realTimeSecondHalfStart - match.realTimeFirstHalfStart) / 1000),
        )
      : match.realTimeFirstHalfStart && match.realTimeFirstHalfEnd
        ? Math.max(
            0,
            Math.floor((match.realTimeFirstHalfEnd - match.realTimeFirstHalfStart) / 1000),
          )
        : match.firstHalfVideoStart !== null &&
            match.firstHalfVideoStart !== undefined &&
            match.secondHalfVideoStart !== null &&
            match.secondHalfVideoStart !== undefined
          ? Math.max(0, match.secondHalfVideoStart - match.firstHalfVideoStart)
          : null;
  }

  private assertSecondHalfStartedIfNeeded(
    boundarySeconds: number | null,
    data: { timestamp: number; teamId: string; matchId: string },
    match: Match,
  ) {
    if (
      boundarySeconds !== null &&
      data.timestamp > boundarySeconds &&
      !match.realTimeSecondHalfStart &&
      (match.secondHalfVideoStart === null || match.secondHalfVideoStart === undefined)
    ) {
      throw new Error('Second half has not started yet');
    }
  }

  async create(data: CreateGameEventInput): Promise<GameEvent> {
    const match = await this.getMatchOrThrow(data.matchId);
    this.assertTeamUnlocked(match, data.teamId);
    this.assertMatchStarted(match);

    // Live matches use real time (ms); video matches use calibrated video seconds.
    const firstHalfBoundarySeconds = this.computeFirstHalfBoundarySeconds(match);
    this.assertSecondHalfStartedIfNeeded(firstHalfBoundarySeconds, data, match);

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
    data: UpdateGameEventInput,
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
