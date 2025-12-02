import { Request, Response } from 'express';
import { PlayerService } from '../services/player-service';
import { PlayerRepository } from '../repositories/player-repository';
import prisma from '../lib/prisma';

const playerRepository = new PlayerRepository();
const playerService = new PlayerService(playerRepository);

export async function batchCreatePlayers(req: Request, res: Response) {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Players array is required' });
    }

    const createdPlayers = [];
    const errors = [];

    for (const playerData of players) {
      try {
        const player = await playerService.create({
          name: playerData.name,
          number: playerData.number,
          handedness: playerData.handedness,
          isGoalkeeper: playerData.isGoalkeeper || false,
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
}

export async function batchCreateWithTeam(req: Request, res: Response) {
  try {
    const { players, teamId } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Players array is required' });
    }

    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }

    const createdPlayers = [];
    const errors = [];

    for (const playerData of players) {
      try {
        // Create player with validation
        const player = await playerService.create({
          name: playerData.name,
          number: playerData.number,
          handedness: playerData.handedness,
          isGoalkeeper: playerData.isGoalkeeper || false,
        });

        // Associate player with team
        await prisma.playerTeamSeason.create({
          data: {
            playerId: player.id,
            teamId,
            role: 'Player',
          },
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
    console.error('Error in batch create with team:', error);
    res.status(500).json({
      error: 'Failed to create players with team',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
