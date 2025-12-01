import { describe, it, expect } from 'vitest';
import { transformBackendEvent, transformBackendEvents } from '../eventTransformers';

describe('eventTransformers', () => {
    it('transformBackendEvent includes activeGoalkeeperId', () => {
        const backendEvent = {
            id: '1',
            timestamp: 1000,
            playerId: 'player1',
            teamId: 'team1',
            type: 'Shot',
            subtype: 'Goal',
            activeGoalkeeperId: 'gk1'
        };

        const result = transformBackendEvent(backendEvent);

        expect(result.id).toBe('1');
        expect(result.activeGoalkeeperId).toBe('gk1');
        expect(result.category).toBe('Shot');
        expect(result.action).toBe('Goal');
    });

    it('transformBackendEvent handles missing activeGoalkeeperId', () => {
        const backendEvent = {
            id: '2',
            timestamp: 2000,
            playerId: 'player1',
            teamId: 'team1',
            type: 'Turnover',
            subtype: 'Pass'
        };

        const result = transformBackendEvent(backendEvent);

        expect(result.id).toBe('2');
        expect(result.activeGoalkeeperId).toBeUndefined();
    });

    it('transformBackendEvents transforms array correctly', () => {
        const backendEvents = [
            { id: '1', type: 'Shot', activeGoalkeeperId: 'gk1' },
            { id: '2', type: 'Shot', activeGoalkeeperId: 'gk2' }
        ];

        const result = transformBackendEvents(backendEvents);

        expect(result).toHaveLength(2);
        expect(result[0].activeGoalkeeperId).toBe('gk1');
        expect(result[1].activeGoalkeeperId).toBe('gk2');
    });
});
