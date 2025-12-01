import type { GoalHeatmapProps } from './types';

/**
 * GoalHeatmap - Displays the 3x3 grid of goal target zones (1-9)
 * Shows number of goals and efficiency for each zone
 */
export function GoalHeatmap({ goalTargetStats, className = '', isGoalkeeper = false }: GoalHeatmapProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {isGoalkeeper ? 'Saves Distribution (Target Zones)' : 'Goal Distribution (Target Zones)'}
      </h3>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 h-64 relative">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(target => {
          const stats = goalTargetStats.get(target);
          if (!stats) return null;

          const { goals, saves, shots, efficiency } = stats;
          const bgOpacity = Math.min(efficiency / 100, 0.8);

          // For GK show Saves, for Player show Goals
          const value = isGoalkeeper ? saves : goals;

          return (
            <div
              key={target}
              className="border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center relative"
              style={{
                backgroundColor: `rgba(34, 197, 94, ${bgOpacity})`
              }}
            >
              <span className="text-2xl font-bold text-gray-800">{value}</span>
              <span className="text-xs text-gray-600">
                {shots > 0 ? `${efficiency.toFixed(0)}%` : '-'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {isGoalkeeper ? 'Goalkeeper view (saves)' : 'Goal view (shooter perspective)'}
      </p>
    </div>
  );
}
