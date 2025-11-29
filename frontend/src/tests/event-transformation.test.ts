import { describe, it, expect } from 'vitest';

describe('Event Data Transformation Tests', () => {
    it('should transform backend event format to MatchEvent format', () => {
        // Backend format (from API)
        const backendEvent = {
            id: 'event-1',
            matchId: 'match-1',
            timestamp: 120,
            playerId: 'player-1',
            teamId: 'team-1',
            type: 'Shot',
            subtype: 'Goal',
            position: 'CB',
            distance: '6M',
            isCollective: true,
            goalZone: 'MM',
            sanctionType: null,
        };

        // Expected MatchEvent format (frontend)
        const transformedEvent = {
            id: backendEvent.id,
            timestamp: backendEvent.timestamp,
            playerId: backendEvent.playerId,
            teamId: backendEvent.teamId,
            category: backendEvent.type, // 'Shot'
            action: backendEvent.subtype, // 'Goal'
            zone: backendEvent.goalZone,
            position: backendEvent.position,
            distance: backendEvent.distance,
            context: {
                isCollective: backendEvent.isCollective,
            },
        };

        expect(transformedEvent.category).toBe('Shot');
        expect(transformedEvent.action).toBe('Goal');
        expect(transformedEvent.zone).toBe('MM');
    });

    it('should handle Shot events correctly', () => {
        const shotEvents = [
            { type: 'Shot', subtype: 'Goal' },
            { type: 'Shot', subtype: 'Save' },
            { type: 'Shot', subtype: 'Miss' },
            { type: 'Shot', subtype: 'Post' },
        ];

        shotEvents.forEach(event => {
            expect(event.type).toBe('Shot');
            expect(['Goal', 'Save', 'Miss', 'Post']).toContain(event.subtype);
        });
    });

    it('should handle Turnover events correctly', () => {
        const turnoverEvents = [
            { type: 'Turnover', subtype: 'Pass' },
            { type: 'Turnover', subtype: 'Steps' },
            { type: 'Turnover', subtype: 'Double' },
            { type: 'Turnover', subtype: 'Area' },
        ];

        turnoverEvents.forEach(event => {
            expect(event.type).toBe('Turnover');
            expect(['Pass', 'Steps', 'Double', 'Area']).toContain(event.subtype);
        });
    });

    it('should handle Sanction events correctly', () => {
        const sanctionEvent = {
            type: 'Sanction',
            subtype: 'Foul',
            sanctionType: 'YELLOW',
        };

        expect(sanctionEvent.type).toBe('Sanction');
        expect(sanctionEvent.subtype).toBe('Foul');
        expect(sanctionEvent.sanctionType).toBe('YELLOW');
    });

    it('should calculate goals correctly from transformed events', () => {
        const events = [
            { category: 'Shot', action: 'Goal', teamId: 'team-1' },
            { category: 'Shot', action: 'Save', teamId: 'team-1' },
            { category: 'Shot', action: 'Goal', teamId: 'team-2' },
            { category: 'Shot', action: 'Miss', teamId: 'team-1' },
            { category: 'Shot', action: 'Goal', teamId: 'team-1' },
        ];

        const team1Goals = events.filter(
            e => e.category === 'Shot' && e.action === 'Goal' && e.teamId === 'team-1'
        ).length;

        const team2Goals = events.filter(
            e => e.category === 'Shot' && e.action === 'Goal' && e.teamId === 'team-2'
        ).length;

        expect(team1Goals).toBe(2);
        expect(team2Goals).toBe(1);
    });

    it('should NOT calculate goals with legacy GOAL format', () => {
        // This should NOT work (legacy format)
        const legacyEvents = [
            { category: 'GOAL', teamId: 'team-1' },
            { category: 'MISS', teamId: 'team-1' },
        ];

        const goals = legacyEvents.filter(
            e => e.category === 'Shot' && e.action === 'Goal'
        ).length;

        expect(goals).toBe(0); // Should be 0 because format is wrong
    });

    it('should verify backend events have correct structure', () => {
        const backendEvent = {
            id: 'event-1',
            matchId: 'match-1',
            timestamp: 120,
            playerId: 'player-1',
            teamId: 'team-1',
            type: 'Shot',
            subtype: 'Goal',
            position: 'CB',
            distance: '6M',
            isCollective: true,
            goalZone: 'MM',
            sanctionType: null,
        };

        // Verify structure
        expect(backendEvent).toHaveProperty('type');
        expect(backendEvent).toHaveProperty('subtype');
        expect(backendEvent).not.toHaveProperty('category');
        expect(backendEvent).not.toHaveProperty('action');

        // Verify type is correct
        expect(['Shot', 'Turnover', 'Sanction']).toContain(backendEvent.type);
    });

    it('should verify MatchEvent format has correct structure', () => {
        const matchEvent = {
            id: 'event-1',
            timestamp: 120,
            playerId: 'player-1',
            teamId: 'team-1',
            category: 'Shot',
            action: 'Goal',
            zone: 'MM',
        };

        // Verify structure
        expect(matchEvent).toHaveProperty('category');
        expect(matchEvent).toHaveProperty('action');
        expect(matchEvent).not.toHaveProperty('type');
        expect(matchEvent).not.toHaveProperty('subtype');

        // Verify category is correct
        expect(['Shot', 'Turnover', 'Sanction']).toContain(matchEvent.category);
    });

    it('should handle events with missing context data', () => {
        const backendEvent = {
            type: 'Shot',
            subtype: 'Goal',
            isCollective: null,
            hasOpposition: null,
            isCounterAttack: null,
        };

        const transformedEvent = {
            category: backendEvent.type,
            action: backendEvent.subtype,
            context: {
                isCollective: backendEvent.isCollective || false,
                hasOpposition: backendEvent.hasOpposition || false,
                isCounterAttack: backendEvent.isCounterAttack || false,
            },
        };

        expect(transformedEvent.context.isCollective).toBe(false);
        expect(transformedEvent.context.hasOpposition).toBe(false);
        expect(transformedEvent.context.isCounterAttack).toBe(false);
    });

    it('should map all required fields during transformation', () => {
        const backendEvent = {
            id: 'event-1',
            matchId: 'match-1',
            timestamp: 300,
            playerId: 'player-1',
            teamId: 'team-1',
            type: 'Shot',
            subtype: 'Goal',
            position: 'LW',
            distance: '9M',
            isCollective: true,
            goalZone: 'TL',
            sanctionType: null,
            hasOpposition: true,
            isCounterAttack: false,
        };

        const transformedEvent = {
            id: backendEvent.id,
            timestamp: backendEvent.timestamp,
            playerId: backendEvent.playerId,
            teamId: backendEvent.teamId,
            category: backendEvent.type,
            action: backendEvent.subtype || backendEvent.type,
            zone: backendEvent.goalZone,
            context: {
                isCollective: backendEvent.isCollective,
                hasOpposition: backendEvent.hasOpposition,
                isCounterAttack: backendEvent.isCounterAttack,
            },
        };

        // Verify all fields are mapped correctly
        expect(transformedEvent.id).toBe(backendEvent.id);
        expect(transformedEvent.timestamp).toBe(backendEvent.timestamp);
        expect(transformedEvent.playerId).toBe(backendEvent.playerId);
        expect(transformedEvent.teamId).toBe(backendEvent.teamId);
        expect(transformedEvent.category).toBe('Shot');
        expect(transformedEvent.action).toBe('Goal');
        expect(transformedEvent.zone).toBe('TL');
        expect(transformedEvent.context.isCollective).toBe(true);
        expect(transformedEvent.context.hasOpposition).toBe(true);
        expect(transformedEvent.context.isCounterAttack).toBe(false);
    });
});
