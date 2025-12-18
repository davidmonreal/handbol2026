/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InsightsService } from '../src/services/insights-service';
import prisma from '../src/lib/prisma';
import { buildWeeklyTickerMetrics } from '../src/services/weekly-ticker-metrics';

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached data when entry is fresh', async () => {
    const cachedMetrics = { totalGoals: 42 } as any;
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
    vi.mocked(buildWeeklyTickerMetrics).mockReturnValue({ totalGoals: 0 } as any);

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
    expect(result.metrics).toEqual({ totalGoals: 0 });
  });

  it('forces recompute when requested even if cache exists', async () => {
    vi.mocked(prisma.weeklyInsightCache.findUnique).mockResolvedValue({
      id: 'cache',
      rangeStart: testRange.start,
      rangeEnd: testRange.end,
      generatedAt: new Date(),
      payload: { cached: true },
    } as any);
    vi.mocked(prisma.gameEvent.findMany).mockResolvedValue([] as any);
    vi.mocked(buildWeeklyTickerMetrics).mockReturnValue({ totalGoals: 99 } as any);

    const service = new InsightsService(ttlMs);
    const result = await service.computeWeeklyInsights(testRange, { forceRefresh: true });

    expect(prisma.gameEvent.findMany).toHaveBeenCalled();
    expect(result.metrics).toEqual({ totalGoals: 99 });
  });
});
