import { Request, Response } from 'express';
import { PlayerRepository } from '../repositories/player-repository';
import prisma from '../lib/prisma';
import { PLAYER_POSITION } from '../types/player-position';

const playerRepository = new PlayerRepository();

interface MergePlayerRequest {
  oldPlayerId: string;
  newPlayerData: {
    name: string;
    number: number;
    handedness?: string;
    isGoalkeeper?: boolean;
  };
  teamId?: string;
}

export async function mergePlayer(req: Request, res: Response) {
  try {
    const { oldPlayerId, newPlayerData, teamId }: MergePlayerRequest = req.body;

    if (!oldPlayerId || !newPlayerData) {
      return res.status(400).json({ error: 'oldPlayerId and newPlayerData are required' });
    }

    // Fetch old player to verify it exists
    const oldPlayer = await playerRepository.findById(oldPlayerId);
    if (!oldPlayer) {
      return res.status(404).json({ error: 'Old player not found' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create new player
      const newPlayer = await tx.player.create({
        data: {
          name: newPlayerData.name,
          number: newPlayerData.number,
          handedness: newPlayerData.handedness as 'LEFT' | 'RIGHT',
          isGoalkeeper: newPlayerData.isGoalkeeper || false,
        },
      });

      // Transfer all game events from old player to new player
      await tx.gameEvent.updateMany({
        where: { playerId: oldPlayerId },
        data: { playerId: newPlayer.id },
      });

      // Transfer team associations
      const oldPlayerTeams = await tx.playerTeamSeason.findMany({
        where: { playerId: oldPlayerId },
      });

      for (const pt of oldPlayerTeams) {
        await tx.playerTeamSeason.create({
          data: {
            playerId: newPlayer.id,
            teamId: pt.teamId,
            position: pt.position ?? PLAYER_POSITION.UNSET,
          },
        });
      }

      // If teamId is provided and player doesn't already have this team, add it
      if (teamId) {
        const existingAssociation = await tx.playerTeamSeason.findFirst({
          where: {
            playerId: newPlayer.id,
            teamId,
          },
        });

        if (!existingAssociation) {
          await tx.playerTeamSeason.create({
            data: {
              playerId: newPlayer.id,
              teamId,
              position: newPlayerData.isGoalkeeper
                ? PLAYER_POSITION.GOALKEEPER
                : PLAYER_POSITION.UNSET,
            },
          });
        }
      }

      // Delete old player team associations
      await tx.playerTeamSeason.deleteMany({
        where: { playerId: oldPlayerId },
      });

      // Delete old player
      await tx.player.delete({
        where: { id: oldPlayerId },
      });

      return newPlayer;
    });

    // Fetch complete player data to return
    const completePlayer = await playerRepository.findById(result.id);

    res.json({
      success: true,
      player: completePlayer,
      message: `Successfully merged player. Statistics and team associations transferred.`,
    });
  } catch (error) {
    console.error('Error merging player:', error);
    res.status(500).json({
      error: 'Failed to merge player',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
