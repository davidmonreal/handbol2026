import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import type { WeeklyInsightsResponse } from './insights-service';
import { InsightsService } from './insights-service';

// Select only fields needed by the dashboard cards to reduce payload and query cost.
const MATCH_SELECT = {
  id: true,
  date: true,
  isFinished: true,
  homeScore: true,
  awayScore: true,
  videoUrl: true,
  homeEventsLocked: true,
  awayEventsLocked: true,
  homeTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      isMyTeam: true,
      club: { select: { name: true } },
    },
  },
  awayTeam: {
    select: {
      id: true,
      name: true,
      category: true,
      isMyTeam: true,
      club: { select: { name: true } },
    },
  },
} as const;

// Minimal shape for "my teams" panel to avoid loading unused relations.
const TEAM_SELECT = {
  id: true,
  name: true,
  category: true,
  isMyTeam: true,
  club: { select: { name: true } },
} as const;

type DashboardMatch = Prisma.MatchGetPayload<{ select: typeof MATCH_SELECT }>;
type DashboardTeam = Prisma.TeamGetPayload<{ select: typeof TEAM_SELECT }>;

export interface DashboardSnapshot {
  pendingMatches: DashboardMatch[];
  pastMatches: DashboardMatch[];
  myTeams: DashboardTeam[];
  weeklyInsights: WeeklyInsightsResponse;
}

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

// Show more items on home so past matches remain visible without tweaking env vars
const PENDING_LIMIT = parseLimit(process.env.DASHBOARD_PENDING_MATCH_LIMIT, 10);
const RECENT_LIMIT = parseLimit(process.env.DASHBOARD_RECENT_MATCH_LIMIT, 15);

export class DashboardService {
  constructor(private insightsService: InsightsService = new InsightsService()) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const [pendingMatches, pastMatches, myTeams, weeklyInsights] = await Promise.all([
      prisma.match.findMany({
        where: { isFinished: false },
        select: MATCH_SELECT,
        orderBy: { date: 'asc' },
        take: PENDING_LIMIT,
      }),
      prisma.match.findMany({
        where: { isFinished: true },
        select: MATCH_SELECT,
        orderBy: { date: 'desc' },
        take: RECENT_LIMIT,
      }),
      prisma.team.findMany({
        where: { isMyTeam: true },
        select: TEAM_SELECT,
        orderBy: { name: 'asc' },
      }),
      this.insightsService.computeWeeklyInsights(),
    ]);

    return {
      pendingMatches,
      pastMatches,
      myTeams,
      weeklyInsights,
    };
  }
}
