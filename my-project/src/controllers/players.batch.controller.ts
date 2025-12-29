import { Request, Response } from 'express';
import { PlayerService } from '../services/player-service';
import { PlayerRepository } from '../repositories/player-repository';
import prisma from '../lib/prisma';
import { isGoalkeeperPosition, resolvePlayerPosition } from '../types/player-position';
import { batchPlayersSchema, batchPlayersWithTeamSchema } from '../schemas';

const playerRepository = new PlayerRepository();
const playerService = new PlayerService(playerRepository);

export const batchCreatePlayers = async (req: Request, res: Response) => {
  try {
    const parsed = batchPlayersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? 'Invalid players payload' });
    }
    const { players } = parsed.data;

    const createdPlayers: unknown[] = [];
    const errors: { player: unknown; error: string }[] = [];

    for (const playerData of players) {
      try {
        const resolvedPosition = resolvePlayerPosition(playerData.position, {
          isGoalkeeper: playerData.isGoalkeeper,
        });
        const shouldMarkGoalkeeper = isGoalkeeperPosition(resolvedPosition);
        const player = await playerService.create({
          name: playerData.name,
          number: playerData.number,
          handedness: playerData.handedness || 'RIGHT', // Default to RIGHT if not provided by AI
          isGoalkeeper: shouldMarkGoalkeeper,
        });
        createdPlayers.push(player);
      } catch (error) {
        errors.push({
          player: playerData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      created: createdPlayers.length,
      errors: errors.length,
      players: createdPlayers,
      failedPlayers: errors,
    });
  } catch (error) {
    console.error('Error in batch create players:', error);
    res.status(500).json({
      error: 'Failed to create players',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const batchCreateWithTeam = async (req: Request, res: Response) => {
  try {
    const parsed = batchPlayersWithTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? 'Invalid team batch payload' });
    }
    const { players, teamId } = parsed.data;

    const createdPlayers: unknown[] = [];
    const errors: { player: unknown; error: string }[] = [];

    for (const playerData of players) {
      let createdPlayer: { id: string } | null = null;
      try {
        const resolvedPosition = resolvePlayerPosition(playerData.position, {
          isGoalkeeper: playerData.isGoalkeeper,
        });
        const shouldMarkGoalkeeper = isGoalkeeperPosition(resolvedPosition);
        // Create player with validation
        const player = await playerService.create({
          name: playerData.name,
          number: playerData.number,
          handedness: playerData.handedness || 'RIGHT', // Default to RIGHT if not provided by AI
          isGoalkeeper: shouldMarkGoalkeeper,
        });
        createdPlayer = player as { id: string };

        // Associate player with team
        await prisma.playerTeamSeason.create({
          data: {
            playerId: player.id,
            teamId,
            position: resolvedPosition,
          },
        });

        createdPlayers.push(player);
      } catch (error) {
        if (createdPlayer) {
          try {
            await prisma.player.delete({ where: { id: createdPlayer.id } });
          } catch (cleanupError) {
            console.error('Failed to rollback player creation:', cleanupError);
          }
        }
        errors.push({
          player: playerData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      created: createdPlayers.length,
      errors: errors.length,
      players: createdPlayers,
      failedPlayers: errors,
    });
  } catch (error) {
    console.error('Error in batch create with team:', error);
    res.status(500).json({
      error: 'Failed to create players with team',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
