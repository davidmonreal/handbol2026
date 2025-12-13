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
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
        {data.context === 'player' ? (
          <>
            <StatCard
              label={data.isGoalkeeper ? "Goals Conceded" : "Goals"}
              value={filteredStats.totalGoals}
              color={data.isGoalkeeper ? "red" : "green"}
            />
            <StatCard label="Shots" value={filteredStats.totalShots} color="blue" />
            <StatCard
              label={data.isGoalkeeper ? "Save %" : "Efficiency"}
              value={`${filteredStats.efficiency.toFixed(1)}%`}
              color={data.isGoalkeeper ? "green" : "purple"}
            />
            <StatCard label="Saves" value={filteredStats.totalSaves} color="yellow" />
            <StatCard label="Misses" value={filteredStats.totalMisses} color="orange" />
            <StatCard label="Posts" value={filteredStats.totalPosts} color="gray" />
          </>
        ) : (
          <>

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
          </>
        )}
      </div>

      {/* Heatmaps and Zone Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalHeatmap
          goalTargetStats={filteredStats.goalTargetStats}
          isGoalkeeper={data.isGoalkeeper}
        />
        <ZoneDistribution
          isGoalkeeper={data.isGoalkeeper}
          zoneStats={stats.zoneStats}
          foulZoneStats={data.context === 'player' ? undefined : stats.foulZoneStats}
          disableFoulToggle={disableFoulToggle}
          onZoneClick={handleZoneClick}
          selectedZone={selectedZone}
        />
      </div>
    </div>
  );
}
