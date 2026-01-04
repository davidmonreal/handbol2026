import { type MatchEvent, type ZoneType } from '../../types';
import { ZONE_CONFIG } from '../../config/zones';
import type {
    CalculatedStats,
    ZoneStatistics,
    GoalTargetStatistics,
    PlayerStatistics,
    ComparisonData,
} from '../../components/stats/types';

/**
 * Core engine for calculating handball statistics.
 * 
 * BUSINESS CONTEXT (Why we calculate these stats):
 * This engine powers the tactical analysis dashboard for coaches and players.
 * The goal is not just to count goals/shots, but to understand the *quality* of play:
 * 1. Efficiency: The most critical metric. We treat Field Players and GKs differently.
 *    - Field Player: Goals / Shots (How effective is their shooting?)
 *    - Goalkeeper: Saves / Shots on Target (How effective is their saving?)
 * 2. Spatial Analysis (Zones): We map every event to a court zone to create heatmaps.
 *    This helps coaches identify:
 *    - Where are we shooting from most? (Shot Distribution)
 *    - Where are we losing the ball? (Turnover Zones)
 *    - Where is the defense most aggressive? (Foul Zones)
 *    - Where are we most dangerous? (Danger Zone = Goals / Total Plays per zone)
 * 3. Contextual Stats: We break down shots by context (Counter Attack vs Static Attack, etc.)
 *    because a goal in a counter-attack implies a different team performance than a goal in static play.
 * 
 * DESIGN DECISIONS:
 * 1. Decoupling: This class is purely calculation logic, independent of React.
 *    This allows for easier testing and potential reuse in other contexts (e.g., workers).
 * 2. Caching: Internal state matches the lifecycle of the data. 
 *    `cachedStats` allows for multiple calls to `calculate()` without re-processing,
 *    useful if this class is held in state.
 * 3. Strategy Pattern (implicit): Different calculation strategies for Field Players vs GKs
 *    are handled via configuration flags (`isGoalkeeperMode`).
 */
export class StatisticsEngine {
    // Input state
    private events: MatchEvent[];
    private isGoalkeeperMode: boolean;
    private comparison?: ComparisonData;
    private playerResolver?: (playerId: string) => { name: string; number?: number; isGoalkeeper?: boolean };

    // Performance Optimization:
    // We cache the result of the calculation. 
    // Since this class is immutable regarding its inputs (events are passed in constructor),
    // the result is deterministic and can be safely cached.
    private cachedStats: CalculatedStats | null = null;

    constructor(
        events: MatchEvent[],
        isGoalkeeperMode: boolean = false,
        comparison?: ComparisonData,
        playerResolver?: (playerId: string) => { name: string; number?: number; isGoalkeeper?: boolean }
    ) {
        this.events = events;
        this.isGoalkeeperMode = isGoalkeeperMode;
        this.comparison = comparison;
        this.playerResolver = playerResolver;
    }

