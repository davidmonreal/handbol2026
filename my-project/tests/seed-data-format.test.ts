import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Seed Data Format Validation', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should have game events with valid type values', async () => {
        const events = await prisma.gameEvent.findMany();

        const validTypes = ['Shot', 'Turnover', 'Sanction'];

        events.forEach(event => {
            expect(validTypes).toContain(event.type);
        });
    });

    it('should have Shot events with valid subtypes', async () => {
        const shotEvents = await prisma.gameEvent.findMany({
            where: { type: 'Shot' }
        });

        const validShotSubtypes = ['Goal', 'Save', 'Miss', 'Post', 'Block'];

        shotEvents.forEach(event => {
            if (event.subtype) {
                expect(validShotSubtypes).toContain(event.subtype);
            }
        });
    });

    it('should have Turnover events with valid subtypes', async () => {
        const turnoverEvents = await prisma.gameEvent.findMany({
            where: { type: 'Turnover' }
        });

        const validTurnoverSubtypes = ['Pass', 'Steps', 'Double', 'Area', 'Catch', 'Dribble', 'Offensive Foul'];

        turnoverEvents.forEach(event => {
            if (event.subtype) {
                expect(validTurnoverSubtypes).toContain(event.subtype);
            }
        });
    });

    it('should have Sanction events with valid sanctionType', async () => {
        const sanctionEvents = await prisma.gameEvent.findMany({
            where: { type: 'Sanction' }
        });

        const validSanctionTypes = ['YELLOW', '2MIN', 'RED', 'BLUE'];

        sanctionEvents.forEach(event => {
            if (event.sanctionType) {
                expect(validSanctionTypes).toContain(event.sanctionType);
            }
        });
    });

    it('should have Shot events with required fields', async () => {
        const shotEvents = await prisma.gameEvent.findMany({
            where: { type: 'Shot' }
        });

        shotEvents.forEach(event => {
            expect(event.position).toBeDefined();
            expect(event.distance).toBeDefined();
            expect(event.goalZone).toBeDefined();
            expect(event.subtype).toBeDefined();
        });
    });

    it('should not have legacy GOAL or MISS type events', async () => {
        const legacyEvents = await prisma.gameEvent.findMany({
            where: {
                type: {
                    in: ['GOAL', 'MISS']
                }
            }
        });

        expect(legacyEvents).toHaveLength(0);
    });

    it('should have consistent event format across all matches', async () => {
        const matches = await prisma.match.findMany({
            include: {
                events: true
            }
        });

        matches.forEach(match => {
            match.events.forEach(event => {
                // All events should have type, timestamp, teamId
                expect(event.type).toBeDefined();
                expect(event.timestamp).toBeDefined();
                expect(event.teamId).toBeDefined();

                // Type should be one of the valid values
                expect(['Shot', 'Turnover', 'Sanction']).toContain(event.type);
            });
        });
    });
});
