import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (opcional, si vols començar de zero cada cop)
  await prisma.player.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.club.deleteMany({});

  // Create Clubs
  await prisma.club.create({
    data: { name: 'Mataró' },
  });

  await prisma.club.create({
    data: { name: 'FC Barcelona' },
  });

  await prisma.club.create({
    data: { name: 'BM Granollers' },
  });

  console.log('✅ Created 3 clubs');

  // Create Seasons
  await prisma.season.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
    },
  });

  await prisma.season.create({
    data: {
      name: '2023-2024',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
    },
  });

  console.log('✅ Created 2 seasons');

  // Create Players
  const players = [
    { name: 'Martí Monreal', number: 21, handedness: 'RIGHT' },
    { name: 'Guillem Cuartero', number: 31, handedness: 'LEFT' },
    { name: 'Pol Rossell', number: 30, handedness: 'RIGHT' },
    { name: 'Guim', number: 33, handedness: 'RIGHT' },
    { name: 'Marc Garcia', number: 7, handedness: 'RIGHT' },
    { name: 'Joan López', number: 10, handedness: 'LEFT' },
    { name: 'Albert Martínez', number: 15, handedness: 'RIGHT' },
    { name: 'Pau Rodríguez', number: 3, handedness: 'LEFT' },
    { name: 'David Sánchez', number: 12, handedness: 'RIGHT' },
    { name: 'Carlos Fernández', number: 9, handedness: 'RIGHT' },
    { name: 'Jordi Vila', number: 5, handedness: 'LEFT' },
    { name: 'Gerard Pons', number: 21, handedness: 'RIGHT' },
    { name: 'Àlex Soler', number: 8, handedness: 'LEFT' },
    { name: 'Sergi Roca', number: 14, handedness: 'RIGHT' },
  ];

  for (const playerData of players) {
    await prisma.player.create({ data: playerData });
  }

  console.log(`✅ Created ${players.length} players`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
