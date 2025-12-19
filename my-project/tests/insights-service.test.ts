/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsService } from '../src/services/insights-service';
import prisma from '../src/lib/prisma';
import { buildWeeklyTickerMetrics } from '../src/services/weekly-ticker-metrics';
import type { WeeklyTickerMetrics } from '../src/services/weekly-ticker-metrics';

vi.mock('../src/lib/prisma', () => ({
  default: {
    gameEvent: {
      findMany: vi.fn(),
    },
    weeklyInsightCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../src/services/weekly-ticker-metrics', () => ({
  buildWeeklyTickerMetrics: vi.fn(),
}));

describe('InsightsService caching', () => {
  const testRange = {
    start: new Date('2025-01-01T00:00:00.000Z'),
    end: new Date('2025-01-08T00:00:00.000Z'),
  };

  const ttlMs = 5 * 60 * 1000;

  const metricsPayload = (overrides: Partial<WeeklyTickerMetrics> = {}): WeeklyTickerMetrics => ({
    totalEvents: 0,
    topScorerOverall: null,
    topScorersByCategory: [],
    topIndividualScorer: null,
    teamWithMostCollectiveGoals: null,
    teamWithMostFouls: null,
    bestGoalkeeper: null,
    mostEfficientTeam: null,
    mostAttackingTeam: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached data when entry is fresh', async () => {
    const cachedMetrics = metricsPayload({ totalEvents: 42 });
    vi.mocked(prisma.weeklyInsightCache.findUnique).mockResolvedValue({
      id: 'cache',
      rangeStart: testRange.start,
      rangeEnd: testRange.end,
      generatedAt: new Date(),
      payload: cachedMetrics,
    } as any);

    const service = new InsightsService(ttlMs);
    const result = await service.computeWeeklyInsights(testRange);

    expect(result.metrics).toEqual(cachedMetrics);
    expect(prisma.gameEvent.findMany).not.toHaveBeenCalled();
    expect(prisma.weeklyInsightCache.upsert).not.toHaveBeenCalled();
  });

  it('computes and stores data when cache is missing', async () => {
    vi.mocked(prisma.weeklyInsightCache.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue([] as any);
    vi.mocked(buildWeeklyTickerMetrics).mockReturnValue(metricsPayload());

    const service = new InsightsService(ttlMs);
    const result = await service.computeWeeklyInsights(testRange);

    expect(prisma.gameEvent.findMany).toHaveBeenCalled();
    expect(prisma.weeklyInsightCache.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          rangeStart_rangeEnd: {
            rangeStart: testRange.start,
            rangeEnd: testRange.end,
          },
        },
      }),
    );
    expect(result.metrics).toEqual(metricsPayload());
  });

  it('forces recompute when requested even if cache exists', async () => {
    vi.mocked(prisma.weeklyInsightCache.findUnique).mockResolvedValue({
      id: 'cache',
      rangeStart: testRange.start,
      rangeEnd: testRange.end,
      generatedAt: new Date(),
      payload: metricsPayload({ totalEvents: 1 }),
    } as any);
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue([] as any);
    vi.mocked(buildWeeklyTickerMetrics).mockReturnValue(metricsPayload({ totalEvents: 99 }));

    const service = new InsightsService(ttlMs);
    const result = await service.computeWeeklyInsights(testRange, { forceRefresh: true });

    expect(prisma.gameEvent.findMany).toHaveBeenCalled();
    expect(result.metrics).toEqual(metricsPayload({ totalEvents: 99 }));
  });

  it('treats cached payloads missing the latest metrics as stale', async () => {
    vi.mocked(prisma.weeklyInsightCache.findUnique).mockResolvedValue({
      id: 'cache',
      rangeStart: testRange.start,
      rangeEnd: testRange.end,
      generatedAt: new Date(),
      payload: { totalEvents: 2 },
    } as any);
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue([] as any);
    vi.mocked(buildWeeklyTickerMetrics).mockReturnValue(metricsPayload());

    const service = new InsightsService(ttlMs);
    const result = await service.computeWeeklyInsights(testRange);

    expect(prisma.gameEvent.findMany).toHaveBeenCalled();
    expect(result.metrics).toEqual(metricsPayload());
  });
});
