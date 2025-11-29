import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent game events...');

    const events = await prisma.gameEvent.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }, // or createdAt if available, but timestamp is what we have
        include: {
            player: true,
        }
    });

    console.log(`Found ${events.length} events.`);

    events.forEach(e => {
        console.log(`Event ID: ${e.id}`);
        console.log(`  Type: ${e.type}, Subtype: ${e.subtype}`);
        console.log(`  Zone (goalZone): ${e.goalZone}`);
        console.log(`  Position: ${e.position}, Distance: ${e.distance}`);
        console.log('---');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
