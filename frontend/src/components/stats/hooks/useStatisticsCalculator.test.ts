import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStatisticsCalculator } from './useStatisticsCalculator';
import type { MatchEvent } from '../../../../types';

describe('useStatisticsCalculator', () => {
    const mockEvents: MatchEvent[] = [
        {
            id: '1',
            timestamp: 1000,
            teamId: 'team1',
            category: 'Shot',
            action: 'Goal',
            zone: '6m-CB',
            goalTarget: 5,
            playerId: 'player1',
            activeGoalkeeperId: 'gk1'
        },
        {
            id: '2',
            timestamp: 2000,
            teamId: 'team1',
            category: 'Shot',
            action: 'Save',
            zone: '9m-LB',
            goalTarget: 1,
            playerId: 'player1',
            activeGoalkeeperId: 'gk1'
        },
        {
            id: '3',
            timestamp: 3000,
            teamId: 'team1',
            category: 'Shot',
            action: 'Miss',
            zone: '9m-RB',
            playerId: 'player1',
            activeGoalkeeperId: 'gk1'
        }
    ];

    it('calculates efficiency correctly for field players (Goals / Shots)', () => {
        const { result } = renderHook(() => useStatisticsCalculator(mockEvents, undefined, false));

        // Total shots: 3 (Goal, Save, Miss)
        // Total goals: 1
        // Efficiency: 1/3 = 33.33%
        expect(result.current.totalShots).toBe(3);
        expect(result.current.totalGoals).toBe(1);
        expect(result.current.efficiency).toBeCloseTo(33.33, 2);
    });

    it('calculates efficiency correctly for goalkeepers (Saves / (Saves + Goals))', () => {
        const { result } = renderHook(() => useStatisticsCalculator(mockEvents, undefined, true));

        // Total saves: 1
        // Total goals: 1
        // Shots on target (Saves + Goals): 2
        // Efficiency: 1/2 = 50%
        expect(result.current.totalSaves).toBe(1);
        expect(result.current.totalGoals).toBe(1);
        expect(result.current.efficiency).toBeCloseTo(50.00, 2);
    });

    it('calculates zone efficiency correctly for goalkeepers', () => {
        const { result } = renderHook(() => useStatisticsCalculator(mockEvents, undefined, true));

        // Zone 6m-CB: 1 Goal -> 0% efficiency (0 saves / 1 shot on target)
        const zone6mCB = result.current.zoneStats.get('6m-CB');
        expect(zone6mCB?.goals).toBe(1);
        expect(zone6mCB?.efficiency).toBe(0);

        // Zone 9m-LB: 1 Save -> 100% efficiency (1 save / 1 shot on target)
        const zone9mLB = result.current.zoneStats.get('9m-LB');
        // Note: In our implementation we reuse 'goals' field for saves in zone stats for GK? 
        // Let's check the implementation details. 
        // Actually, the implementation re-calculates efficiency but keeps standard fields.
        // For GK zone stats:
        // efficiency = (saves / shots_on_target) * 100
        expect(zone9mLB?.efficiency).toBe(100);
    });

    it('calculates goal target statistics correctly for goalkeepers', () => {
        const { result } = renderHook(() => useStatisticsCalculator(mockEvents, undefined, true));

        // Target 5 (Center): 1 Goal -> 0% efficiency
        const target5 = result.current.goalTargetStats.get(5);
        expect(target5?.goals).toBe(1);
        expect(target5?.saves).toBe(0);
        expect(target5?.efficiency).toBe(0);

        // Target 1 (Top Left): 1 Save -> 100% efficiency
        const target1 = result.current.goalTargetStats.get(1);
        expect(target1?.goals).toBe(0);
        expect(target1?.saves).toBe(1);
        expect(target1?.efficiency).toBe(100);
    });

    it('handles zero shots correctly', () => {
        const { result } = renderHook(() => useStatisticsCalculator([], undefined, true));
        expect(result.current.efficiency).toBe(0);
        expect(result.current.foulZoneStats.size).toBeGreaterThan(0);
    });

    it('calculates foul rate per zone (fouls / plays)', () => {
        const events: MatchEvent[] = [
            {
                id: '1',
                timestamp: 1,
                teamId: 't1',
                category: 'Shot',
                action: 'Goal',
                zone: '6m-CB',
            },
            {
                id: '2',
                timestamp: 2,
                teamId: 't1',
                category: 'Sanction',
                action: 'Foul',
                zone: '6m-CB',
            },
            {
                id: '3',
                timestamp: 3,
                teamId: 't1',
                category: 'Sanction',
                action: 'Foul',
                zone: '9m-LB',
            },
        ] as MatchEvent[];

        const { result } = renderHook(() => useStatisticsCalculator(events, undefined, false));
        const zone6 = result.current.foulZoneStats.get('6m-CB');
        const zone9 = result.current.foulZoneStats.get('9m-LB');

        expect(zone6?.shots).toBe(2); // 1 shot + 1 foul = plays
        expect(zone6?.goals).toBe(1); // fouls
        expect(zone6?.efficiency).toBeCloseTo(50, 1);

        expect(zone9?.shots).toBe(1); // only foul -> 1 play
        expect(zone9?.goals).toBe(1);
        expect(zone9?.efficiency).toBeCloseTo(100, 1);
    });

    it('uses foulEvents (opponent) as source for foul distribution', () => {
        const teamEvents: MatchEvent[] = [
            {
                id: '1',
                timestamp: 1,
                teamId: 'teamA',
                category: 'Shot',
                action: 'Goal',
                zone: '6m-CB',
            },
        ] as MatchEvent[];

        const opponentEvents: MatchEvent[] = [
            {
                id: '2',
                timestamp: 2,
                teamId: 'teamB',
                category: 'Shot',
                action: 'Goal',
                zone: '9m-LB',
            },
            {
                id: '3',
                timestamp: 3,
                teamId: 'teamB',
                category: 'Sanction',
                action: 'Foul',
                zone: '9m-LB',
            },
        ] as MatchEvent[];

        const { result } = renderHook(() =>
            useStatisticsCalculator(teamEvents, undefined, false, opponentEvents)
        );

        // Own zone should not accumulate fouls when foulEvents provided
        const ownZone = result.current.foulZoneStats.get('6m-CB');
        expect(ownZone?.shots).toBe(0);
        expect(ownZone?.goals).toBe(0);

        // Opponent zone counts their plays/fouls
        const opponentZone = result.current.foulZoneStats.get('9m-LB');
        expect(opponentZone?.shots).toBe(2); // 1 shot + 1 foul
        expect(opponentZone?.goals).toBe(1); // fouls stored in goals
        expect(opponentZone?.efficiency).toBeCloseTo(50, 1);
    });
});
