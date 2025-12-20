import { GameEvent, Match } from '@prisma/client';
import { GameEventRepository } from '../repositories/game-event-repository';
import { MatchRepository } from '../repositories/match-repository';
import { CreateGameEventInput, UpdateGameEventInput } from '../schemas/game-event';
import {
  assertMatchStarted,
  assertSecondHalfStartedIfNeeded,
  assertTeamUnlocked,
  computeFirstHalfBoundarySeconds,
  getScorePatchForGoal,
} from './game-event-rules';

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
    assertTeamUnlocked(match, teamId);
  }

  // For live matches we need kickoff; for video matches we need calibration timestamps.
  private assertMatchStarted(match: Match) {
    assertMatchStarted(match);
  }

  private computeFirstHalfBoundarySeconds(match: Match): number | null {
    return computeFirstHalfBoundarySeconds(match);
  }

  private assertSecondHalfStartedIfNeeded(
    boundarySeconds: number | null,
    data: { timestamp: number; teamId: string; matchId: string },
    match: Match,
  ) {
    assertSecondHalfStartedIfNeeded(boundarySeconds, data, match);
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
    if (shouldUpdateScore) {
      const patch = getScorePatchForGoal(match, data, 1);
      if (patch) {
        await this.matchRepository.update(match.id, patch);
      }
    }

    return event;
  }

  async update(id: string, data: UpdateGameEventInput): Promise<GameEvent> {
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
    if (shouldUpdateScore && event && match) {
      const patch = getScorePatchForGoal(match, event, -1);
      if (patch) {
        await this.matchRepository.update(match.id, patch);
      }
    }

    return deletedEvent;
  }
}
