import type { Club, GameEvent, Match, Player, Team } from '@prisma/client';
import prisma from '../lib/prisma';

interface WeeklyRange {
  start: Date;
  end: Date;
}

interface TeamSummary {
  teamId: string;
  teamName: string;
  teamCategory: string;
  clubName: string;
}

export interface PlayerGoalInsight extends TeamSummary {
  playerId: string;
  playerName: string;
  goals: number;
}

export interface TeamCountInsight extends TeamSummary {
  count: number;
}

export interface WeeklyInsightsResponse {
  range: { start: string; end: string };
  generatedAt: string;
  metrics: {
    totalEvents: number;
    topScorerOverall: PlayerGoalInsight | null;
    topScorersByCategory: PlayerGoalInsight[];
    topIndividualScorer: PlayerGoalInsight | null;
    teamWithMostCollectiveGoals: TeamCountInsight | null;
    teamWithMostFouls: TeamCountInsight | null;
  };
}

type EventWithRelations = GameEvent & {
  player: Player | null;
  match: Match & {
    homeTeam: Team & { club?: Club | null };
    awayTeam: Team & { club?: Club | null };
  };
};

export class InsightsService {
  getDefaultRange(reference: Date = new Date()): WeeklyRange {
    const weekStart = this.getStartOfWeek(reference);
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    return { start: previousWeekStart, end: weekStart };
  }

