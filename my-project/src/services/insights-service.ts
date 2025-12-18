import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import type { EventWithRelations, WeeklyTickerMetrics } from './weekly-ticker-metrics';
import { buildWeeklyTickerMetrics } from './weekly-ticker-metrics';

interface WeeklyRange {
  start: Date;
  end: Date;
}

export interface WeeklyInsightsResponse {
  range: { start: string; end: string };
  generatedAt: string;
  metrics: WeeklyTickerMetrics;
}

interface ComputeOptions {
  forceRefresh?: boolean;
}

const FALLBACK_CACHE_TTL_MINUTES = 24 * 60; // default 24h cache
const parsedTtl = Number(process.env.WEEKLY_INSIGHTS_CACHE_TTL_MINUTES);
const DEFAULT_CACHE_TTL_MS =
  Number.isFinite(parsedTtl) && parsedTtl >= 0
    ? parsedTtl * 60 * 1000
    : FALLBACK_CACHE_TTL_MINUTES * 60 * 1000;

export class InsightsService {
  constructor(private cacheTtlMs: number = DEFAULT_CACHE_TTL_MS) {}

  getDefaultRange(reference: Date = new Date()): WeeklyRange {
    const weekStart = this.getStartOfWeek(reference);
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    return { start: previousWeekStart, end: weekStart };
  }

  async computeWeeklyInsights(
    range?: WeeklyRange,
    options?: ComputeOptions,
  ): Promise<WeeklyInsightsResponse> {
    const activeRange = range ?? this.getDefaultRange();

    if (!options?.forceRefresh) {
      const cached = await this.getCachedWeeklyInsights(activeRange);
      if (cached) {
        return cached;
      }
    }

    const fresh = await this.buildWeeklyInsights(activeRange);
    await this.saveWeeklyInsights(activeRange, fresh);
    return fresh;
  }

  private async buildWeeklyInsights(range: WeeklyRange): Promise<WeeklyInsightsResponse> {
    const events = (await prisma.gameEvent.findMany({
      where: {
        match: {
          date: {
            gte: range.start,
            lt: range.end,
          },
        },
      },
      include: {
        player: true,
        match: {
          include: {
            homeTeam: {
              include: {
                club: true,
              },
            },
            awayTeam: {
              include: {
                club: true,
              },
            },
          },
        },
      },
    })) as EventWithRelations[];

    const metrics = buildWeeklyTickerMetrics(events);

    return {
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
      metrics,
    };
  }

  private async getCachedWeeklyInsights(
    range: WeeklyRange,
  ): Promise<WeeklyInsightsResponse | null> {
    if (!this.cacheTtlMs) {
      return null;
    }

    const entry = await prisma.weeklyInsightCache.findUnique({
      where: {
        rangeStart_rangeEnd: {
          rangeStart: range.start,
          rangeEnd: range.end,
        },
      },
    });

    if (!entry) {
      return null;
    }

    const isFresh = Date.now() - entry.generatedAt.getTime() <= this.cacheTtlMs;
    if (!isFresh) {
      return null;
    }

    return {
      range: {
        start: entry.rangeStart.toISOString(),
        end: entry.rangeEnd.toISOString(),
      },
      generatedAt: entry.generatedAt.toISOString(),
      metrics: entry.payload as unknown as WeeklyTickerMetrics,
    };
  }

  private async saveWeeklyInsights(range: WeeklyRange, data: WeeklyInsightsResponse) {
    const generatedAt = new Date(data.generatedAt);
    const serializedMetrics = data.metrics as unknown as Prisma.InputJsonValue;
    await prisma.weeklyInsightCache.upsert({
      where: {
        rangeStart_rangeEnd: {
          rangeStart: range.start,
          rangeEnd: range.end,
        },
      },
      update: {
        generatedAt,
        payload: serializedMetrics,
      },
      create: {
        rangeStart: range.start,
        rangeEnd: range.end,
        generatedAt,
        payload: serializedMetrics,
      },
    });
  }

  private getStartOfWeek(reference: Date): Date {
    const result = new Date(reference);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay();
    const diff = (day + 6) % 7; // Monday as first day
    result.setDate(result.getDate() - diff);
    return result;
  }
}