    /**
     * Calculates all statistics based on the current configuration.
     * Uses internal caching to avoid redundant calculations.
     * 
     * @param foulEvents - Optional events source for filtering fouls (e.g. from opponent)
     * @param gkEvents - Optional events source for goalkeeper stats (e.g. opponent shots)
     * @returns Complete CalculatedStats object
     */
    public calculate(
        foulEvents?: MatchEvent[],
        gkEvents?: MatchEvent[]
    ): CalculatedStats {
        if (this.cachedStats) {
            return this.cachedStats;
        }

        // Filter only shot events
        const shots = this.events.filter(e => e.category === 'Shot');
        const foulEventSource = foulEvents ?? this.events;
        // Use provided gkEvents for GK stats, or fallback to main events
        const gkEventSource = gkEvents ?? this.events;

        const foulShots = foulEventSource.filter(e => e.category === 'Shot');
        const fouls = foulEventSource.filter(e => e.category === 'Sanction');
        const turnovers = this.events.filter(e => e.category === 'Turnover');
        const goals = shots.filter(e => e.action === 'Goal');
        const saves = shots.filter(e => e.action === 'Save');
        const misses = shots.filter(e => e.action === 'Miss');
        const posts = shots.filter(e => e.action === 'Post');

        const totalShots = shots.length;
        const totalGoals = goals.length;
        const totalSaves = saves.length;

        // Efficiency calculation
        // BUSINESS LOGIC:
        // - Field Players: "Shooting Effectiveness" = Goals / Total Shots Attempted (including Misses/Posts)
        // - Goalkeepers: "Saving Effectiveness" = Saves / Shots on Target (Saves + Goals)
        //   Note: Misses and Posts are NOT shots on target, so they don't count for/against the GK.
        let efficiency = 0;
        if (this.isGoalkeeperMode) {
            const shotsOnTarget = totalSaves + totalGoals;
            efficiency = shotsOnTarget > 0 ? (totalSaves / shotsOnTarget) * 100 : 0;
        } else {
            efficiency = totalShots > 0 ? (totalGoals / totalShots) * 100 : 0;
        }

        // Initialize Zone Stats Maps
        const { zoneStats, foulZoneStats, foulReceivedZoneStats, turnoverZoneStats, dangerZoneStats } = this.initializeZoneMaps();

        // Populate Zone Stats
        this.populateZoneStats(
            shots,
            zoneStats,
            foulReceivedZoneStats,
            turnoverZoneStats,
            dangerZoneStats
        );

        this.populateFoulStats(foulShots, fouls, foulZoneStats);

        this.populateSecondaryZoneStats(
            this.events,
            turnovers,
            foulReceivedZoneStats,
            turnoverZoneStats,
            dangerZoneStats
        );

        // Calculate Efficiencies for Zones
        this.calculateZoneEfficiencies(
            zoneStats,
            foulZoneStats,
            foulReceivedZoneStats,
            turnoverZoneStats,
            dangerZoneStats,
            shots
        );

        // Goal Target Stats
        const goalTargetStats = this.calculateGoalTargetStats(shots);

        // Player Stats
        const playerStats = this.calculatePlayerStats(gkEventSource);

        // Aggregates
        const ownFouls = this.events.filter(e => e.category === 'Sanction' || e.category === 'Foul');
        const totalTurnovers = turnovers.length;
        const totalFouls = ownFouls.length;
        const totalPlays = totalShots + totalTurnovers + totalFouls;

        const foulsPercentage = totalPlays > 0 ? (totalFouls / totalPlays) * 100 : 0;
        const turnoversPercentage = totalPlays > 0 ? (totalTurnovers / totalPlays) * 100 : 0;
        const missesPercentage = totalPlays > 0 ? (misses.length / totalPlays) * 100 : 0;
        const goalsPercentage = totalPlays > 0 ? (totalGoals / totalPlays) * 100 : 0;

        let totalGoalsConceded = 0;
        playerStats.forEach(stat => {
            totalGoalsConceded += stat.goalsConceded;
        });

        const result: CalculatedStats = {
            totalShots,
            totalGoals,
            totalSaves: saves.length,
            totalMisses: misses.length,
            totalFouls,
            totalTurnovers,
            foulRate: foulsPercentage,
            totalPosts: posts.length,
            efficiency,
            foulsPercentage,
            turnoversPercentage,
            missesPercentage,
            goalsPercentage,
            goalsConceded: totalGoalsConceded,
            zoneStats,
            foulZoneStats,
            foulReceivedZoneStats,
            turnoverZoneStats,
            dangerZoneStats,
            playerStats,
            goalTargetStats,
        };

        this.cachedStats = result;
        return result;
    }

    private initializeZoneMaps() {
        const zoneStats = new Map<ZoneType | '7m', ZoneStatistics>();
        const foulZoneStats = new Map<ZoneType | '7m', ZoneStatistics>();
        const foulReceivedZoneStats = new Map<ZoneType | '7m', ZoneStatistics>();
        const turnoverZoneStats = new Map<ZoneType | '7m', ZoneStatistics>();
        const dangerZoneStats = new Map<ZoneType | '7m', ZoneStatistics>();

        [...ZONE_CONFIG.sixMeter, ...ZONE_CONFIG.nineMeter, ZONE_CONFIG.penalty].forEach(({ zone }) => {
            zoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
            foulZoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
            foulReceivedZoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
            turnoverZoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
            dangerZoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
        });

        return { zoneStats, foulZoneStats, foulReceivedZoneStats, turnoverZoneStats, dangerZoneStats };
    }

