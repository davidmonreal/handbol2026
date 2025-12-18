import type { Club, GameEvent, Match, Player, Team } from '@prisma/client';

export type EventWithRelations = GameEvent & {
  player: Player | null;
  match: Match & {
    homeTeam: Team & { club?: Club | null };
    awayTeam: Team & { club?: Club | null };
  };
};

export interface TeamSummary {
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

export interface WeeklyTickerMetrics {
  totalEvents: number;
  topScorerOverall: PlayerGoalInsight | null;
  topScorersByCategory: PlayerGoalInsight[];
  topIndividualScorer: PlayerGoalInsight | null;
  teamWithMostCollectiveGoals: TeamCountInsight | null;
  teamWithMostFouls: TeamCountInsight | null;
}

export class WeeklyTickerMetricsCalculator {
  private readonly playerGoals = new Map<string, PlayerGoalInsight>();
  private readonly playerIndividualGoals = new Map<string, PlayerGoalInsight>();
  private readonly categoryPlayers = new Map<string, Map<string, PlayerGoalInsight>>();
  private readonly teamCollectiveGoals = new Map<string, TeamCountInsight>();
  private readonly teamFoulCounts = new Map<string, TeamCountInsight>();
  private totalEvents = 0;

  consume(event: EventWithRelations) {
    this.totalEvents += 1;

    if (event.type === 'Shot' && event.subtype === 'Goal') {
      this.processGoalEvent(event);
    }

    if (event.type === 'Sanction' && event.sanctionType === 'Foul') {
      this.processFoulEvent(event);
    }
  }

  result(): WeeklyTickerMetrics {
    return {
      totalEvents: this.totalEvents,
      topScorerOverall: this.pickTopPlayer(this.playerGoals),
      topScorersByCategory: this.buildCategoryLeaders(),
      topIndividualScorer: this.pickTopPlayer(this.playerIndividualGoals),
      teamWithMostCollectiveGoals: this.pickTopTeam(this.teamCollectiveGoals),
      teamWithMostFouls: this.pickTopTeam(this.teamFoulCounts),
    };
  }

  private processGoalEvent(event: EventWithRelations) {
    if (!event.teamId) {
      return;
    }
    const teamInfo = this.resolveTeam(event.teamId, event.match);
    if (!teamInfo) {
      return;
    }

    if (event.playerId) {
      const playerEntry = this.upsertPlayerEntry(this.playerGoals, event, teamInfo);
      playerEntry.goals += 1;

      const categoryMap =
        this.categoryPlayers.get(teamInfo.teamCategory) ?? new Map<string, PlayerGoalInsight>();
      this.categoryPlayers.set(teamInfo.teamCategory, categoryMap);
      const categoryEntry = this.upsertPlayerEntry(categoryMap, event, teamInfo);
      categoryEntry.goals += 1;

      if (!event.isCollective) {
        const individualEntry = this.upsertPlayerEntry(this.playerIndividualGoals, event, teamInfo);
        individualEntry.goals += 1;
      }
    }

    if (event.isCollective) {
      const collectiveEntry = this.upsertTeamEntry(this.teamCollectiveGoals, teamInfo);
      collectiveEntry.count += 1;
    }
  }

  private processFoulEvent(event: EventWithRelations) {
    if (!event.teamId) {
      return;
    }
    const opponentTeam = this.resolveOpponentTeam(event.teamId, event.match);
    if (!opponentTeam) {
      return;
    }
    const foulEntry = this.upsertTeamEntry(this.teamFoulCounts, opponentTeam);
    foulEntry.count += 1;
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

  private buildCategoryLeaders(): PlayerGoalInsight[] {
    const leaders: PlayerGoalInsight[] = [];
    this.categoryPlayers.forEach((playerMap, category) => {
      const topPlayer = this.pickTopPlayer(playerMap);
      if (topPlayer) {
        leaders.push({ ...topPlayer, teamCategory: category });
      }
    });
    return leaders.sort((a, b) => a.teamCategory.localeCompare(b.teamCategory));
  }
}

export const buildWeeklyTickerMetrics = (events: EventWithRelations[]): WeeklyTickerMetrics => {
  const calculator = new WeeklyTickerMetricsCalculator();
  events.forEach((event) => calculator.consume(event));
  return calculator.result();
};
