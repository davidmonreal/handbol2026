import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStatisticsCalculator } from './useStatisticsCalculator';
import type { MatchEvent } from '../../../types';

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

    it('calculates detailed player statistics', () => {
        const events: MatchEvent[] = [
            {
                id: '1', timestamp: 1, teamId: 't1', playerId: 'p1',
                category: 'Shot', action: 'Goal', zone: '6m-CB',
                context: { hasOpposition: true, isCollective: true, isCounterAttack: false }
            },
            {
                id: '2', timestamp: 2, teamId: 't1', playerId: 'p1',
                category: 'Shot', action: 'Miss', zone: '9m-LB',
                context: { hasOpposition: false, isCollective: false, isCounterAttack: true }
            },
            {
                id: '3', timestamp: 3, teamId: 't1', playerId: 'p1',
                category: 'Sanction', action: '2min'
            },
        ] as MatchEvent[];

        const playerResolver = (id: string) => ({ name: 'Test Player', number: 10 });

        const { result } = renderHook(() =>
            useStatisticsCalculator(events, undefined, false, undefined, playerResolver)
        );

        const stats = result.current.playerStats.get('p1');
        expect(stats).toBeDefined();
        expect(stats?.playerName).toBe('Test Player');
        expect(stats?.playerNumber).toBe(10);
        expect(stats?.goals).toBe(1);
        expect(stats?.shots).toBe(2);

        // Zone stats checks
        expect(stats?.shots6m).toBe(1);
        expect(stats?.goals6m).toBe(1);
        expect(stats?.shots9m).toBe(1);
        expect(stats?.goals9m).toBe(0);

        // Context stats checks
        expect(stats?.shotsWithOpp).toBe(1);
        expect(stats?.goalsWithOpp).toBe(1);
        expect(stats?.shotsNoOpp).toBe(1);
        expect(stats?.goalsNoOpp).toBe(0);

        expect(stats?.shotsCollective).toBe(1);
        expect(stats?.goalsCollective).toBe(1);
        expect(stats?.shotsIndividual).toBe(1);
        expect(stats?.goalsIndividual).toBe(0);

        expect(stats?.shotsStatic).toBe(1); // Counter = false
        expect(stats?.goalsStatic).toBe(1);
        expect(stats?.shotsCounter).toBe(1); // Counter = true
        expect(stats?.goalsCounter).toBe(0);

        // Sanction checks
        expect(stats?.twoMinutes).toBe(1);
    });

    it('aggregates GK stats from separate gkEvents source', () => {
        // Events: Team A offensive shots (Team B GK active)
        const events: MatchEvent[] = [
            {
                id: '1', timestamp: 1, teamId: 'A', playerId: 'pA1',
                category: 'Shot', action: 'Goal', activeGoalkeeperId: 'gkB'
            },
        ] as MatchEvent[];

        // GK Events: Team B offensive shots (Team A GK active)
        const gkEvents: MatchEvent[] = [
            {
                id: '2', timestamp: 2, teamId: 'B', playerId: 'pB1',
                category: 'Shot', action: 'Save', activeGoalkeeperId: 'gkA'
            },
        ] as MatchEvent[];

        const { result } = renderHook(() =>
            useStatisticsCalculator(events, undefined, false, undefined, undefined, gkEvents)
        );

        // Should NOT have Team B GK in stats (from events)
        expect(result.current.playerStats.has('gkB')).toBe(false);

        // Should HAVE Team A GK in stats (from gkEvents)
        const gkA = result.current.playerStats.get('gkA');
        expect(gkA).toBeDefined();
        expect(gkA?.saves).toBe(1);
    });

    it('correctly distinguishes between a player acting as a shooter vs as a goalkeeper', () => {
        const gkId = 'dual-role-player';

        // Scenario: The player takes a shot (Shooter) AND makes a save (Goalkeeper)
        // 1. Player TAKES a shot (should NOT count as a save/conceded for them)
        const offensiveEvents: MatchEvent[] = [
            {
                id: '1', timestamp: 1, teamId: 'A', playerId: gkId, // Player is the shooter
                category: 'Shot', action: 'Goal', activeGoalkeeperId: 'opponent-gk'
            }
        ] as MatchEvent[];

        // 2. Player SAVES a shot (should count as a save)
        const defensiveEvents: MatchEvent[] = [
            {
                id: '2', timestamp: 2, teamId: 'B', playerId: 'opponent-shooter',
                category: 'Shot', action: 'Save', activeGoalkeeperId: gkId // Player is the GK
            }
        ] as MatchEvent[];

        // We use the hook with `gkEvents` populated for the defensive actions
        const { result } = renderHook(() =>
            useStatisticsCalculator(offensiveEvents, undefined, true, undefined, undefined, defensiveEvents)
        );

        const playerStats = result.current.playerStats.get(gkId);

        // Assertions for GK stats (from defensiveEvents)
        expect(playerStats?.saves).toBe(1);
        expect(playerStats?.goalsConceded).toBe(0);

        // Assertions for Shooter stats (from offensiveEvents)
        // Note: The hook aggregates shooter stats into the same object if they exist in `events`
        expect(playerStats?.goals).toBe(1);
        expect(playerStats?.shots).toBe(1);
    });
});
