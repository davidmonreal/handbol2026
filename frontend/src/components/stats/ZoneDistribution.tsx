import { useState } from 'react';
import { ZONE_CONFIG, getZoneLabel } from '../../config/zones';
import type { ZoneType } from '../../types';
import type { ZoneDistributionProps } from './types';
import { calculateZoneColors, getHeatmapColorClasses } from './utils/heatmapUtils';

/**
 * ZoneDistribution - Displays shot distribution across court zones
 * Shows 6m line (5 positions), 9m line (3 positions), and 7m penalty
 */
export function ZoneDistribution({
  zoneStats,
  foulZoneStats,
  onZoneClick,
  selectedZone,
  className = '',
  isGoalkeeper = false
}: ZoneDistributionProps) {
  const [mode, setMode] = useState<'goals' | 'fouls'>('goals');

  const activeStats = mode === 'fouls' && foulZoneStats ? foulZoneStats : zoneStats;

  // Combine all stats to calculate relative colors across the whole court
  const zoneColors = calculateZoneColors(
    activeStats,
    mode === 'fouls' ? (stats) => stats.efficiency ?? 0 : (stats) => stats.shots
  );

  const renderZoneButton = (zone: ZoneType | '7m') => {
    const stats = activeStats.get(zone);
    if (!stats) return null; // Should not happen given we init all zones

    const isSelected = selectedZone === zone;

    // Determine color class
    const colorKey = zoneColors.get(zone) || 'default';
    const colorClasses = getHeatmapColorClasses(colorKey);

    const baseClass = onZoneClick
      ? 'cursor-pointer transition-all hover:brightness-95 hover:shadow-md'
      : '';

    const borderClass = isSelected
      ? 'ring-2 ring-indigo-500 z-10' // Highlight selection
      : '';

    // Calculate value to display
    // For GK: Saves = Shots - Goals (since shots includes both)
    // For Player: Goals
    const value = isGoalkeeper ? (stats.shots - stats.goals) : stats.goals;
    const fouls = stats.goals;
    const plays = stats.shots;

    return (
      <button
        key={zone}
        onClick={() => onZoneClick?.(isSelected ? null : zone)}
        disabled={!onZoneClick}
        className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center min-h-[80px] w-full transition-colors ${colorClasses} ${borderClass} ${baseClass}`}
      >
        {mode === 'fouls' ? (
          <>
            <span className="text-xl font-bold">
              {fouls}/{plays}
            </span>
            <span className="text-xs opacity-75">
              {plays > 0 ? `${stats.efficiency.toFixed(0)}% fouls` : '-'}
            </span>
          </>
        ) : (
          <>
            <span className="text-xl font-bold">
              {value}/{stats.shots}
            </span>
            <span className="text-xs opacity-75">
              {stats.shots > 0 ? `${stats.efficiency.toFixed(0)}%` : '-'}
            </span>
          </>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mt-1">
          {getZoneLabel(zone as ZoneType)}
        </span>
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {mode === 'fouls'
            ? 'Foul Distribution (Own court zones)'
            : isGoalkeeper
              ? 'Saves Distribution (Court Zones)'
              : 'Goal Distribution (Rival court zones)'}
        </h3>
        {foulZoneStats && (
          <button
            onClick={() => setMode(mode === 'goals' ? 'fouls' : 'goals')}
            className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mode === 'fouls' ? 'View Goals' : 'View Fouls'}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {/* 6m Line */}
        <div>
          <div className="grid grid-cols-5 gap-2">
            {ZONE_CONFIG.sixMeter.map(({ zone }) => renderZoneButton(zone))}
          </div>
        </div>

        {/* 9m Line */}
        <div>
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            {ZONE_CONFIG.nineMeter.map(({ zone }) => renderZoneButton(zone))}
          </div>
        </div>

        {/* 7m Penalty */}
        <div>
          <div className="max-w-xs mx-auto">
            {renderZoneButton('7m')}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {mode === 'fouls'
          ? 'Viewing fouls by own court zones'
          : (isGoalkeeper ? 'Viewing saves/shots from zone' : 'Viewing goals/shots from rival court zones (shooter perspective)')}
      </p>
    </div>
  );
}
