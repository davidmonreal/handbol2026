import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_MAP: Record<string, string> = {
  senior: 'Senior M',
  'senior m': 'Senior M',
  'senior f': 'Senior F',
  juvenil: 'Juvenil M',
  'juvenil m': 'Juvenil M',
  'juvenil f': 'Juvenil F',
  cadet: 'Cadet M',
  'cadet m': 'Cadet M',
  'cadet f': 'Cadet F',
  infantil: 'Infantil M',
  'infantil m': 'Infantil M',
  'infantil f': 'Infantil F',
  alevi: 'Aleví M',
  aleví: 'Aleví M',
  'alevi m': 'Aleví M',
  'aleví m': 'Aleví M',
  'alevi f': 'Aleví F',
  'aleví f': 'Aleví F',
};

const normalizeCategory = (value: string): string | null => {
  const key = value.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? null;
};

const run = async () => {
  const teams = await prisma.team.findMany({
    select: { id: true, category: true },
  });

  let updated = 0;
  for (const team of teams) {
    if (!team.category) continue;
    const normalized = normalizeCategory(team.category);
    if (!normalized || normalized === team.category) continue;
    await prisma.team.update({
      where: { id: team.id },
      data: { category: normalized },
    });
    updated += 1;
  }

  console.log(`Updated ${updated} team categories.`);
};

run()
  .catch((error) => {
    console.error('Category migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
