import prisma from '../src/lib/prisma';

async function run() {
  console.log('Starting backfill of GameEvent.zone...');

  // 1) Penalties: distance = '7M' -> zone = '7m'
  const res1 = await prisma.gameEvent.updateMany({
    where: { distance: '7M' },
    data: { zone: '7m' },
  });
  console.log(`Updated ${res1.count} penalty events to zone '7m'`);

  // 2) Events with both position and distance
  const events = await prisma.gameEvent.findMany({
    where: {
      AND: [{ position: { not: null } }, { distance: { not: null } }],
    },
    select: { id: true, position: true, distance: true },
  });

  console.log(`Found ${events.length} events with position+distance to backfill`);

  for (const e of events) {
    const prefix = e.distance === '6M' ? '6m' : '9m';
    const zone = `${prefix}-${e.position!.toUpperCase()}`;
    await prisma.gameEvent.update({ where: { id: e.id }, data: { zone } });
  }

  console.log('Backfill complete');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