  async computeWeeklyInsights(range?: WeeklyRange): Promise<WeeklyInsightsResponse> {
    const activeRange = range ?? this.getDefaultRange();

    const events = await prisma.gameEvent.findMany({
      where: {
        match: {
          date: {
            gte: activeRange.start,
            lt: activeRange.end,
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
    });

    const playerGoals = new Map<string, PlayerGoalInsight>();
    const playerIndividualGoals = new Map<string, PlayerGoalInsight>();
    const categoryPlayers = new Map<string, Map<string, PlayerGoalInsight>>();
    const teamCollectiveGoals = new Map<string, TeamCountInsight>();
    const teamFoulCounts = new Map<string, TeamCountInsight>();

    events.forEach((event) => {
      const teamInfo = this.resolveTeam(event.teamId, event.match);
      if (event.type === 'Shot' && event.subtype === 'Goal' && teamInfo) {
        if (event.playerId) {
          const playerEntry = this.upsertPlayerEntry(playerGoals, event, teamInfo);
          playerEntry.goals += 1;

          const categoryMap =
            categoryPlayers.get(teamInfo.teamCategory) ?? new Map<string, PlayerGoalInsight>();
          categoryPlayers.set(teamInfo.teamCategory, categoryMap);
          const categoryEntry = this.upsertPlayerEntry(categoryMap, event, teamInfo);
          categoryEntry.goals += 1;

          if (!event.isCollective) {
            const individualEntry = this.upsertPlayerEntry(playerIndividualGoals, event, teamInfo);
            individualEntry.goals += 1;
          }
        }

        if (event.isCollective) {
          const collectiveEntry = this.upsertTeamEntry(teamCollectiveGoals, teamInfo);
          collectiveEntry.count += 1;
        }
      }

      if (event.type === 'Sanction' && event.sanctionType === 'Foul') {
        const opponentTeam = this.resolveOpponentTeam(event.teamId, event.match);
        if (opponentTeam) {
          const foulEntry = this.upsertTeamEntry(teamFoulCounts, opponentTeam);
          foulEntry.count += 1;
        }
      }
    });

    return {
      range: {
        start: activeRange.start.toISOString(),
        end: activeRange.end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
      metrics: {
        totalEvents: events.length,
        topScorerOverall: this.pickTopPlayer(playerGoals),
        topScorersByCategory: this.buildCategoryLeaders(categoryPlayers),
        topIndividualScorer: this.pickTopPlayer(playerIndividualGoals),
        teamWithMostCollectiveGoals: this.pickTopTeam(teamCollectiveGoals),
        teamWithMostFouls: this.pickTopTeam(teamFoulCounts),
      },
    };
  }

  private getStartOfWeek(reference: Date): Date {
    const result = new Date(reference);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay();
    const diff = (day + 6) % 7; // Monday as first day
    result.setDate(result.getDate() - diff);
    return result;
  }

  private resolveTeam(teamId: string, match: EventWithRelations['match']): TeamSummary | null {
    if (match.homeTeamId === teamId) {
      return {
        teamId: match.homeTeamId,
        teamName: match.homeTeam.name,
        teamCategory: match.homeTeam.category,
        clubName: match.homeTeam.club?.name ?? match.homeTeam.name,
      };
    }
    if (match.awayTeamId === teamId) {
      return {
        teamId: match.awayTeamId,
        teamName: match.awayTeam.name,
        teamCategory: match.awayTeam.category,
        clubName: match.awayTeam.club?.name ?? match.awayTeam.name,
      };
    }
    return null;
  }

  private resolveOpponentTeam(
    teamId: string,
    match: EventWithRelations['match'],
  ): TeamSummary | null {
    if (match.homeTeamId === teamId) {
      return {
        teamId: match.awayTeamId,
        teamName: match.awayTeam.name,
        teamCategory: match.awayTeam.category,
        clubName: match.awayTeam.club?.name ?? match.awayTeam.name,
      };
    }
    if (match.awayTeamId === teamId) {
      return {
        teamId: match.homeTeamId,
        teamName: match.homeTeam.name,
        teamCategory: match.homeTeam.category,
        clubName: match.homeTeam.club?.name ?? match.homeTeam.name,
      };
    }
    return null;
  }

  private upsertPlayerEntry(
    storage: Map<string, PlayerGoalInsight>,
    event: EventWithRelations,
    teamInfo: TeamSummary,
  ) {
    const playerId = event.playerId as string;
    const existing = storage.get(playerId);
    if (existing) {
      existing.playerName = event.player?.name ?? existing.playerName;
      return existing;
    }

    const newEntry: PlayerGoalInsight = {
      playerId,
      playerName: event.player?.name ?? 'Unknown Player',
      teamId: teamInfo.teamId,
      teamName: teamInfo.teamName,
      teamCategory: teamInfo.teamCategory,
      clubName: teamInfo.clubName,
      goals: 0,
    };
    storage.set(playerId, newEntry);
    return newEntry;
  }

  private upsertTeamEntry(storage: Map<string, TeamCountInsight>, teamInfo: TeamSummary) {
    const existing = storage.get(teamInfo.teamId);
    if (existing) {
      return existing;
    }

    const newEntry: TeamCountInsight = {
      teamId: teamInfo.teamId,
      teamName: teamInfo.teamName,
      teamCategory: teamInfo.teamCategory,
      clubName: teamInfo.clubName,
      count: 0,
    };
    storage.set(teamInfo.teamId, newEntry);
    return newEntry;
  }

  private pickTopPlayer(storage: Map<string, PlayerGoalInsight>): PlayerGoalInsight | null {
    if (storage.size === 0) {
      return null;
    }
    return Array.from(storage.values()).sort((a, b) => b.goals - a.goals)[0];
  }

  private pickTopTeam(storage: Map<string, TeamCountInsight>): TeamCountInsight | null {
    if (storage.size === 0) {
      return null;
    }
    return Array.from(storage.values()).sort((a, b) => b.count - a.count)[0];
  }

  private buildCategoryLeaders(
    categoryMaps: Map<string, Map<string, PlayerGoalInsight>>,
  ): PlayerGoalInsight[] {
    const leaders: PlayerGoalInsight[] = [];
    categoryMaps.forEach((playerMap, category) => {
      const topPlayer = this.pickTopPlayer(playerMap);
      if (topPlayer) {
        leaders.push({ ...topPlayer, teamCategory: category });
      }
    });
    return leaders.sort((a, b) => a.teamCategory.localeCompare(b.teamCategory));
  }
}
