import { PrismaClient } from '@prisma/client';
import { PLAYER_POSITION } from '../src/types/player-position';

const prisma = new PrismaClient();

async function backfillGoalkeeperPositions() {
  const updated = await prisma.playerTeamSeason.updateMany({
    where: {
      player: { isGoalkeeper: true },
      position: { not: PLAYER_POSITION.GOALKEEPER },
    },
    data: { position: PLAYER_POSITION.GOALKEEPER },
  });

  console.log(`Updated ${updated.count} player-team assignments to goalkeeper position.`);
}

backfillGoalkeeperPositions()
  .catch((error) => {
    console.error('Failed to backfill goalkeeper positions:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
