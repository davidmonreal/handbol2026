import { useMemo, useState } from 'react';
import type { GoalHeatmapProps } from './types';
import { calculateZoneColors, getHeatmapColorClasses } from './utils/heatmapUtils';

/**
 * GoalHeatmap - Displays the 3x3 grid of goal target zones (1-9)
 * Shows number of goals/saves and shots for each zone
 */
export function GoalHeatmap({ goalTargetStats, className = '', isGoalkeeper = false }: GoalHeatmapProps) {
  const [colorMode, setColorMode] = useState<'shots' | 'goals'>('shots');

  // Calculate colors based on distribution
  const zoneColors = useMemo(() => {
    return calculateZoneColors(
      goalTargetStats,
      (stats) => {
        if (colorMode === 'shots') return stats.shots;
        // For GK "goals" mode means "saves", for Player it means "goals"
        return isGoalkeeper ? stats.saves : stats.goals;
      }
    );
  }, [goalTargetStats, colorMode, isGoalkeeper]);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {isGoalkeeper ? 'Saves Distribution' : 'Goal Distribution'}
        </h3>

        {/* Toggle Color Mode */}
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-medium">
          <button
            onClick={() => setColorMode('shots')}
            className={`px-3 py-1.5 rounded-md transition-all ${colorMode === 'shots'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            By Shots
          </button>
          <button
            onClick={() => setColorMode('goals')}
            className={`px-3 py-1.5 rounded-md transition-all ${colorMode === 'goals'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {isGoalkeeper ? 'By Saves' : 'By Goals'}
          </button>
        </div>
      </div>

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
        {colorMode === 'shots'
          ? 'Color intensity based on shot volume'
          : (isGoalkeeper ? 'Color intensity based on number of saves' : 'Color intensity based on number of goals')
        }
      </p>
    </div>
  );
}
