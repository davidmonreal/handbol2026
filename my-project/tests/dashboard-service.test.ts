/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DashboardService } from '../src/services/dashboard-service';
import type { WeeklyInsightsResponse } from '../src/services/insights-service';
import prisma from '../src/lib/prisma';

const mockWeeklyInsights = {
  range: { start: '2025-01-01', end: '2025-01-08' },
  generatedAt: '2025-01-08T00:00:00Z',
  metrics: {
    totalEvents: 0,
    topScorerOverall: null,
    topScorersByCategory: [],
    topIndividualScorer: null,
    teamWithMostCollectiveGoals: null,
    teamWithMostFouls: null,
  },
} as WeeklyInsightsResponse;

vi.mock('../src/lib/prisma', () => ({
  default: {
    match: {
      findMany: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
    },
  },
}));

describe('DashboardService', () => {
  const mockInsightsService = {
    computeWeeklyInsights: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns dashboard snapshot combining matches, teams, and insights', async () => {
    const pendingMatches = [{ id: 'm1' }] as any;
    const pastMatches = [{ id: 'm2' }] as any;
    const myTeams = [{ id: 't1' }] as any;

    vi.mocked(prisma.match.findMany)
      .mockResolvedValueOnce(pendingMatches)
      .mockResolvedValueOnce(pastMatches);
    vi.mocked(prisma.team.findMany).mockResolvedValueOnce(myTeams);
    mockInsightsService.computeWeeklyInsights.mockResolvedValueOnce(mockWeeklyInsights);

    const service = new DashboardService(mockInsightsService as any);
    const result = await service.getSnapshot();

    expect(result.pendingMatches).toEqual(pendingMatches);
    expect(result.pastMatches).toEqual(pastMatches);
    expect(result.myTeams).toEqual(myTeams);
    expect(result.weeklyInsights).toEqual(mockWeeklyInsights);

    expect(prisma.match.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.team.findMany).toHaveBeenCalledTimes(1);
    expect(mockInsightsService.computeWeeklyInsights).toHaveBeenCalled();
  });
});
