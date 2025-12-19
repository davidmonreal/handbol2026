import { describe, it, expect } from 'vitest';
import { buildGoalFlowData, HALF_BOUNDARY_POSITION } from '../goalFlowData';
import type { MatchEvent } from '../../../types';

let idCounter = 0;
const buildEvent = (overrides: Partial<MatchEvent>): MatchEvent => ({
    id: overrides.id ?? `evt-${idCounter++}`,
    timestamp: 0,
    teamId: '',
    category: 'Shot',
    action: 'Goal',
    ...overrides,
});

describe('buildGoalFlowData', () => {
    const teamId = 'teamA';
    const opponentId = 'teamB';
    const halfSplit = 1500;

    const baseEvents: MatchEvent[] = [
        buildEvent({ timestamp: 10, teamId, category: 'Shot', action: 'Goal' }),
        buildEvent({ timestamp: 1000, teamId, category: 'Shot', action: 'Goal' }),
        buildEvent({ timestamp: 2000, teamId, category: 'Shot', action: 'Goal' }),
        buildEvent({ timestamp: 50, teamId: opponentId, category: 'Shot', action: 'Goal' }),
        buildEvent({ timestamp: 1700, teamId: opponentId, category: 'Shot', action: 'Goal' }),
        buildEvent({ timestamp: 100, teamId, category: 'Turnover', action: 'Pass' }),
        buildEvent({ timestamp: 150, teamId, category: 'Turnover', action: 'Pass' }),
        buildEvent({ timestamp: 500, teamId, category: 'Turnover', action: 'Steps' }),
        buildEvent({ timestamp: 1200, teamId, category: 'Sanction', action: 'Foul' }),
        buildEvent({ timestamp: 110, teamId, category: 'Shot', action: 'Save' }),
        buildEvent({ timestamp: 1600, teamId, category: 'Shot', action: 'Save' }),
    ];

    it('computes cumulative series across halves and max goals', () => {
        const data = buildGoalFlowData(baseEvents, teamId, opponentId, halfSplit);

        expect(data.teamSeries[data.teamSeries.length - 1]?.value).toBe(3);
        expect(data.opponentSeries[data.opponentSeries.length - 1]?.value).toBe(2);
        expect(data.maxGoals).toBe(3);

        const firstHalfPositions = data.teamSeries.filter(p => p.value > 0 && p.position < HALF_BOUNDARY_POSITION);
        const secondHalfPositions = data.teamSeries.filter(p => p.value > 0 && p.position > HALF_BOUNDARY_POSITION);
        expect(firstHalfPositions.length).toBeGreaterThan(0);
        expect(secondHalfPositions.length).toBeGreaterThan(0);
    });

    it('clusters turnovers inside the configured time window', () => {
        const data = buildGoalFlowData(baseEvents, teamId, opponentId, halfSplit);

        expect(data.turnoversByPosition).toHaveLength(2);
        expect(data.turnoversByPosition[0]?.count).toBe(2); // 100s + 150s merge
        expect(data.turnoversByPosition[1]?.count).toBe(1); // 500s stands alone
    });

    it('separates clusters across halves for saves and preserves ordering', () => {
        const data = buildGoalFlowData(baseEvents, teamId, opponentId, halfSplit);
        expect(data.savesByPosition).toHaveLength(2);
        const [firstSave, secondSave] = data.savesByPosition;
        expect(firstSave?.position).toBeLessThan(HALF_BOUNDARY_POSITION);
        expect(secondSave?.position).toBeGreaterThan(HALF_BOUNDARY_POSITION);
        expect(firstSave?.count).toBe(1);
        expect(secondSave?.count).toBe(1);
    });

    it('maps fouls to normalized positions using the same progression as goals', () => {
        const data = buildGoalFlowData(baseEvents, teamId, opponentId, halfSplit);
        expect(data.foulsByPosition).toHaveLength(1);
        expect(data.foulsByPosition[0]?.position).toBeLessThan(HALF_BOUNDARY_POSITION);
    });
});
