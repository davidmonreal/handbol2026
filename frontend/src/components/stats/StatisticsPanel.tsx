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
  comparison,
  className = '',
  onZoneFilter,
}: StatisticsPanelProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneType | '7m' | null>(null);

  // Calculate all statistics from events
  const stats = useStatisticsCalculator(data.events, comparison);
  
  console.log('[StatisticsPanel] Received data:', {
    eventsCount: data.events.length,
    eventCategories: data.events.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {}),
    sampleEvents: data.events.slice(0, 3)
  });

  // Filter events by selected zone
  const filteredEvents = selectedZone
    ? data.events.filter(e => e.zone === selectedZone)
    : data.events;

  const filteredStats = useStatisticsCalculator(filteredEvents, comparison);
  
  console.log('[StatisticsPanel] Stats comparison:', {
    unfilteredStats: {
      totalShots: stats.totalShots,
      totalGoals: stats.totalGoals,
      efficiency: stats.efficiency
    },
    filteredStats: {
      totalShots: filteredStats.totalShots,
      totalGoals: filteredStats.totalGoals,
      efficiency: filteredStats.efficiency
    }
  });

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Shots" value={filteredStats.totalShots} color="blue" />
        <StatCard label="Goals" value={filteredStats.totalGoals} color="green" />
        <StatCard
          label="Efficiency"
          value={`${filteredStats.efficiency.toFixed(1)}%`}
          color="purple"
        />
        <StatCard label="Saves" value={filteredStats.totalSaves} color="yellow" />
        <StatCard label="Misses" value={filteredStats.totalMisses} color="orange" />
        <StatCard label="Posts" value={filteredStats.totalPosts} color="gray" />
      </div>

      {/* Heatmaps and Zone Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalHeatmap goalTargetStats={filteredStats.goalTargetStats} />
        <ZoneDistribution
          zoneStats={stats.zoneStats}
          totalShots={stats.totalShots}
          onZoneClick={handleZoneClick}
          selectedZone={selectedZone}
        />
      </div>
    </div>
  );
}
