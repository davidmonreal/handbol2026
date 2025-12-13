import 'dotenv/config';
import prisma from '../src/lib/prisma';

/**
 * Reflow timestamps for all events of a match, distributing them uniformly
 * between 0s and 3600s (60 minutes).
 *
 * Usage:
 *   npx tsx scripts/reflow-match-timestamps.ts <matchId>
 *
 * Safety:
 * - Reads events ordered by timestamp then id (stable).
 * - Writes back new timestamps; no other fields are changed.
 */
async function main() {
  const matchId = process.argv[2];
  if (!matchId) {
    console.error('Usage: npx tsx scripts/reflow-match-timestamps.ts <matchId>');
    process.exit(1);
  }

  const events = await prisma.gameEvent.findMany({
    where: { matchId },
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    select: { id: true, timestamp: true },
  });

  if (events.length === 0) {
    console.log(`No events found for match ${matchId}`);
    return;
  }

  const totalDuration = 60 * 60; // 3600 seconds
  const step = events.length > 1 ? totalDuration / (events.length - 1) : 0;

  const updates = events.map((event, index) => ({
    id: event.id,
    timestamp: Math.round(index * step),
  }));

  for (const u of updates) {
    await prisma.gameEvent.update({
      where: { id: u.id },
      data: { timestamp: u.timestamp },
    });
  }

  console.log(`Updated ${updates.length} events for match ${matchId}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
