import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Starting cleanup of ScoreClubs...');

  try {
    // 1. Find all clubs starting with "ScoreClub"
    const clubs = await prisma.club.findMany({
      where: {
        name: {
          startsWith: 'ScoreClub',
        },
      },
      include: {
        teams: true,
      },
    });

    console.log(`Found ${clubs.length} clubs to delete.`);

    for (const club of clubs) {
      console.log(`Processing club: ${club.name} (${club.id})`);

      // 2. Process each team in the club
      for (const team of club.teams) {
        console.log(`  Processing team: ${team.name} (${team.id})`);

        // 3. Find matches involving this team (Home or Away)
        const matches = await prisma.match.findMany({
          where: {
            OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
          },
        });

        console.log(`    Found ${matches.length} matches to delete for team.`);

        for (const match of matches) {
          // Check if match still exists (might have been deleted if played against another ScoreTeam already processed)
          const exists = await prisma.match.findUnique({ where: { id: match.id } });
          if (!exists) continue;

          // 4. Delete all events for the match
          await prisma.gameEvent.deleteMany({
            where: {
              matchId: match.id,
            },
          });

          // 5. Delete the match
          await prisma.match.delete({
            where: {
              id: match.id,
            },
          });
          console.log(`      Deleted match: ${match.id}`);
        }

        // 6. Delete the team (PlayerTeamSeason cascades automatically)
        await prisma.team.delete({
          where: {
            id: team.id,
          },
        });
        console.log(`    Deleted team: ${team.id}`);
      }

      // 7. Delete the club
      await prisma.club.delete({
        where: {
          id: club.id,
        },
      });
      console.log(`  Deleted club: ${club.id}`);
    }

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
