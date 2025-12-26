import { useState, useEffect } from 'react';
import { Triangle } from 'lucide-react';
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
  foulReceivedZoneStats,
  dangerZoneStats,
  zoneBaselines,
  disableFoulToggle,
  onZoneClick,
  selectedZone,
  className = '',
  isGoalkeeper = false,
  title
}: ZoneDistributionProps) {
  const [mode, setMode] = useState<'flow' | 'goals' | 'defense' | 'fouls'>(isGoalkeeper ? 'goals' : 'flow');

  useEffect(() => {
    if (isGoalkeeper && mode !== 'goals') {
      setMode('goals');
    }
  }, [isGoalkeeper, mode]);

  const activeStats = (() => {
    switch (mode) {
      case 'defense': return foulZoneStats || zoneStats;
      case 'fouls': return foulReceivedZoneStats || zoneStats;
      case 'flow': return dangerZoneStats || zoneStats;
      default: return zoneStats;
    }
  })();

  // Combine all stats to calculate relative colors across the whole court
  const zoneColors = calculateZoneColors(
    activeStats,
    (mode === 'goals' || mode === 'flow')
      ? (stats) => stats.shots
      : (mode === 'fouls'
        ? (stats) => stats.goals
        : (stats) => stats.efficiency ?? 0)
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
    // In Flow mode, numerator = goals, denominator = total plays
    const value = isGoalkeeper ? (stats.shots - stats.goals) : stats.goals;
    const numerator = stats.goals;
    const denominator = stats.shots;
    const ratio = denominator > 0 ? numerator / denominator : null;
    const baseline = (() => {
      if (!zoneBaselines || isGoalkeeper) return null;
      if (mode === 'flow') return zoneBaselines.goalsVsPlays.get(zone) ?? null;
      if (mode === 'fouls') return zoneBaselines.foulsVsPlays.get(zone) ?? null;
      if (mode === 'defense') return zoneBaselines.defenseFoulsVsPlays.get(zone) ?? null;
      return zoneBaselines.goalsVsShots.get(zone) ?? null;
    })();
    const trend = ratio != null && baseline != null
      ? Math.abs(ratio - baseline) < 0.0001
        ? null
        : ratio > baseline
          ? 'up'
          : 'down'
      : null;
    const showTrend = !(mode === 'fouls' && zone === '7m');

    return (
      <button
        key={zone}
        onClick={() => onZoneClick?.(isSelected ? null : zone)}
        disabled={!onZoneClick}
        className={`p-2 rounded-lg border-2 flex flex-col items-center justify-center min-h-[80px] w-full transition-colors ${colorClasses} ${borderClass} ${baseClass}`}
      >
        {mode === 'goals' ? (
          <>
            <span className="text-xl font-bold inline-flex items-baseline">
              {value}/{stats.shots}
              {trend && showTrend && !isGoalkeeper && (
                <span
                  className={`ml-1 inline-flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                  aria-hidden="true"
                >
                  <Triangle
                    className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`}
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
            <span className="text-xs opacity-75">
              {stats.shots > 0 ? `${stats.efficiency.toFixed(0)}%` : '-'}
            </span>
          </>
        ) : (
          <>
            <span className="text-xl font-bold inline-flex items-baseline">
              {numerator}/{denominator}
              {trend && showTrend && !isGoalkeeper && (
                <span
                  className={`ml-1 inline-flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                  aria-hidden="true"
                >
                  <Triangle
                    className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`}
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
            <span className="text-xs opacity-75">
              {denominator > 0
                ? `${stats.efficiency.toFixed(0)}% ${mode === 'flow' ? 'danger' : (mode === 'fouls' ? 'fouls' : 'fouls')}`
                : '-'}
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
          {(() => {
            const fullTitle = (() => {
              switch (mode) {
                case 'defense': return 'Defense (Own court zones)';
                case 'fouls': return 'Fouls Received (Fouls / Plays)';
                case 'flow': return 'Flow (Goals / Plays)';
                default: return title || (isGoalkeeper
                  ? 'Saves Distribution (Court Zones)'
                  : 'Goal Distribution (Rival court zones)');
              }
            })();

            const parts = fullTitle.split(' (');
            return (
              <>
                {parts[0]}
                {parts[1] && <span className="font-normal text-gray-500"> ({parts[1]}</span>}
              </>
            );
          })()}
        </h3>

        {/* View Toggles */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {!isGoalkeeper && dangerZoneStats && (
            <button
              onClick={() => setMode('flow')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'flow'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Flow
            </button>
          )}

          <button
            onClick={() => setMode('goals')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'goals'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Shots
          </button>

          {!isGoalkeeper && foulReceivedZoneStats && (
            <button
              onClick={() => setMode('fouls')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${mode === 'fouls'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Fouls
            </button>
          )}

          {!isGoalkeeper && foulZoneStats && (
            <button
              onClick={() => setMode('defense')}
              disabled={disableFoulToggle}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${disableFoulToggle
                ? 'text-gray-300 cursor-not-allowed'
                : mode === 'defense'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Defense
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {/* Row 1: 6M Line */}
        <div className="grid grid-cols-5 gap-2">
          {ZONE_CONFIG.sixMeter.map(({ zone }) => renderZoneButton(zone))}
        </div>

        {/* Row 2: 9M Line */}
        <div className="grid grid-cols-3 gap-2 px-8">
          {ZONE_CONFIG.nineMeter.map(({ zone }) => renderZoneButton(zone))}
        </div>

        {/* Row 3: Penalty */}
        <div className="flex justify-center">
          <div className="w-1/3">
            {renderZoneButton(ZONE_CONFIG.penalty.zone)}
          </div>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-400">
        <div className="text-center">
          {(() => {
            switch (mode) {
              case 'defense': return 'Viewing defensive fouls / total attacks against us in zone';
              case 'fouls': return 'Viewing fouls received / (fouls + shots) in zone';
              case 'flow': return 'Viewing goals / total offensive plays in zone';
              default: return isGoalkeeper ? 'Viewing saves/shots from zone' : 'Viewing goals/shots from rival court zones (shooter perspective)';
            }
          })()}
        </div>
      </div>
    </div>
  );
}
