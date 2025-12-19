import { useState } from 'react';
import type { ZoneType } from '../../types';
import { useStatisticsCalculator } from './hooks/useStatisticsCalculator';
import { StatCard } from './StatCard';
import { GoalHeatmap } from './GoalHeatmap';
import { ZoneDistribution } from './ZoneDistribution';
import type { StatisticsPanelProps } from './types';

/**
 * StatisticsPanel - Main container component for statistics display
 * 
 * Composes all statistics sub-components and manages zone filtering state
 * Can be used for player, team, or match statistics
 * 
 * @example
 * // Player statistics
 * <StatisticsPanel
 *   data={{ events: playerEvents, title: "Player Stats", context: "player" }}
 * />
 * 
 * @example
 * // Match statistics with comparison
 * <StatisticsPanel
 *   data={{ events: matchEvents, title: "Match Stats", context: "match" }}
 *   comparison={{ playerAverages: averagesMap }}
 * />
 */
export function StatisticsPanel({
  data,
  disableFoulToggle,
  comparison,
  className = '',
  onZoneFilter,
}: StatisticsPanelProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneType | '7m' | null>(null);

  // Calculate all statistics from events
  const stats = useStatisticsCalculator(data.events, comparison, data.isGoalkeeper, data.foulEvents);



  // Filter events by selected zone
  const filteredEvents = selectedZone
    ? data.events.filter(e => e.zone === selectedZone)
    : data.events;

  const filteredStats = useStatisticsCalculator(filteredEvents, comparison, data.isGoalkeeper, data.foulEvents);



  const handleZoneClick = (zone: ZoneType | '7m' | null) => {
    setSelectedZone(zone);
    onZoneFilter?.(zone);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{data.title}</h2>
        {data.subtitle && <p className="text-sm text-gray-500">{data.subtitle}</p>}
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 gap-4 ${data.isGoalkeeper ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        {data.isGoalkeeper ? (
          <>
            <StatCard
              label="Saves vs. regular shots"
              value={(() => {
                let regularShots = 0;
                let regularConceded = 0;

                filteredStats.zoneStats.forEach((stats, zone) => {
                  if (zone === '7m') return;
                  regularShots += stats.shots;
                  regularConceded += stats.goals;
                });

                const regularSaves = regularShots - regularConceded;
                const efficiency = regularShots > 0 ? (regularSaves / regularShots) * 100 : 0;
                return `${regularSaves}/${regularShots} (${efficiency.toFixed(0)}%)`;
              })()}
              color="blue"
              className="w-full"
            />
            <StatCard
              label="Saves vs. 6m shots"
              value={(() => {
                let shots = 0;
                let conceded = 0;

                filteredStats.zoneStats.forEach((stats, zone) => {
                  if (!zone.startsWith('6m-')) return;
                  shots += stats.shots;
                  conceded += stats.goals;
                });

                const saves = shots - conceded;
                const efficiency = shots > 0 ? (saves / shots) * 100 : 0;
                return `${saves}/${shots} (${efficiency.toFixed(0)}%)`;
              })()}
              color="green"
              className="w-full"
            />
            <StatCard
              label="Saves vs. 9m shots"
              value={(() => {
                let shots = 0;
                let conceded = 0;

                filteredStats.zoneStats.forEach((stats, zone) => {
                  if (!zone.startsWith('9m-')) return;
                  shots += stats.shots;
                  conceded += stats.goals;
                });

                const saves = shots - conceded;
                const efficiency = shots > 0 ? (saves / shots) * 100 : 0;
                return `${saves}/${shots} (${efficiency.toFixed(0)}%)`;
              })()}
              color="orange"
              className="w-full"
            />
            <StatCard
              label="Saves vs. penalty shots"
              value={(() => {
                const penaltyStats = filteredStats.zoneStats.get('7m');
                const penaltyShots = penaltyStats ? penaltyStats.shots : 0;
                const penaltyConceded = penaltyStats ? penaltyStats.goals : 0;
                const penaltySaves = penaltyShots - penaltyConceded;
                const efficiency = penaltyShots > 0 ? (penaltySaves / penaltyShots) * 100 : 0;

                return `${penaltySaves}/${penaltyShots} (${efficiency.toFixed(0)}%)`;
              })()}
              color="purple"
              className="w-full"
            />
          </>
        ) : (
          <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
            <StatCard
              label="Goals vs shots"
              value={`${filteredStats.totalGoals}/${filteredStats.totalShots} (${filteredStats.efficiency.toFixed(0)}%)`}
              color="green"
              className="min-w-fit"
            />
            <StatCard
              label="Goals vs plays"
              value={`${filteredStats.totalGoals} (${filteredStats.goalsPercentage.toFixed(0)}%)`}
              color="green"
              className="min-w-fit"
            />
            <StatCard
              label="Misses vs. plays"
              value={`${filteredStats.totalMisses} (${filteredStats.missesPercentage.toFixed(0)}%)`}
              color="orange"
              className="min-w-fit"
            />
            <StatCard
              label="Turnovers vs. plays"
              value={`${filteredStats.totalTurnovers} (${filteredStats.turnoversPercentage.toFixed(0)}%)`}
              color="yellow"
              className="min-w-fit"
            />
            <StatCard
              label="Fouls vs. plays"
              value={`${filteredStats.totalFouls} (${filteredStats.foulsPercentage.toFixed(0)}%)`}
              color="gray"
              className="min-w-fit"
            />
          </div>
        )}
      </div>

      {/* Heatmaps and Zone Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalHeatmap
          goalTargetStats={filteredStats.goalTargetStats}
          isGoalkeeper={data.isGoalkeeper}
        />
        <ZoneDistribution
          title="Shot Distribution (Goals / Shots)"
          isGoalkeeper={data.isGoalkeeper}
          zoneStats={stats.zoneStats}
          foulZoneStats={data.isGoalkeeper || data.context === 'player' ? undefined : stats.foulZoneStats}
          foulReceivedZoneStats={data.isGoalkeeper ? undefined : stats.foulReceivedZoneStats}
          turnoverZoneStats={data.isGoalkeeper ? undefined : stats.turnoverZoneStats}
          dangerZoneStats={data.isGoalkeeper ? undefined : stats.dangerZoneStats}
          disableFoulToggle={disableFoulToggle}
          onZoneClick={handleZoneClick}
          selectedZone={selectedZone}
        />
      </div>
    </div>
  );
}
