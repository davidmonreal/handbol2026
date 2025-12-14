import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlayer() {
  const player = await prisma.player.findFirst({
    where: {
      name: {
        contains: 'Aniol Gomez',
        mode: 'insensitive',
      },
    },
  });

  if (player) {
    console.log(`Player: ${player.name}`);
    console.log(`Is Goalkeeper (DB): ${player.isGoalkeeper}`);
    console.log(`ID: ${player.id}`);
  } else {
    console.log('Player Adrian Vila not found.');
  }
}

checkPlayer()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
