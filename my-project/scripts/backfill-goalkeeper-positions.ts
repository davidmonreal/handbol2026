import { PrismaClient } from '@prisma/client';
import { PLAYER_POSITION } from '../src/types/player-position';

const prisma = new PrismaClient();

async function backfillGoalkeeperPositions() {
  const marked = await prisma.player.updateMany({
    where: {
      teams: {
        some: { position: PLAYER_POSITION.GOALKEEPER },
      },
    },
    data: { isGoalkeeper: true },
  });

  const unmarked = await prisma.player.updateMany({
    where: {
      teams: {
        none: { position: PLAYER_POSITION.GOALKEEPER },
      },
    },
    data: { isGoalkeeper: false },
  });

  console.log(
    `Updated goalkeeper flags from positions (true: ${marked.count}, false: ${unmarked.count}).`,
  );
}

backfillGoalkeeperPositions()
  .catch((error) => {
    console.error('Failed to backfill goalkeeper positions:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
