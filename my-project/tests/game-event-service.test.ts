import { describe, it, expect } from 'vitest';
import { GameEventService } from '../src/services/game-event-service';
import { getScorePatchForGoal } from '../src/services/game-event-rules';
import type { CreateGameEventInput } from '../src/schemas/game-event';
import type { GameEvent, Match } from '@prisma/client';
import type { GameEventRepository } from '../src/repositories/game-event-repository';
import type { MatchRepository } from '../src/repositories/match-repository';

type StubMatch = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isFinished: boolean;
  realTimeFirstHalfStart: number | null;
  realTimeSecondHalfStart: number | null;
  realTimeFirstHalfEnd: number | null;
  firstHalfVideoStart: number | null;
  secondHalfVideoStart: number | null;
  homeEventsLocked?: boolean;
  awayEventsLocked?: boolean;
};

type StubEvent = CreateGameEventInput & { id?: string };

const asMatch = (match: StubMatch): Match => match as unknown as Match;
const asEvent = (event: StubEvent): GameEvent => event as unknown as GameEvent;

type GameEventRepoPort = Pick<
  GameEventRepository,
  'findAll' | 'findById' | 'findByMatchId' | 'create' | 'update' | 'delete'
>;

class StubGameEventRepository implements GameEventRepoPort {
  created: StubEvent | null = null;
  deletedId: string | null = null;
  event: GameEvent | null = null;
  async findAll(): Promise<GameEvent[]> {
    return [];
  }
  async findById(id: string): Promise<GameEvent | null> {
    return this.event && this.event.id === id ? this.event : null;
  }
  async findByMatchId(): Promise<GameEvent[]> {
    return [];
  }
  async create(data: StubEvent): Promise<GameEvent> {
    this.created = data;
    return asEvent({ id: 'evt-1', ...data });
  }
  async update(id: string, data: Partial<GameEvent>): Promise<GameEvent> {
    return asEvent({ id, ...data });
  }
  async delete(id: string): Promise<GameEvent> {
    this.deletedId = id;
    return asEvent({ id, ...this.event });
  }
}

type MatchRepoPort = Pick<MatchRepository, 'findById' | 'update'>;

class StubMatchRepository implements MatchRepoPort {
  match: Match | null = null;
  updates: Array<{ id: string; data: Partial<Match> }> = [];
  async findById(id: string): Promise<Match | null> {
    return this.match && this.match.id === id ? this.match : null;
  }
  async update(id: string, data: Partial<Match>): Promise<Match> {
    this.updates.push({ id, data });
    return { ...(this.match as Match), ...data };
  }
}

const baseMatch: StubMatch = {
  id: 'm1',
  homeTeamId: 'home',
  awayTeamId: 'away',
  homeScore: 0,
  awayScore: 0,
  isFinished: false,
  realTimeFirstHalfStart: 1,
  realTimeSecondHalfStart: null,
  realTimeFirstHalfEnd: null,
  firstHalfVideoStart: null,
  secondHalfVideoStart: null,
};

const baseEvent: CreateGameEventInput = {
  matchId: 'm1',
  teamId: 'home',
  type: 'Shot',
  subtype: 'Goal',
  timestamp: 10,
};

describe('GameEventService', () => {
  it('throws if events are locked for the team', async () => {
    const repo = new StubGameEventRepository();
    const matchRepo = new StubMatchRepository();
    matchRepo.match = asMatch({ ...baseMatch, homeEventsLocked: true });
    const service = new GameEventService(repo, matchRepo);

    await expect(service.create(baseEvent)).rejects.toThrow('Events are locked for this team');
  });

  it('throws if match has not started', async () => {
    const repo = new StubGameEventRepository();
    const matchRepo = new StubMatchRepository();
    matchRepo.match = asMatch({
      ...baseMatch,
      realTimeFirstHalfStart: null,
      firstHalfVideoStart: null,
    });
    const service = new GameEventService(repo, matchRepo);

    await expect(service.create(baseEvent)).rejects.toThrow('Match has not been started yet');
  });

  it('updates match score when creating a goal for a live match', async () => {
    const repo = new StubGameEventRepository();
    const matchRepo = new StubMatchRepository();
    matchRepo.match = asMatch({ ...baseMatch });
    const service = new GameEventService(repo, matchRepo);

    const created = await service.create(baseEvent);

    expect(created.subtype).toBe('Goal');
    expect(matchRepo.updates[0]).toEqual({
      id: 'm1',
      data: { homeScore: 1 },
    });
  });
});

describe('game-event rules helpers', () => {
  it('computes score patch for goal increments and decrements', () => {
    const match = asMatch({ ...baseMatch });
    const inc = getScorePatchForGoal(match, baseEvent, 1);
    expect(inc).toEqual({ homeScore: 1 });

    (match as unknown as StubMatch).homeScore = 2;
    const dec = getScorePatchForGoal(match, baseEvent, -1);
    expect(dec).toEqual({ homeScore: 1 });
  });

  it('returns null for non-goal events', () => {
    const patch = getScorePatchForGoal(asMatch(baseMatch), { ...baseEvent, subtype: 'Save' }, 1);
    expect(patch).toBeNull();
  });
});
