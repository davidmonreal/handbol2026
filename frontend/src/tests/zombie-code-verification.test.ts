import { describe, it, expect } from 'vitest';
import { toTitleCase } from '../utils/textUtils';
import { transformBackendEvents, transformBackendEvent } from '../utils/eventTransformers';
import { TEAM_CATEGORIES, parseTeamName } from '../utils/teamUtils';

/**
 * Zombie Code Verification Tests
 * 
 * These tests verify that utility files that were confirmed as USED
 * (and should NOT be deleted) are still functioning correctly.
 * 
 * Files that were DELETED (zombie code):
 * - src/data/mockData.ts - Was unused, now deleted
 * - src/components/match/DefenseFormationSelector.tsx - Was unused, now deleted
 * 
 * The deletion of zombie files is verified by the build passing.
 * If these files were still imported somewhere, the build would fail.
 */

describe('Zombie Code Verification - Used Utilities Still Work', () => {
    describe('textUtils', () => {
        it('toTitleCase should convert strings to title case', () => {
            expect(toTitleCase('hello world')).toBe('Hello World');
            expect(toTitleCase('UPPERCASE')).toBe('Uppercase');
            expect(toTitleCase('')).toBe('');
        });
    });

    describe('eventTransformers', () => {
        it('transformBackendEvent should transform a single event', () => {
            const backendEvent = {
                id: '1',
                timestamp: 1000,
                playerId: 'player1',
                teamId: 'team1',
                type: 'Shot',
                subtype: 'Goal',
            };

            const result = transformBackendEvent(backendEvent);

            expect(result.id).toBe('1');
            expect(result.category).toBe('Shot');
            expect(result.action).toBe('Goal');
        });

        it('transformBackendEvents should transform an array of events', () => {
            const events = [
                { id: '1', type: 'Shot' },
                { id: '2', type: 'Turnover' }
            ];

            const result = transformBackendEvents(events);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });
    });

    describe('teamUtils', () => {
        it('TEAM_CATEGORIES should contain expected categories', () => {
            expect(TEAM_CATEGORIES).toContain('SENIOR');
            expect(TEAM_CATEGORIES).toContain('JUVENIL');
            expect(TEAM_CATEGORIES).toContain('CADET');
        });

        it('parseTeamName should detect category from team name', () => {
            const result = parseTeamName('Juvenil A');
            expect(result.category).toBe('JUVENIL');
        });
    });
});
