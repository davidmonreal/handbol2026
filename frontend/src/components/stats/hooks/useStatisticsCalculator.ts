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
    foulEvents?: MatchEvent[]
): CalculatedStats {
    return useMemo(() => {
        // Filter only shot events
        const shots = events.filter(e => e.category === 'Shot');
        const foulEventSource = foulEvents ?? events;

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

            const stats: PlayerStatistics = {
                playerId,
                playerName: firstEvent.playerName,
                playerNumber: firstEvent.playerNumber,
                shots: playerShots.length,
                goals: playerGoals.length,
                saves: playerSaves.length,
                misses: playerMisses.length,
                posts: playerPosts.length,
                efficiency: playerEfficiency,
            };

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
            zoneStats,
            foulZoneStats,
            playerStats,
            goalTargetStats,
        };
    }, [events, comparison, isGoalkeeper]);
}
