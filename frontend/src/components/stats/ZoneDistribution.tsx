import { useMemo } from 'react';
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
  onZoneClick,
  selectedZone,
  className = '',
  isGoalkeeper = false
}: ZoneDistributionProps) {
  // Combine all stats to calculate relative colors across the whole court
  const zoneColors = useMemo(() => {
    return calculateZoneColors(zoneStats);
  }, [zoneStats]);

  const renderZoneButton = (zone: ZoneType | '7m') => {
    const stats = zoneStats.get(zone);
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

    return (
      <button
        key={zone}
        onClick={() => onZoneClick?.(isSelected ? null : zone)}
        disabled={!onZoneClick}
        className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center min-h-[80px] w-full transition-colors ${colorClasses} ${borderClass} ${baseClass}`}
      >
        <span className="text-xl font-bold">
          {value}/{stats.shots}
        </span>
        <span className="text-xs opacity-75">
          {stats.shots > 0 ? `${stats.efficiency.toFixed(0)}%` : '-'}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 mt-1">
          {getZoneLabel(zone as ZoneType)}
        </span>
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {isGoalkeeper ? 'Saves Distribution (Court Zones)' : 'Goal Distribution (Court Zones)'}
      </h3>
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
        {isGoalkeeper ? 'Viewing saves/shots from zone' : 'Viewing goals/shots from zone (shooter perspective)'}
      </p>
    </div>
  );
}
