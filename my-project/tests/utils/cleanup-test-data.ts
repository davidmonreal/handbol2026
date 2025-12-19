import 'dotenv/config';
import { Prisma } from '@prisma/client';
import prisma from '../../src/lib/prisma';

const basePatterns = {
  club: [
    'Test',
    'Club-',
    'Integration',
    'Timer',
    'Match',
    'FL Club',
    'Pcrud',
    'CRUD',
    'Score',
    'Zone',
    'MatchEventFlow',
    'VideoEventFlow',
    'Cascade',
  ],
  team: [
    'Home-',
    'Away-',
    'Team-',
    'Integration',
    'Test',
    'Timer',
    'MatchHomeTeam',
    'MatchAwayTeam',
    'FL Home',
    'FL Away',
    'Pcrud',
    'CRUD',
    'Score',
    'Zone',
    'MatchEventFlow',
    'VideoEventFlow',
    'Cascade',
  ],
  season: [
    'Season-',
    'Integration',
    'Test',
    'Timer',
    'MatchSeason',
    'FL Season',
    'Pcrud',
    'CRUD',
    'Score',
    'Zone',
    'MatchEventFlow',
    'VideoEventFlow',
    'Cascade',
  ],
  player: [
    'Test',
    'Integration',
    'Player-',
    'FL Player',
    'Pcrud',
    'CRUD',
    'MatchEventFlow',
    'VideoEventFlow',
    'Cascade',
  ],
};

const scorePatterns = {
  club: ['ScoreClub'],
  team: ['ScoreHome', 'ScoreAway'],
  season: ['ScoreSeason'],
} as const;

type CleanupOptions = {
  includeScorePatterns?: boolean;
};

const buildStartsWith = (values: string[]) =>
  values.map((value) => ({ name: { startsWith: value, mode: 'insensitive' as const } }));

export async function cleanupTestData(options: CleanupOptions = {}) {
  const { includeScorePatterns = false } = options;

  const clubPatterns = includeScorePatterns
    ? [...basePatterns.club, ...scorePatterns.club]
    : basePatterns.club;
  const teamPatterns = includeScorePatterns
    ? [...basePatterns.team, ...scorePatterns.team]
    : basePatterns.team;
  const seasonPatterns = includeScorePatterns
    ? [...basePatterns.season, ...scorePatterns.season]
    : basePatterns.season;

  // Collect clubs and seasons created by tests (prefix-based)
  const clubsToDelete = await prisma.club.findMany({
    where: { OR: buildStartsWith(clubPatterns) },
    select: { id: true },
  });
  const clubIds = clubsToDelete.map((c) => c.id);

  const seasonsToDelete = await prisma.season.findMany({
    where: {
      OR: [
        ...buildStartsWith(seasonPatterns),
        { name: { contains: 'test', mode: 'insensitive' as const } },
        { name: { contains: 'integration', mode: 'insensitive' as const } },
      ],
    },
    select: { id: true },
  });
  const seasonIds = seasonsToDelete.map((s) => s.id);

  // Collect teams tied to those clubs/seasons or named with known test prefixes
  const teamsToDelete = await prisma.team.findMany({
    where: {
      OR: [
        ...buildStartsWith(teamPatterns),
        clubIds.length ? { clubId: { in: clubIds } } : undefined,
        seasonIds.length ? { seasonId: { in: seasonIds } } : undefined,
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
    select: { id: true },
  });
  const teamIds = teamsToDelete.map((t) => t.id);

  // Collect players created by tests
  const playersToDelete = await prisma.player.findMany({
    where: {
      OR: buildStartsWith(basePatterns.player),
    },
    select: { id: true },
  });
  const playerIds = playersToDelete.map((p) => p.id);

  // Collect matches tied to temp teams
  const matchConditions =
    teamIds.length > 0 ? [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] : [];

  const matchesToDelete = matchConditions.length
    ? await prisma.match.findMany({
        where: {
          OR: matchConditions,
        },
        select: { id: true },
      })
    : [];
  const matchIds = matchesToDelete.map((m) => m.id);

  const logCounts = () => {
    console.log(
      `Deleting clubs:${clubIds.length} teams:${teamIds.length} players:${playerIds.length} matches:${matchIds.length} seasons:${seasonIds.length}`,
    );
  };

  logCounts();

  // Delete in dependency-safe order
  const gameEventConditions: Array<Record<string, unknown>> = [];
  if (matchIds.length) gameEventConditions.push({ matchId: { in: matchIds } });
  if (teamIds.length) gameEventConditions.push({ teamId: { in: teamIds } });
  if (playerIds.length) gameEventConditions.push({ playerId: { in: playerIds } });
  if (gameEventConditions.length) {
    await prisma.gameEvent.deleteMany({
      where: { OR: gameEventConditions },
    });
  }

  const playerTeamSeasonConditions: Array<Record<string, unknown>> = [];
  if (teamIds.length) playerTeamSeasonConditions.push({ teamId: { in: teamIds } });
  if (playerIds.length) playerTeamSeasonConditions.push({ playerId: { in: playerIds } });
  if (playerTeamSeasonConditions.length) {
    await prisma.playerTeamSeason.deleteMany({
      where: { OR: playerTeamSeasonConditions },
    });
  }

  const deleteMatchesSafely = async () => {
    if (!matchIds.length) return;

    const attemptDelete = async () => {
      await prisma.gameEvent.deleteMany({ where: { matchId: { in: matchIds } } });
      await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
    };

    try {
      await attemptDelete();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        // Another test may have inserted events between deletions; re-run once after clearing again.
        await attemptDelete();
      } else {
        throw error;
      }
    }
  };

  await deleteMatchesSafely();

  if (teamIds.length) {
    await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
  }

  if (playerIds.length) {
    await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
  }

  if (clubIds.length) {
    await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  }

  if (seasonIds.length) {
    await prisma.season.deleteMany({ where: { id: { in: seasonIds } } });
  }

  console.log('✅ Cleanup completed');
}

// Allow running standalone via tsx
if (require.main === module) {
  cleanupTestData().catch((err) => {
    console.error('❌ Cleanup failed', err);
    process.exit(1);
  });
}
