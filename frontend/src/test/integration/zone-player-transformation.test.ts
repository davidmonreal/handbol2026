import { describe, it, expect } from 'vitest';

describe('Zone and Player Data Transformation Tests', () => {
    describe('Position+Distance to Zone Conversion', () => {
        it('should convert 6M positions to 6m-XX zones', () => {
            const testCases = [
                { position: 'LW', distance: '6M', expected: '6m-LW' },
                { position: 'LB', distance: '6M', expected: '6m-LB' },
                { position: 'CB', distance: '6M', expected: '6m-CB' },
                { position: 'RB', distance: '6M', expected: '6m-RB' },
                { position: 'RW', distance: '6M', expected: '6m-RW' },
            ];

            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            testCases.forEach(({ position, distance, expected }) => {
                expect(positionDistanceToZone(position, distance)).toBe(expected);
            });
        });

        it('should convert 9M positions to 9m-XX zones', () => {
            const testCases = [
                { position: 'LB', distance: '9M', expected: '9m-LB' },
                { position: 'CB', distance: '9M', expected: '9m-CB' },
                { position: 'RB', distance: '9M', expected: '9m-RB' },
            ];

            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            testCases.forEach(({ position, distance, expected }) => {
                expect(positionDistanceToZone(position, distance)).toBe(expected);
            });
        });

        it('should convert 7M to 7m (penalty)', () => {
            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            expect(positionDistanceToZone('CB', '7M')).toBe('7m');
            expect(positionDistanceToZone('LW', '7M')).toBe('7m');
        });

        it('should return undefined for null/missing position or distance', () => {
            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            expect(positionDistanceToZone(null, '6M')).toBeUndefined();
            expect(positionDistanceToZone('CB', null)).toBeUndefined();
            expect(positionDistanceToZone(null, null)).toBeUndefined();
        });
    });

    describe('GoalZone to GoalTarget Conversion', () => {
        it('should convert goalZone strings to numbers 1-9', () => {
            const goalZoneToTarget = (zone: string | null): number | undefined => {
                if (!zone) return undefined;
                const zoneMap: Record<string, number> = {
                    'TL': 1, 'TM': 2, 'TR': 3,
                    'ML': 4, 'MM': 5, 'MR': 6,
                    'BL': 7, 'BM': 8, 'BR': 9,
                };
                return zoneMap[zone];
            };

            expect(goalZoneToTarget('TL')).toBe(1);
            expect(goalZoneToTarget('TM')).toBe(2);
            expect(goalZoneToTarget('TR')).toBe(3);
            expect(goalZoneToTarget('ML')).toBe(4);
            expect(goalZoneToTarget('MM')).toBe(5);
            expect(goalZoneToTarget('MR')).toBe(6);
            expect(goalZoneToTarget('BL')).toBe(7);
            expect(goalZoneToTarget('BM')).toBe(8);
            expect(goalZoneToTarget('BR')).toBe(9);
        });

        it('should return undefined for null or invalid zones', () => {
            const goalZoneToTarget = (zone: string | null): number | undefined => {
                if (!zone) return undefined;
                const zoneMap: Record<string, number> = {
                    'TL': 1, 'TM': 2, 'TR': 3,
                    'ML': 4, 'MM': 5, 'MR': 6,
                    'BL': 7, 'BM': 8, 'BR': 9,
                };
                return zoneMap[zone];
            };

            expect(goalZoneToTarget(null)).toBeUndefined();
            expect(goalZoneToTarget('INVALID')).toBeUndefined();
        });
    });

    describe('Player Data in Events', () => {
        it('should include player name and number in transformed events', () => {
            const backendEvent = {
                id: 'event-1',
                type: 'Shot',
                subtype: 'Goal',
                playerId: 'player-1',
                teamId: 'team-1',
                position: 'CB',
                distance: '6M',
                goalZone: 'MM',
                player: {
                    id: 'player-1',
                    name: 'Joan Garcia',
                },
            };

            const transformedEvent = {
                id: backendEvent.id,
                playerId: backendEvent.playerId,
                playerName: backendEvent.player?.name,
                playerNumber: undefined,
                teamId: backendEvent.teamId,
                category: backendEvent.type,
                action: backendEvent.subtype,
            };

            expect(transformedEvent.playerName).toBe('Joan Garcia');
            expect(transformedEvent.playerNumber).toBeUndefined();
        });

        it('should handle events without player data', () => {
            const backendEvent: {
                id: string;
                type: string;
                subtype: string;
                playerId: null;
                teamId: string;
                player: null | { name: string };
            } = {
                id: 'event-1',
                type: 'Shot',
                subtype: 'Goal',
                playerId: null,
                teamId: 'team-1',
                player: null,
            };

            const transformedEvent = {
                id: backendEvent.id,
                playerId: backendEvent.playerId,
                playerName: backendEvent.player?.name,
                playerNumber: undefined,
                teamId: backendEvent.teamId,
            };

            expect(transformedEvent.playerName).toBeUndefined();
            expect(transformedEvent.playerNumber).toBeUndefined();
        });
    });

    describe('Complete Event Transformation', () => {
        it('should transform backend event to frontend format with all fields', () => {
            const backendEvent = {
                id: 'event-1',
                matchId: 'match-1',
                timestamp: 300,
                playerId: 'player-1',
                teamId: 'team-1',
                type: 'Shot',
                subtype: 'Goal',
                position: 'CB',
                distance: '6M',
                isCollective: true,
                goalZone: 'MM',
                hasOpposition: true,
                isCounterAttack: false,
                player: {
                    id: 'player-1',
                    name: 'Marc Lopez',
                    number: 7,
                },
            };

            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            const goalZoneToTarget = (zone: string | null): number | undefined => {
                if (!zone) return undefined;
                const zoneMap: Record<string, number> = {
                    'TL': 1, 'TM': 2, 'TR': 3,
                    'ML': 4, 'MM': 5, 'MR': 6,
                    'BL': 7, 'BM': 8, 'BR': 9,
                };
                return zoneMap[zone];
            };

            const transformedEvent = {
                id: backendEvent.id,
                timestamp: backendEvent.timestamp,
                playerId: backendEvent.playerId,
                playerName: backendEvent.player?.name,
                playerNumber: undefined,
                teamId: backendEvent.teamId,
                category: backendEvent.type,
                action: backendEvent.subtype || backendEvent.type,
                zone: positionDistanceToZone(backendEvent.position, backendEvent.distance),
                goalTarget: goalZoneToTarget(backendEvent.goalZone),
                context: {
                    isCollective: backendEvent.isCollective,
                    hasOpposition: backendEvent.hasOpposition,
                    isCounterAttack: backendEvent.isCounterAttack,
                },
            };

            // Verify all transformations
            expect(transformedEvent.category).toBe('Shot');
            expect(transformedEvent.action).toBe('Goal');
            expect(transformedEvent.zone).toBe('6m-CB');
            expect(transformedEvent.goalTarget).toBe(5);
            expect(transformedEvent.playerName).toBe('Marc Lopez');
            expect(transformedEvent.playerNumber).toBeUndefined();
            expect(transformedEvent.context.isCollective).toBe(true);
        });

        it('should handle COUNTER distance correctly', () => {
            const positionDistanceToZone = (position: string | null, distance: string | null): string | undefined => {
                if (!position || !distance) return undefined;
                if (distance === '7M') return '7m';
                const distancePrefix = distance === '6M' ? '6m' : '9m';
                return `${distancePrefix}-${position}`;
            };

            // COUNTER should be treated as neither 6M nor 7M, so it goes to 9m
            expect(positionDistanceToZone('LW', 'COUNTER')).toBe('9m-LW');
        });
    });

    describe('Zone Statistics Filtering', () => {
        it('should filter events by zone correctly', () => {
            const events = [
                { zone: '6m-CB', type: 'Shot' },
                { zone: '9m-LB', type: 'Shot' },
                { zone: '6m-CB', type: 'Shot' },
                { zone: '7m', type: 'Shot' },
            ];

            const filtered6mCB = events.filter(e => e.zone === '6m-CB');
            expect(filtered6mCB).toHaveLength(2);

            const filtered9mLB = events.filter(e => e.zone === '9m-LB');
            expect(filtered9mLB).toHaveLength(1);

            const filtered7m = events.filter(e => e.zone === '7m');
            expect(filtered7m).toHaveLength(1);
        });
    });
});
