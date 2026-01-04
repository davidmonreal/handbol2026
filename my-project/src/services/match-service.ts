/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Match } from '@prisma/client';
import { BaseService } from './base-service';
import { MatchRepository } from '../repositories/match-repository';
import { TeamRepository } from '../repositories/team-repository';
import { GameEventRepository } from '../repositories/game-event-repository';
import { PlayerRepository } from '../repositories/player-repository';
import {
  createMatchSchema,
  updateMatchSchema,
  CreateMatchInput,
  UpdateMatchInput,
  PreviewMatchTeamMigrationInput,
  ApplyMatchTeamMigrationInput,
} from '../schemas';
import { ZodError, ZodIssue } from 'zod';

function mapMatchIssue(issue: ZodIssue | undefined) {
  // Normalize validation errors to predictable, user-facing wording
  const pathHead = Array.isArray(issue?.path) ? issue?.path[0] : undefined;
  if (pathHead === 'date') return 'Invalid date format';
  if (issue?.message) return issue.message;
  return 'Invalid match payload';
}

export class MatchService extends BaseService<Match> {
  constructor(
    private matchRepository: MatchRepository,
    private teamRepository: TeamRepository,
    private gameEventRepository: GameEventRepository,
    private playerRepository: PlayerRepository,
  ) {
    super(matchRepository);
  }

  async getAll(): Promise<any[]> {
    // Scores are maintained in homeScore/awayScore columns by GameEventService
    // No need to fetch and filter events - significant performance improvement
    return this.matchRepository.findAll();
  }

  async findById(id: string): Promise<Match | null> {
    const match = await this.matchRepository.findById(id);
    if (!match) return null;

    const enrichTeamPositions = async (team: any) => {
      if (!team?.players?.length) return team;
      const hasMissingPositions = team.players.some((entry: any) => entry.position == null);
      if (!hasMissingPositions) return team;

      const teamWithPositions = await this.teamRepository.findTeamWithPlayerPositions(team.id);

      if (!teamWithPositions?.players?.length) return team;

      const positionByPlayerId = new Map(
        teamWithPositions.players.map((entry) => [entry.player.id, entry.position]),
      );

      return {
        ...team,
        players: team.players.map((entry: any) => ({
          ...entry,
          position: entry.position ?? positionByPlayerId.get(entry.player.id) ?? entry.position,
        })),
      };
    };

    const enrichedHome = await enrichTeamPositions((match as any).homeTeam);
    const enrichedAway = await enrichTeamPositions((match as any).awayTeam);

    const enrichedMatch = {
      ...match,
      homeTeam: enrichedHome,
      awayTeam: enrichedAway,
    };

    // No automatic recalculation: if match is finished, scores are manual (truth)
    // Goals only contribute to statistics when match is not finished
    return enrichedMatch;
  }

