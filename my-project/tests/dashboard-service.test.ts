/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DashboardService } from '../src/services/dashboard-service';
import type { WeeklyInsightsResponse } from '../src/services/insights-service';

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

describe('DashboardService', () => {
  const matchRepository = {
    findPending: vi.fn(),
    findRecent: vi.fn(),
  };
  const teamRepository = {
    findMyTeams: vi.fn(),
  };
  const insightsPort = {
    computeWeeklyInsights: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns dashboard snapshot combining matches, teams, and insights', async () => {
    const pendingMatches = [{ id: 'm1' }] as any;
    const pastMatches = [{ id: 'm2' }] as any;
    const myTeams = [{ id: 't1' }] as any;

    matchRepository.findPending.mockResolvedValueOnce(pendingMatches);
    matchRepository.findRecent.mockResolvedValueOnce(pastMatches);
    teamRepository.findMyTeams.mockResolvedValueOnce(myTeams);
    insightsPort.computeWeeklyInsights.mockResolvedValueOnce(mockWeeklyInsights);

    const service = new DashboardService(
      matchRepository as any,
      teamRepository as any,
      insightsPort as any,
    );
    const result = await service.getSnapshot();

    expect(result.pendingMatches).toEqual(pendingMatches);
    expect(result.pastMatches).toEqual(pastMatches);
    expect(result.myTeams).toEqual(myTeams);
    expect(result.weeklyInsights).toEqual(mockWeeklyInsights);

    expect(matchRepository.findPending).toHaveBeenCalledTimes(1);
    expect(matchRepository.findRecent).toHaveBeenCalledTimes(1);
    expect(teamRepository.findMyTeams).toHaveBeenCalledTimes(1);
    expect(insightsPort.computeWeeklyInsights).toHaveBeenCalled();
  });
});
