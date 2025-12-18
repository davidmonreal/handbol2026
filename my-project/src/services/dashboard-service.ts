import type { Club, Match, Season, Team } from '@prisma/client';
import prisma from '../lib/prisma';
import type { WeeklyInsightsResponse } from './insights-service';
import { InsightsService } from './insights-service';

type MatchWithTeams = Match & {
  homeTeam: Team & { club: Club | null };
  awayTeam: Team & { club: Club | null };
};

type TeamWithRelations = Team & {
  club: Club | null;
  season: Season | null;
};

export interface DashboardSnapshot {
  pendingMatches: MatchWithTeams[];
  pastMatches: MatchWithTeams[];
  myTeams: TeamWithRelations[];
  weeklyInsights: WeeklyInsightsResponse;
}

const MATCH_INCLUDE = {
  homeTeam: { include: { club: true } },
  awayTeam: { include: { club: true } },
} as const;

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const PENDING_LIMIT = parseLimit(process.env.DASHBOARD_PENDING_MATCH_LIMIT, 5);
const RECENT_LIMIT = parseLimit(process.env.DASHBOARD_RECENT_MATCH_LIMIT, 5);

export class DashboardService {
  constructor(private insightsService: InsightsService = new InsightsService()) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const [pendingMatches, pastMatches, myTeams, weeklyInsights] = await Promise.all([
      prisma.match.findMany({
        where: { isFinished: false },
        include: MATCH_INCLUDE,
        orderBy: { date: 'asc' },
        take: PENDING_LIMIT,
      }),
      prisma.match.findMany({
        where: { isFinished: true },
        include: MATCH_INCLUDE,
        orderBy: { date: 'desc' },
        take: RECENT_LIMIT,
      }),
      prisma.team.findMany({
        where: { isMyTeam: true },
        include: {
          club: true,
          season: true,
        },
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
