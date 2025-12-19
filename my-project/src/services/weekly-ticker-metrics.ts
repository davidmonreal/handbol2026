import type { Club, GameEvent, Match, Player, Team } from '@prisma/client';

export type EventWithRelations = GameEvent & {
  player: Player | null;
  activeGoalkeeper: Player | null;
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

export interface GoalkeeperInsight extends TeamSummary {
  playerId: string;
  playerName: string;
  saves: number;
  shotsFaced: number;
  savePercentage: number;
}

export interface TeamPercentageInsight extends TeamSummary {
  percentage: number;
  successes: number;
  attempts: number;
}

export interface WeeklyTickerMetrics {
  totalEvents: number;
  topScorerOverall: PlayerGoalInsight | null;
  topScorersByCategory: PlayerGoalInsight[];
  topIndividualScorer: PlayerGoalInsight | null;
  teamWithMostCollectiveGoals: TeamCountInsight | null;
  teamWithMostFouls: TeamCountInsight | null;
  bestGoalkeeper: GoalkeeperInsight | null;
  mostEfficientTeam: TeamPercentageInsight | null;
  mostAttackingTeam: TeamPercentageInsight | null;
}

export class WeeklyTickerMetricsCalculator {
  private readonly playerGoals = new Map<string, PlayerGoalInsight>();
  private readonly playerIndividualGoals = new Map<string, PlayerGoalInsight>();
  private readonly categoryPlayers = new Map<string, Map<string, PlayerGoalInsight>>();
  private readonly teamCollectiveGoals = new Map<string, TeamCountInsight>();
  private readonly teamFoulCounts = new Map<string, TeamCountInsight>();
  private readonly goalkeeperStats = new Map<string, GoalkeeperInsight>();
  private readonly teamShotEfficiency = new Map<string, TeamPercentageInsight>();
  private readonly teamPlayEffectiveness = new Map<string, TeamPercentageInsight>();
  private totalEvents = 0;

  consume(event: EventWithRelations) {
    this.totalEvents += 1;

    if (event.teamId) {
      const teamActivity = this.resolveTeam(event.teamId, event.match);
      if (teamActivity) {
        const activityEntry = this.upsertPercentageEntry(this.teamPlayEffectiveness, teamActivity);
        activityEntry.attempts += 1;
        if (event.type === 'Shot' && event.subtype === 'Goal') {
          activityEntry.successes += 1;
        }
        activityEntry.percentage = this.computePercentage(
          activityEntry.successes,
          activityEntry.attempts,
        );
      }
    }

    if (event.type === 'Shot') {
      this.processShotStats(event);
    }

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
      bestGoalkeeper: this.pickBestGoalkeeper(),
      mostEfficientTeam: this.pickTopPercentageTeam(this.teamShotEfficiency),
      mostAttackingTeam: this.pickTopPercentageTeam(this.teamPlayEffectiveness),
    };
  }

  private processShotStats(event: EventWithRelations) {
    if (event.teamId) {
      const shootingTeam = this.resolveTeam(event.teamId, event.match);
      if (shootingTeam) {
        const entry = this.upsertPercentageEntry(this.teamShotEfficiency, shootingTeam);
        entry.attempts += 1;
        if (event.subtype === 'Goal') {
          entry.successes += 1;
        }
        entry.percentage = this.computePercentage(entry.successes, entry.attempts);
      }
    }

    if (event.activeGoalkeeperId && event.teamId) {
      const defendingTeam = this.resolveOpponentTeam(event.teamId, event.match);
      if (defendingTeam) {
        const entry = this.upsertGoalkeeperEntry(event, defendingTeam);
        const isTrackedOutcome = event.subtype === 'Save' || event.subtype === 'Goal';
        if (isTrackedOutcome) {
          entry.shotsFaced += 1;
          if (event.subtype === 'Save') {
            entry.saves += 1;
          }
          entry.savePercentage = this.computePercentage(entry.saves, entry.shotsFaced);
        }
      }
    }
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

  private pickBestGoalkeeper(): GoalkeeperInsight | null {
    const candidates = Array.from(this.goalkeeperStats.values()).filter(
      (entry) => entry.shotsFaced > 0,
    );
    if (!candidates.length) {
      return null;
    }
    return candidates.sort((a, b) => {
      if (b.savePercentage === a.savePercentage) {
        return b.shotsFaced - a.shotsFaced;
      }
      return b.savePercentage - a.savePercentage;
    })[0];
  }

  private pickTopPercentageTeam(
    storage: Map<string, TeamPercentageInsight>,
  ): TeamPercentageInsight | null {
    const candidates = Array.from(storage.values()).filter(
      (entry) => entry.attempts > 0 && entry.successes > 0,
    );
    if (!candidates.length) {
      return null;
    }
    return candidates.sort((a, b) => b.percentage - a.percentage)[0];
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

  private upsertGoalkeeperEntry(
    event: EventWithRelations,
    teamInfo: TeamSummary,
  ): GoalkeeperInsight {
    const goalkeeperId = event.activeGoalkeeperId as string;
    const existing = this.goalkeeperStats.get(goalkeeperId);
    if (existing) {
      existing.playerName = event.activeGoalkeeper?.name ?? existing.playerName;
      return existing;
    }
    const entry: GoalkeeperInsight = {
      playerId: goalkeeperId,
      playerName: event.activeGoalkeeper?.name ?? 'Unknown goalkeeper',
      teamId: teamInfo.teamId,
      teamName: teamInfo.teamName,
      teamCategory: teamInfo.teamCategory,
      clubName: teamInfo.clubName,
      saves: 0,
      shotsFaced: 0,
      savePercentage: 0,
    };
    this.goalkeeperStats.set(goalkeeperId, entry);
    return entry;
  }

  private upsertPercentageEntry(
    storage: Map<string, TeamPercentageInsight>,
    teamInfo: TeamSummary,
  ): TeamPercentageInsight {
    const existing = storage.get(teamInfo.teamId);
    if (existing) {
      return existing;
    }
    const entry: TeamPercentageInsight = {
      teamId: teamInfo.teamId,
      teamName: teamInfo.teamName,
      teamCategory: teamInfo.teamCategory,
      clubName: teamInfo.clubName,
      percentage: 0,
      successes: 0,
      attempts: 0,
    };
    storage.set(teamInfo.teamId, entry);
    return entry;
  }

  private computePercentage(successes: number, attempts: number): number {
    if (!attempts) {
      return 0;
    }
    return Math.round(((successes / attempts) * 100 + Number.EPSILON) * 10) / 10;
  }
}

export const buildWeeklyTickerMetrics = (events: EventWithRelations[]): WeeklyTickerMetrics => {
  const calculator = new WeeklyTickerMetricsCalculator();
  events.forEach((event) => calculator.consume(event));
  return calculator.result();
};
