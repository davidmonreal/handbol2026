import { describe, it, expect } from 'vitest';
import { StatisticsEngine } from './StatisticsEngine';
import type { MatchEvent } from '../../types';

describe('StatisticsEngine', () => {
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
        const engine = new StatisticsEngine(mockEvents, false);
        const result = engine.calculate();

        // Total shots: 3 (Goal, Save, Miss)
        // Total goals: 1
        // Efficiency: 1/3 = 33.33%
        expect(result.totalShots).toBe(3);
        expect(result.totalGoals).toBe(1);
        expect(result.efficiency).toBeCloseTo(33.33, 2);
    });

    it('calculates efficiency correctly for goalkeepers (Saves / (Saves + Goals))', () => {
        const engine = new StatisticsEngine(mockEvents, true);
        const result = engine.calculate();

        // Total saves: 1
        // Total goals: 1
        // Shots on target (Saves + Goals): 2
        // Efficiency: 1/2 = 50%
        expect(result.totalSaves).toBe(1);
        expect(result.totalGoals).toBe(1);
        expect(result.efficiency).toBeCloseTo(50.00, 2);
    });

    it('calculates zone efficiency correctly for goalkeepers', () => {
        const engine = new StatisticsEngine(mockEvents, true);
        const result = engine.calculate();

        // Zone 6m-CB: 1 Goal -> 0% efficiency (0 saves / 1 shot on target)
        const zone6mCB = result.zoneStats.get('6m-CB');
        expect(zone6mCB?.goals).toBe(1);
        expect(zone6mCB?.efficiency).toBe(0);

        // Zone 9m-LB: 1 Save -> 100% efficiency (1 save / 1 shot on target)
        const zone9mLB = result.zoneStats.get('9m-LB');
        expect(zone9mLB?.efficiency).toBe(100);
    });

    it('calculates goal target statistics correctly for goalkeepers', () => {
        const engine = new StatisticsEngine(mockEvents, true);
        const result = engine.calculate();

        // Target 5 (Center): 1 Goal -> 0% efficiency
        const target5 = result.goalTargetStats.get(5);
        expect(target5?.goals).toBe(1);
        expect(target5?.saves).toBe(0);
        expect(target5?.efficiency).toBe(0);

        // Target 1 (Top Left): 1 Save -> 100% efficiency
        const target1 = result.goalTargetStats.get(1);
        expect(target1?.goals).toBe(0);
        expect(target1?.saves).toBe(1);
        expect(target1?.efficiency).toBe(100);
    });

    it('handles zero shots correctly', () => {
        const engine = new StatisticsEngine([], true);
        const result = engine.calculate();
        expect(result.efficiency).toBe(0);
        expect(result.foulZoneStats.size).toBeGreaterThan(0);
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

        const engine = new StatisticsEngine(events, false);
        const result = engine.calculate();
        const zone6 = result.foulZoneStats.get('6m-CB');
        const zone9 = result.foulZoneStats.get('9m-LB');

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

        const engine = new StatisticsEngine(teamEvents, false);
        const result = engine.calculate(opponentEvents);

        // Own zone should not accumulate fouls when foulEvents provided
        const ownZone = result.foulZoneStats.get('6m-CB');
        expect(ownZone?.shots).toBe(0);
        expect(ownZone?.goals).toBe(0);

        // Opponent zone counts their plays/fouls
        const opponentZone = result.foulZoneStats.get('9m-LB');
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

        const playerResolver = (id: string) => ({ name: 'test-player', number: 10 });
        const engine = new StatisticsEngine(events, false, undefined, playerResolver);
        const result = engine.calculate();

        const stats = result.playerStats.get('p1');
        expect(stats).toBeDefined();
        expect(stats?.playerName).toBe('test-player');
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

        // We use GK events as final argument
        const engine = new StatisticsEngine(events, false);
        const result = engine.calculate(undefined, gkEvents);

        // Should NOT have Team B GK in stats (from events)
        expect(result.playerStats.has('gkB')).toBe(false);

        // Should HAVE Team A GK in stats (from gkEvents)
        const gkA = result.playerStats.get('gkA');
        expect(gkA).toBeDefined();
        expect(gkA?.saves).toBe(1);
    });

    it('correctly distinguishes between a player acting as a shooter vs as a goalkeeper', () => {
        const gkId = 'dual-role-player';

        // Scenario: The player takes a shot (Shooter) AND makes a save (Goalkeeper)
        // 1. Player TAKES a shot
        const offensiveEvents: MatchEvent[] = [
            {
                id: '1', timestamp: 1, teamId: 'A', playerId: gkId, // Player is the shooter
                category: 'Shot', action: 'Goal', activeGoalkeeperId: 'opponent-gk'
            }
        ] as MatchEvent[];

        // 2. Player SAVES a shot
        const defensiveEvents: MatchEvent[] = [
            {
                id: '2', timestamp: 2, teamId: 'B', playerId: 'opponent-shooter',
                category: 'Shot', action: 'Save', activeGoalkeeperId: gkId // Player is the GK
            }
        ] as MatchEvent[];

        const engine = new StatisticsEngine(offensiveEvents, true);
        const result = engine.calculate(undefined, defensiveEvents);

        const playerStats = result.playerStats.get(gkId);

        // Assertions for GK stats (from defensiveEvents)
        expect(playerStats?.saves).toBe(1);
        expect(playerStats?.goalsConceded).toBe(0);

        // Assertions for Shooter stats (from offensiveEvents)
        expect(playerStats?.goals).toBe(1);
        expect(playerStats?.shots).toBe(1);
    });
});
