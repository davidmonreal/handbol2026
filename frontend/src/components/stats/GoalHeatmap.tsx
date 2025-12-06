import { useMemo } from 'react';
import type { GoalHeatmapProps } from './types';
import { calculateZoneColors, getHeatmapColorClasses } from './utils/heatmapUtils';

/**
 * GoalHeatmap - Displays the 3x3 grid of goal target zones (1-9)
 * Shows number of goals/saves and shots for each zone
 */
export function GoalHeatmap({ goalTargetStats, className = '', isGoalkeeper = false }: GoalHeatmapProps) {

  // Calculate colors based on distribution
  const zoneColors = useMemo(() => {
    return calculateZoneColors(goalTargetStats);
  }, [goalTargetStats]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {isGoalkeeper ? 'Saves Distribution (Target Zones)' : 'Goal Distribution (Target Zones)'}
      </h3>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 h-64 relative">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(target => {
          const stats = goalTargetStats.get(target);
          if (!stats) return (
            <div key={target} className="border-2 border-gray-100 bg-gray-50 rounded-lg" />
          );

          const { goals, saves, shots, efficiency } = stats;

          // For GK show Saves, for Player show Goals
          const numerator = isGoalkeeper ? saves : goals;

          // Determine color
          const colorKey = zoneColors.get(target) || 'default';
          const colorClasses = getHeatmapColorClasses(colorKey);

          return (
            <div
              key={target}
              className={`border-2 rounded-lg flex flex-col items-center justify-center relative transition-colors ${colorClasses}`}
            >
              <span className="text-xl font-bold">
                {numerator}/{shots}
              </span>
              <span className="text-xs opacity-75">
                {shots > 0 ? `${efficiency.toFixed(0)}%` : '-'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isGoalkeeper ? 'Goalkeeper view (saves/shots)' : 'Goal view (shooter perspective, goals/shots)'}
      </p>
    </div>
  );
}
