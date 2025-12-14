import { useMemo } from 'react';
import { type MatchEvent, type ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import type {
    CalculatedStats,
    ZoneStatistics,
    GoalTargetStatistics,
    PlayerStatistics,
    ComparisonData,
} from '../types';

/**
 * Hook to calculate statistics from match events
 * Memoized for performance
 */
export function useStatisticsCalculator(
    events: MatchEvent[],
    comparison?: ComparisonData,
    isGoalkeeper: boolean = false,
    foulEvents?: MatchEvent[],
    playerResolver?: (playerId: string) => { name: string; number: number; isGoalkeeper?: boolean },
    gkEvents?: MatchEvent[]
): CalculatedStats {
    return useMemo(() => {
        // Filter only shot events
        const shots = events.filter(e => e.category === 'Shot');
        const foulEventSource = foulEvents ?? events;
        // Use provided gkEvents for GK stats, or fallback to events (for backward compatibility/simple usage)
        const gkEventSource = gkEvents ?? events;

        // ... rest of logic


        const foulShots = foulEventSource.filter(e => e.category === 'Shot');
        const fouls = foulEventSource.filter(e => e.category === 'Sanction');
        const goals = shots.filter(e => e.action === 'Goal');
        const saves = shots.filter(e => e.action === 'Save');
        const misses = shots.filter(e => e.action === 'Miss');
        const posts = shots.filter(e => e.action === 'Post');


        const totalShots = shots.length;
        const totalGoals = goals.length;
        const totalSaves = saves.length;

        // Efficiency calculation
        // For field players: Goals / Shots
        // For goalkeepers: Saves / (Saves + Goals)
        let efficiency = 0;
        if (isGoalkeeper) {
            const shotsOnTarget = totalSaves + totalGoals;
            efficiency = shotsOnTarget > 0 ? (totalSaves / shotsOnTarget) * 100 : 0;
        } else {
            efficiency = totalShots > 0 ? (totalGoals / totalShots) * 100 : 0;
        }

        // Calculate zone statistics
        const zoneStats = new Map<ZoneType | '7m', ZoneStatistics>();
        const foulZoneStats = new Map<ZoneType | '7m', ZoneStatistics>();

        // Initialize all zones with zero values
        [...ZONE_CONFIG.sixMeter, ...ZONE_CONFIG.nineMeter, ZONE_CONFIG.penalty].forEach(({ zone }) => {
            zoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 });
            foulZoneStats.set(zone, { shots: 0, goals: 0, efficiency: 0 }); // shots = plays, goals = fouls
        });

        // Count shots/goals and plays/fouls per zone
        shots.forEach(shot => {
            if (!shot.zone) return;

            const shotStats = zoneStats.get(shot.zone);
            if (shotStats) {
                shotStats.shots++;
                if (shot.action === 'Goal') {
                    shotStats.goals++;
                }
            }
        });

        // For foul view: plays = shots + fouls of the selected source (team or opponent)
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
                foulStats.goals++; // fouls count (reuse goals field)
            }
        });

        // Calculate efficiency for each zone
        zoneStats.forEach((stats) => {
            // Default calculation (will be overwritten below)
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
        });

        // Calculate efficiency for each zone
        if (isGoalkeeper) {
            // For goalkeepers: recalculate efficiency based on saves
            zoneStats.forEach((stats, zone) => {
                // Reset and recalculate for GK
                stats.shots = 0;
                stats.goals = 0;
                let saves = 0;

                // Count saves and goals for this zone
                shots.forEach(shot => {
                    if (shot.zone === zone) {
                        if (shot.action === 'Save') {
                            saves++;
                            stats.shots++; // Count shots on target
                        } else if (shot.action === 'Goal') {
                            stats.goals++;
                            stats.shots++; // Count shots on target
                        }
                    }
                });

                // Calculate efficiency as Save %
                stats.efficiency = stats.shots > 0 ? (saves / stats.shots) * 100 : 0;
            });
        } else {
            // For field players: efficiency is goals / shots
            zoneStats.forEach((stats) => {
                stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0;
            });
        }

        foulZoneStats.forEach((stats) => {
            stats.efficiency = stats.shots > 0 ? (stats.goals / stats.shots) * 100 : 0; // % fouls over plays in zone
        });

        // Calculate goal target statistics (1-9)
        const goalTargetStats = new Map<number, GoalTargetStatistics>();
        for (let target = 1; target <= 9; target++) {
            const targetShots = shots.filter(s => s.goalTarget === target);
            const targetGoals = targetShots.filter(s => s.action === 'Goal');
            const targetSaves = targetShots.filter(s => s.action === 'Save');

            let targetEfficiency = 0;
            if (isGoalkeeper) {
                // For GK: Save % (Saves / (Saves + Goals))
                // Note: targetShots includes Miss/Post which shouldn't count for Save % usually?
                // Standard formula: Saves / Shots on Target
                const shotsOnTarget = targetSaves.length + targetGoals.length;
                targetEfficiency = shotsOnTarget > 0 ? (targetSaves.length / shotsOnTarget) * 100 : 0;
            } else {
                // For Player: Goal % (Goals / Shots)
                targetEfficiency = targetShots.length > 0 ? (targetGoals.length / targetShots.length) * 100 : 0;
            }

            goalTargetStats.set(target, {
                goals: targetGoals.length,
                saves: targetSaves.length,
                shots: targetShots.length,
                efficiency: targetEfficiency,
            });
        }

        // Calculate player statistics
        const playerStats = new Map<string, PlayerStatistics>();

        // Group events by player
        const playerEvents = new Map<string, MatchEvent[]>();
        events.forEach(event => {
            if (!event.playerId) return;

            if (!playerEvents.has(event.playerId)) {
                playerEvents.set(event.playerId, []);
            }
            playerEvents.get(event.playerId)!.push(event);
        });

        // Calculate stats for each player
        playerEvents.forEach((playerEvs, playerId) => {
            const playerShots = playerEvs.filter(e => e.category === 'Shot');
            const playerGoals = playerShots.filter(e => e.action === 'Goal');
            const playerSaves = playerShots.filter(e => e.action === 'Save');
            const playerMisses = playerShots.filter(e => e.action === 'Miss');
            const playerPosts = playerShots.filter(e => e.action === 'Post');

            const playerEfficiency = playerShots.length > 0
                ? (playerGoals.length / playerShots.length) * 100
                : 0;

            const firstEvent = playerEvs[0];
            let playerName = firstEvent.playerName;
            let playerNumber = firstEvent.playerNumber;

            if (playerResolver) {
                const info = playerResolver(playerId);
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

                // Detailed stats
                shots6m: 0,
                goals6m: 0,
                shots9m: 0,
                goals9m: 0,
                shots7m: 0,
                goals7m: 0,
                shotsWithOpp: 0,
                goalsWithOpp: 0,
                shotsNoOpp: 0,
                goalsNoOpp: 0,
                shotsCollective: 0,
                goalsCollective: 0,
                shotsIndividual: 0,
                goalsIndividual: 0,
                shotsCounter: 0,
                goalsCounter: 0,
                shotsStatic: 0,
                goalsStatic: 0,
                turnovers: 0,
                yellowCards: 0,
                twoMinutes: 0,
                redCards: 0,
                blueCards: 0,
                commonFouls: 0,
                goalsConceded: 0,
            };

            playerEvs.forEach(e => {
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
                    if (e.context?.hasOpposition) {
                        stats.shotsWithOpp++;
                        if (e.action === 'Goal') stats.goalsWithOpp++;
                    } else if (e.context?.hasOpposition === false) {
                        stats.shotsNoOpp++;
                        if (e.action === 'Goal') stats.goalsNoOpp++;
                    }

                    if (e.context?.isCollective) {
                        stats.shotsCollective++;
                        if (e.action === 'Goal') stats.goalsCollective++;
                    } else if (e.context?.isCollective === false) {
                        stats.shotsIndividual++;
                        if (e.action === 'Goal') stats.goalsIndividual++;
                    }

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

            // Add comparison if baseline data is available
            if (comparison?.playerAverages) {
                const baselineEfficiency = comparison.playerAverages.get(playerId);
                if (baselineEfficiency !== undefined && playerShots.length > 0) {
                    stats.comparison = {
                        baselineEfficiency,
                        delta: playerEfficiency - baselineEfficiency,
                    };
                }
            }

            playerStats.set(playerId, stats);
        });

        // ------------------------------------------------------------------
        // Aggregation for Active Goalkeeper (Saves & Conceded)
        // ------------------------------------------------------------------
        // ------------------------------------------------------------------
        // Aggregation for Active Goalkeeper (Saves & Conceded)
        // ------------------------------------------------------------------
        // We iterate specifically provided GK events (opponent shots) or fallback to main events
        gkEventSource.forEach(e => {
            if (!e.activeGoalkeeperId) return;
            // Only care about Shots for GK stats (Saves/Goals)
            if (e.category !== 'Shot') return;

            const gkId = e.activeGoalkeeperId;

            // Initialize GK stats if not present (might be present if they also played field)
            if (!playerStats.has(gkId)) {
                let gkName = 'Unknown GK';
                let gkNumber = 0;

                if (playerResolver) {
                    const info = playerResolver(gkId);
                    if (info) {
                        gkName = info.name;
                        gkNumber = info.number;
                    }
                }

                playerStats.set(gkId, {
                    playerId: gkId,
                    playerName: gkName,
                    playerNumber: gkNumber,
                    shots: 0,
                    goals: 0,
                    saves: 0,
                    misses: 0,
                    posts: 0,
                    efficiency: 0,
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
                });
            }

            const gkStats = playerStats.get(gkId)!;

            if (e.action === 'Save') {
                gkStats.saves++;
            } else if (e.action === 'Goal') {
                gkStats.goalsConceded++;
            }

            // Recalculate efficiency for GK: Saves / (Saves + GoalsConceded)
            const shotsOnTarget = gkStats.saves + gkStats.goalsConceded;
            gkStats.efficiency = shotsOnTarget > 0 ? (gkStats.saves / shotsOnTarget) * 100 : 0;
        });


        // Calculate turnovers and total plays
        const turnovers = events.filter(e => e.category === 'Turnover');
        const totalTurnovers = turnovers.length;

        // Calculate fouls from events (to match PlayerStatisticsTable and Offensive Plays)
        // Include both 'Sanction' and 'Foul' categories
        // NOTE: We only track OFFENSIVE plays. If an attack ends in a "Foul", it means
        // the team SUFFERED a foul (was fouled by the opponent), not that they committed one.
        const ownFouls = events.filter(e => e.category === 'Sanction' || e.category === 'Foul');
        const totalFouls = ownFouls.length;

        // Total Plays = Shots + Turnovers + Fouls
        const totalPlays = totalShots + totalTurnovers + totalFouls;
        const foulsPercentage = totalPlays > 0 ? (totalFouls / totalPlays) * 100 : 0;
        const turnoversPercentage = totalPlays > 0 ? (totalTurnovers / totalPlays) * 100 : 0;
        const missesPercentage = totalPlays > 0 ? (misses.length / totalPlays) * 100 : 0;
        const goalsPercentage = totalPlays > 0 ? (totalGoals / totalPlays) * 100 : 0;

        // Calculate total goals conceded (sum of all GK stats)
        // Careful not to double count if we have multiple GKs. 
        // Actually, we can just filter the gkEventSource for Goals if we want total team conceded.
        // OR sum from playerStats.
        let totalGoalsConceded = 0;
        playerStats.forEach(stat => {
            totalGoalsConceded += stat.goalsConceded;
        });

        return {
            totalShots,
            totalGoals,
            totalSaves: saves.length,
            totalMisses: misses.length,
            totalFouls,
            totalTurnovers,
            foulRate: foulsPercentage, // Alias for compatibility, using correct denominator
            totalPosts: posts.length,
            efficiency,
            foulsPercentage,
            turnoversPercentage,
            missesPercentage,
            goalsPercentage,
            goalsConceded: totalGoalsConceded,
            zoneStats,
            foulZoneStats,
            playerStats,
            goalTargetStats,
        };
    }, [events, comparison, isGoalkeeper, foulEvents, playerResolver]);
}