    private populateZoneStats(
        shots: MatchEvent[],
        zoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        foulReceivedZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        turnoverZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        dangerZoneStats: Map<ZoneType | '7m', ZoneStatistics>
    ) {
        shots.forEach(shot => {
            if (!shot.zone) return;

            // Shot Distribution
            const shotStats = zoneStats.get(shot.zone);
            if (shotStats) {
                shotStats.shots++;
                if (shot.action === 'Goal') {
                    shotStats.goals++;
                }
            }

            // Denominator contributions
            const foulReceivedStats = foulReceivedZoneStats.get(shot.zone);
            if (foulReceivedStats) {
                foulReceivedStats.shots++; // Add shot to denominator (Shots + Fouls)
            }

            const turnoverStats = turnoverZoneStats.get(shot.zone);
            if (turnoverStats) {
                turnoverStats.shots++; // Add shot to denominator (Total Plays)
            }

            const dangerStats = dangerZoneStats.get(shot.zone);
            if (dangerStats) {
                dangerStats.shots++; // Add shot to denominator (Total Plays)
                if (shot.action === 'Goal') {
                    dangerStats.goals++; // Add goal to numerator
                }
            }
        });
    }

    private populateFoulStats(
        foulShots: MatchEvent[],
        fouls: MatchEvent[],
        foulZoneStats: Map<ZoneType | '7m', ZoneStatistics>
    ) {
        foulShots.forEach(shot => {
            if (!shot.zone) return;
            const foulStats = foulZoneStats.get(shot.zone);
            if (foulStats) {
                foulStats.shots++; // plays in this zone
            }
        });

        fouls.forEach(foul => {
            if (!foul.zone) return;
            const foulStats = foulZoneStats.get(foul.zone);
            if (foulStats) {
                foulStats.shots++; // plays
                foulStats.goals++; // fouls count
            }
        });
    }

    private populateSecondaryZoneStats(
        events: MatchEvent[],
        turnovers: MatchEvent[],
        foulReceivedZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        turnoverZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        dangerZoneStats: Map<ZoneType | '7m', ZoneStatistics>
    ) {
        // Own Fouls (Suffered)
        const ownFouls = events.filter(e => e.category === 'Sanction' || e.category === 'Foul');
        ownFouls.forEach(foul => {
            if (!foul.zone) return;

            // Foul Received View
            const foulReceivedStats = foulReceivedZoneStats.get(foul.zone);
            if (foulReceivedStats) {
                foulReceivedStats.shots++;
                foulReceivedStats.goals++;
            }

            // Turnover View
            const turnoverStats = turnoverZoneStats.get(foul.zone);
            if (turnoverStats) {
                turnoverStats.shots++;
            }

            // Danger View
            const dangerStats = dangerZoneStats.get(foul.zone);
            if (dangerStats) {
                dangerStats.shots++;
            }
        });

        // Turnovers
        turnovers.forEach(turnover => {
            if (!turnover.zone) return;

            const turnoverStats = turnoverZoneStats.get(turnover.zone);
            if (turnoverStats) {
                turnoverStats.shots++;
                turnoverStats.goals++;
            }

            const dangerStats = dangerZoneStats.get(turnover.zone);
            if (dangerStats) {
                dangerStats.shots++;
            }
        });
    }

    private calculateZoneEfficiencies(
        zoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        foulZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        foulReceivedZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        turnoverZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        dangerZoneStats: Map<ZoneType | '7m', ZoneStatistics>,
        shots: MatchEvent[]
    ) {
        // Standard Efficiency logic
        if (this.isGoalkeeperMode) {
            zoneStats.forEach((stats, zone) => {
                stats.shots = 0;
                stats.goals = 0;
                let saves = 0;

                shots.forEach(shot => {
                    if (shot.zone === zone) {
                        if (shot.action === 'Save') {
                            saves++;
                            stats.shots++;
                        } else if (shot.action === 'Goal') {
                            stats.goals++;
                            stats.shots++;
                        }
                    }
                });
                stats.efficiency = stats.shots > 0 ? (saves / stats.shots) * 100 : 0;
            });
        } else {
            zoneStats.forEach((stats) => {
                stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
            });
        }

        foulZoneStats.forEach(stats => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });

        foulReceivedZoneStats.forEach(stats => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });

        turnoverZoneStats.forEach(stats => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });

        dangerZoneStats.forEach(stats => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });
    }

    private calculateGoalTargetStats(shots: MatchEvent[]) {
        const goalTargetStats = new Map<number, GoalTargetStatistics>();
        for (let target = 1; target <= 9; target++) {
            const targetShots = shots.filter(s => s.goalTarget === target);
            const targetGoals = targetShots.filter(s => s.action === 'Goal');
            const targetSaves = targetShots.filter(s => s.action === 'Save');

            let targetEfficiency = 0;
            if (this.isGoalkeeperMode) {
                const shotsOnTarget = targetSaves.length + targetGoals.length;
                targetEfficiency = shotsOnTarget > 0 ? (targetSaves.length / shotsOnTarget) * 100 : 0;
            } else {
                targetEfficiency = targetShots.length > 0 ? (targetGoals.length / targetShots.length) * 100 : 0;
            }

            goalTargetStats.set(target, {
                goals: targetGoals.length,
                saves: targetSaves.length,
                shots: targetShots.length,
                efficiency: targetEfficiency,
            });
        }
        return goalTargetStats;
    }

    private calculatePlayerStats(gkEventSource: MatchEvent[]) {
        const playerStats = new Map<string, PlayerStatistics>();
        const playerEvents = new Map<string, MatchEvent[]>();

        // Group events by player
        this.events.forEach(event => {
            if (!event.playerId) return;
            if (!playerEvents.has(event.playerId)) {
                playerEvents.set(event.playerId, []);
            }
            playerEvents.get(event.playerId)!.push(event);
        });

        // 1. Calculate stats for field players (and GK offensive actions)
        playerEvents.forEach((playerEvs, playerId) => {
            const stats = this.computeSinglePlayerStats(playerId, playerEvs);
            playerStats.set(playerId, stats);
        });

        // 2. Aggregate GK stats (Saves/Conceded)
        gkEventSource.forEach(e => {
            if (!e.activeGoalkeeperId) return;
            if (e.category !== 'Shot') return;

            const gkId = e.activeGoalkeeperId;

            if (!playerStats.has(gkId)) {
                // Initialize GK stats if not present
                playerStats.set(gkId, this.createEmptyPlayerStats(gkId));
            }

            const gkStats = playerStats.get(gkId)!;

            if (e.action === 'Save') {
                gkStats.saves++;
            } else if (e.action === 'Goal') {
                gkStats.goalsConceded++;
            }

            const shotsOnTarget = gkStats.saves + gkStats.goalsConceded;
            gkStats.efficiency = shotsOnTarget > 0 ? (gkStats.saves / shotsOnTarget) * 100 : 0;
        });

        return playerStats;
    }

    private computeSinglePlayerStats(playerId: string, events: MatchEvent[]): PlayerStatistics {
        const playerShots = events.filter(e => e.category === 'Shot');
        const playerGoals = playerShots.filter(e => e.action === 'Goal');
        const playerSaves = playerShots.filter(e => e.action === 'Save');
        const playerMisses = playerShots.filter(e => e.action === 'Miss');
        const playerPosts = playerShots.filter(e => e.action === 'Post');

        const playerEfficiency = playerShots.length > 0
            ? (playerGoals.length / playerShots.length) * 100
            : 0;

        const firstEvent = events[0];
        let playerName = firstEvent.playerName || 'Unknown';
        let playerNumber = firstEvent.playerNumber;

        if (this.playerResolver) {
            const info = this.playerResolver(playerId);
            if (info) {
                playerName = info.name;
                playerNumber = info.number;
            }
        }

        const stats: PlayerStatistics = {
            playerId,
            playerName,
            playerNumber,
            shots: playerShots.length,
            goals: playerGoals.length,
            saves: playerSaves.length,
            misses: playerMisses.length,
            posts: playerPosts.length,
            efficiency: playerEfficiency,
            shots6m: 0, goals6m: 0,
            shots9m: 0, goals9m: 0,
            shots7m: 0, goals7m: 0,
            shotsWithOpp: 0, goalsWithOpp: 0,
            shotsNoOpp: 0, goalsNoOpp: 0,
            shotsCollective: 0, goalsCollective: 0,
            shotsIndividual: 0, goalsIndividual: 0,
            shotsCounter: 0, goalsCounter: 0,
            shotsStatic: 0, goalsStatic: 0,
            turnovers: 0,
            yellowCards: 0, twoMinutes: 0, redCards: 0, blueCards: 0, commonFouls: 0,
            goalsConceded: 0,
        };

        events.forEach(e => {
            if (e.category === 'Shot') {
                // Zone-based stats
                if (e.zone?.startsWith('6m')) {
                    stats.shots6m++;
                    if (e.action === 'Goal') stats.goals6m++;
                } else if (e.zone?.startsWith('9m')) {
                    stats.shots9m++;
                    if (e.action === 'Goal') stats.goals9m++;
                } else if (e.zone === '7m') {
                    stats.shots7m++;
                    if (e.action === 'Goal') stats.goals7m++;
                }

                // Context-based stats
                // BUSINESS LOGIC: These help analyze the 'Game Phase'.
                // - With Opposition: Did the shooter have a defender challenging them? (Action under pressure)
                // - No Opposition: Was it a clear shot? (Execution quality)
                if (e.context?.hasOpposition) {
                    stats.shotsWithOpp++;
                    if (e.action === 'Goal') stats.goalsWithOpp++;
                } else if (e.context?.hasOpposition === false) {
                    stats.shotsNoOpp++;
                    if (e.action === 'Goal') stats.goalsNoOpp++;
                }

                // - Collective: Was the goal created by team play (assist)?
                // - Individual: Was it a solo effort (e.g., 1v1)?
                if (e.context?.isCollective) {
                    stats.shotsCollective++;
                    if (e.action === 'Goal') stats.goalsCollective++;
                } else if (e.context?.isCollective === false) {
                    stats.shotsIndividual++;
                    if (e.action === 'Goal') stats.goalsIndividual++;
                }

                // - Counter Attack: Transition phase effectiveness.
                // - Static: Set defense attack effectiveness.
                if (e.context?.isCounterAttack) {
                    stats.shotsCounter++;
                    if (e.action === 'Goal') stats.goalsCounter++;
                } else if (e.context?.isCounterAttack === false) {
                    stats.shotsStatic++;
                    if (e.action === 'Goal') stats.goalsStatic++;
                }
            }

            if (e.category === 'Turnover') {
                stats.turnovers++;
            }

            if (e.category === 'Sanction' || e.category === 'Foul') {
                if (e.action === 'Yellow') stats.yellowCards++;
                else if (e.action === '2min') stats.twoMinutes++;
                else if (e.action === 'Red') stats.redCards++;
                else if (e.action === 'Blue') stats.blueCards++;
                else stats.commonFouls++;
            }
        });

        // Add comparison
        if (this.comparison?.playerAverages) {
            const baselineEfficiency = this.comparison.playerAverages.get(playerId);
            if (baselineEfficiency !== undefined && playerShots.length > 0) {
                stats.comparison = {
                    baselineEfficiency,
                    delta: playerEfficiency - baselineEfficiency,
                };
            }
        }

        return stats;
    }

    private createEmptyPlayerStats(playerId: string): PlayerStatistics {
        let name = 'Unknown GK';
        let number: number | undefined;
        if (this.playerResolver) {
            const info = this.playerResolver(playerId);
            if (info) {
                name = info.name;
                number = info.number;
            }
        }
        return {
            playerId,
            playerName: name,
            playerNumber: number,
            shots: 0, goals: 0, saves: 0, misses: 0, posts: 0, efficiency: 0,
            shots6m: 0, goals6m: 0, shots9m: 0, goals9m: 0, shots7m: 0, goals7m: 0,
            shotsWithOpp: 0, goalsWithOpp: 0, shotsNoOpp: 0, goalsNoOpp: 0,
            shotsCollective: 0, goalsCollective: 0, shotsIndividual: 0, goalsIndividual: 0,
            shotsCounter: 0, goalsCounter: 0, shotsStatic: 0, goalsStatic: 0,
            turnovers: 0,
            yellowCards: 0, twoMinutes: 0, redCards: 0, blueCards: 0, commonFouls: 0,
            goalsConceded: 0,
        };
    }
}