  async create(data: CreateMatchInput): Promise<Match> {
    let validated;
    try {
      validated = createMatchSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapMatchIssue(error.issues[0]));
      }
      throw error;
    }

    // Default finished matches without scores should keep zeros; frontend should send explicit values
    if (validated.isFinished && validated.homeScore === undefined) {
      validated.homeScore = 0;
    }
    if (validated.isFinished && validated.awayScore === undefined) {
      validated.awayScore = 0;
    }

    // Validate home team exists
    const homeTeamExists = await this.teamRepository.exists(validated.homeTeamId);
    if (!homeTeamExists) {
      throw new Error('Home team not found');
    }

    // Validate away team exists
    const awayTeamExists = await this.teamRepository.exists(validated.awayTeamId);
    if (!awayTeamExists) {
      throw new Error('Away team not found');
    }

    return super.create(validated);
  }

  async update(id: string, data: UpdateMatchInput): Promise<Match> {
    let updateData;
    try {
      updateData = updateMatchSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(mapMatchIssue(error.issues[0]));
      }
      throw error;
    }

    // Ensure scores default to zero when finished flag is set without scores
    if (updateData.isFinished && updateData.homeScore === undefined) {
      updateData.homeScore = 0;
    }
    if (updateData.isFinished && updateData.awayScore === undefined) {
      updateData.awayScore = 0;
    }

    // If updating teams, we need to check constraints
    if (updateData.homeTeamId || updateData.awayTeamId) {
      const currentMatch = await this.matchRepository.findById(id);
      if (!currentMatch) {
        throw new Error('Match not found');
      }

      const newHomeId = updateData.homeTeamId || currentMatch.homeTeamId;
      const newAwayId = updateData.awayTeamId || currentMatch.awayTeamId;

      if (newHomeId === newAwayId) {
        throw new Error('Home and Away teams must be different');
      }

      if (updateData.homeTeamId) {
        const homeTeamExists = await this.teamRepository.exists(updateData.homeTeamId);
        if (!homeTeamExists) throw new Error('Home team not found');
      }

      if (updateData.awayTeamId) {
        const awayTeamExists = await this.teamRepository.exists(updateData.awayTeamId);
        if (!awayTeamExists) throw new Error('Away team not found');
      }
    }

    return super.update(id, updateData);
  }

  private assertFinishedMatch(match: Match) {
    if (!match.isFinished) {
      throw new Error('Match must be finished to migrate teams');
    }
  }

  private buildTeamSummary(team: {
    id: string;
    name: string;
    category?: string;
    club?: { name: string };
  }) {
    return {
      id: team.id,
      name: team.name,
      category: team.category,
      clubName: team.club?.name,
    };
  }

  private async resolveTeamChange(match: Match, side: 'home' | 'away', newTeamId: string) {
    const fromTeam = side === 'home' ? (match as any).homeTeam : (match as any).awayTeam;
    const toTeam = await this.teamRepository.findById(newTeamId);
    if (!toTeam) {
      throw new Error(`${side === 'home' ? 'Home' : 'Away'} team not found`);
    }
    return { fromTeam, toTeam };
  }

  async previewTeamMigration(matchId: string, data: PreviewMatchTeamMigrationInput) {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new Error('Match not found');
    this.assertFinishedMatch(match);

    const nextHomeId = data.homeTeamId ?? match.homeTeamId;
    const nextAwayId = data.awayTeamId ?? match.awayTeamId;

    if (nextHomeId === nextAwayId) {
      throw new Error('Home and Away teams must be different');
    }

    const changes: Array<{
      side: 'home' | 'away';
      fromTeam: ReturnType<MatchService['buildTeamSummary']>;
      toTeam: ReturnType<MatchService['buildTeamSummary']>;
      eventCount: number;
      players: Array<{ id: string; name: string }>;
      requiresGoalkeeper: boolean;
      goalkeeperEventCount: number;
    }> = [];

    if (data.homeTeamId && data.homeTeamId !== match.homeTeamId) {
      const { fromTeam, toTeam } = await this.resolveTeamChange(match, 'home', data.homeTeamId);
      const eventCount = await this.gameEventRepository.countByMatchAndTeam(matchId, fromTeam.id);
      const playerIds = await this.gameEventRepository.findPlayerIdsByMatchAndTeam(
        matchId,
        fromTeam.id,
      );
      const players = await this.playerRepository.findByIds([...new Set(playerIds)]);
      const goalkeeperEventCount = await this.gameEventRepository.countOpponentGoalkeeperEvents(
        matchId,
        nextAwayId,
      );
      changes.push({
        side: 'home',
        fromTeam: this.buildTeamSummary(fromTeam),
        toTeam: this.buildTeamSummary(toTeam),
        eventCount,
        players: players.map((player) => ({
          id: player.id,
          name: player.name,
        })),
        requiresGoalkeeper: goalkeeperEventCount > 0,
        goalkeeperEventCount,
      });
    }

    if (data.awayTeamId && data.awayTeamId !== match.awayTeamId) {
      const { fromTeam, toTeam } = await this.resolveTeamChange(match, 'away', data.awayTeamId);
      const eventCount = await this.gameEventRepository.countByMatchAndTeam(matchId, fromTeam.id);
      const playerIds = await this.gameEventRepository.findPlayerIdsByMatchAndTeam(
        matchId,
        fromTeam.id,
      );
      const players = await this.playerRepository.findByIds([...new Set(playerIds)]);
      const goalkeeperEventCount = await this.gameEventRepository.countOpponentGoalkeeperEvents(
        matchId,
        nextHomeId,
      );
      changes.push({
        side: 'away',
        fromTeam: this.buildTeamSummary(fromTeam),
        toTeam: this.buildTeamSummary(toTeam),
        eventCount,
        players: players.map((player) => ({
          id: player.id,
          name: player.name,
        })),
        requiresGoalkeeper: goalkeeperEventCount > 0,
        goalkeeperEventCount,
      });
    }

    if (changes.length === 0) {
      throw new Error('No team changes detected');
    }

    return {
      matchId,
      isFinished: match.isFinished,
      changes,
    };
  }

  async applyTeamMigration(matchId: string, data: ApplyMatchTeamMigrationInput) {
    const match = await this.matchRepository.findById(matchId);
    if (!match) throw new Error('Match not found');
    this.assertFinishedMatch(match);

    const nextHomeId = data.homeTeamId ?? match.homeTeamId;
    const nextAwayId = data.awayTeamId ?? match.awayTeamId;

    if (nextHomeId === nextAwayId) {
      throw new Error('Home and Away teams must be different');
    }

    const teamEventUpdates: Array<{ fromTeamId: string; toTeamId: string }> = [];
    const opponentGoalkeeperUpdates: Array<{ attackingTeamId: string; goalkeeperId: string }> = [];
    const assignmentGroups: Array<{ fromTeamId: string; teamId: string; playerIds: string[] }> = [];

    if (data.homeTeamId && data.homeTeamId !== match.homeTeamId) {
      await this.resolveTeamChange(match, 'home', data.homeTeamId);
      const goalkeeperEventCount = await this.gameEventRepository.countOpponentGoalkeeperEvents(
        matchId,
        nextAwayId,
      );
      if (goalkeeperEventCount > 0 && !data.homeGoalkeeperId) {
        throw new Error('Home goalkeeper is required to migrate this match');
      }

      if (data.homeGoalkeeperId) {
        const goalkeeper = await this.playerRepository.findById(data.homeGoalkeeperId);
        if (!goalkeeper) throw new Error('Home goalkeeper not found');
        opponentGoalkeeperUpdates.push({
          attackingTeamId: nextAwayId,
          goalkeeperId: data.homeGoalkeeperId,
        });
      }

      const playerIds = await this.gameEventRepository.findPlayerIdsByMatchAndTeam(
        matchId,
        match.homeTeamId,
      );
      const assignments = new Set(playerIds);
      if (data.homeGoalkeeperId) assignments.add(data.homeGoalkeeperId);
      assignmentGroups.push({
        fromTeamId: match.homeTeamId,
        teamId: nextHomeId,
        playerIds: [...assignments],
      });

      teamEventUpdates.push({ fromTeamId: match.homeTeamId, toTeamId: nextHomeId });
    }

    if (data.awayTeamId && data.awayTeamId !== match.awayTeamId) {
      await this.resolveTeamChange(match, 'away', data.awayTeamId);
      const goalkeeperEventCount = await this.gameEventRepository.countOpponentGoalkeeperEvents(
        matchId,
        nextHomeId,
      );
      if (goalkeeperEventCount > 0 && !data.awayGoalkeeperId) {
        throw new Error('Away goalkeeper is required to migrate this match');
      }

      if (data.awayGoalkeeperId) {
        const goalkeeper = await this.playerRepository.findById(data.awayGoalkeeperId);
        if (!goalkeeper) throw new Error('Away goalkeeper not found');
        opponentGoalkeeperUpdates.push({
          attackingTeamId: nextHomeId,
          goalkeeperId: data.awayGoalkeeperId,
        });
      }

      const playerIds = await this.gameEventRepository.findPlayerIdsByMatchAndTeam(
        matchId,
        match.awayTeamId,
      );
      const assignments = new Set(playerIds);
      if (data.awayGoalkeeperId) assignments.add(data.awayGoalkeeperId);
      assignmentGroups.push({
        fromTeamId: match.awayTeamId,
        teamId: nextAwayId,
        playerIds: [...assignments],
      });

      teamEventUpdates.push({ fromTeamId: match.awayTeamId, toTeamId: nextAwayId });
    }

    if (teamEventUpdates.length === 0) {
      throw new Error('No team changes detected');
    }

    const matchPatch: Partial<{ homeTeamId: string; awayTeamId: string }> = {};
    if (data.homeTeamId) matchPatch.homeTeamId = nextHomeId;
    if (data.awayTeamId) matchPatch.awayTeamId = nextAwayId;

    const playerAssignments = await Promise.all(
      assignmentGroups.map(async (group) => {
        const { fromTeamId, teamId, playerIds } = group;
        if (playerIds.length === 0) return { teamId, players: [] };

        const numbers = await this.teamRepository.findPlayerNumbers(fromTeamId, playerIds);
        const numberByPlayerId = new Map(numbers.map((entry) => [entry.playerId, entry.number]));

        const missingNumbers = playerIds.filter((playerId) => !numberByPlayerId.has(playerId));
        if (missingNumbers.length > 0) {
          throw new Error('Players are missing numbers in the source team');
        }

        const existingAssignments = await this.teamRepository.findPlayerNumbers(teamId, playerIds);
        const existingByPlayerId = new Set(existingAssignments.map((entry) => entry.playerId));

        const playersToAssign = playerIds.filter((playerId) => !existingByPlayerId.has(playerId));
        const players = await Promise.all(
          playersToAssign.map(async (playerId) => {
            const number = numberByPlayerId.get(playerId) as number;
            const isNumberTaken = await this.teamRepository.isNumberAssigned(
              teamId,
              number,
              playerId,
            );
            if (isNumberTaken) {
              throw new Error('Player number already assigned to this team');
            }
            return { playerId, number };
          }),
        );

        return { teamId, players };
      }),
    );

    return this.matchRepository.applyTeamMigration({
      matchId,
      matchPatch,
      teamEventUpdates,
      opponentGoalkeeperUpdates,
      playerAssignments,
    });
  }

  async delete(id: string): Promise<Match> {
    // Delete related events first since we don't have cascade delete in schema
    await this.gameEventRepository.deleteByMatchId(id);
    return this.repository.delete(id);
  }
}
