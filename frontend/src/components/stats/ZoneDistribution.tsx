import { ZONE_CONFIG } from '../../config/zones';
import type { ZoneDistributionProps } from './types';

/**
 * ZoneDistribution - Displays shot distribution across court zones
 * Shows 6m line (5 positions), 9m line (3 positions), and 7m penalty
 */
export function ZoneDistribution({
  zoneStats,
  totalShots,
  onZoneClick,
  selectedZone,
  className = ''
}: ZoneDistributionProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">Shot Distribution (Court Zones)</h3>
      <div className="space-y-3">
        {/* 6m Line */}
        <div>
          <div className="grid grid-cols-5 gap-2">
            {ZONE_CONFIG.sixMeter.map(({ zone, label }) => {
              const stats = zoneStats.get(zone);
              if (!stats) return null;

              const percentage = totalShots > 0 ? Math.round((stats.shots / totalShots) * 100) : 0;
              const isSelected = selectedZone === zone;

              const baseClass = onZoneClick
                ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300'
                : '';
              
              const borderClass = isSelected
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 bg-gray-50';

              return (
                <button
                  key={zone}
                  onClick={() => onZoneClick?.(isSelected ? null : zone)}
                  disabled={!onZoneClick}
                  className={`p-3 rounded-lg border-2 ${borderClass} ${baseClass} flex flex-col items-center transition-all`}
                >
                  <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                  <span className="text-xs text-gray-400">({stats.shots})</span>
                  {stats.shots > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      {stats.efficiency.toFixed(0)}% eff
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 9m Line */}
        <div>
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            {ZONE_CONFIG.nineMeter.map(({ zone, label }) => {
              const stats = zoneStats.get(zone);
              if (!stats) return null;

              const percentage = totalShots > 0 ? Math.round((stats.shots / totalShots) * 100) : 0;
              const isSelected = selectedZone === zone;

              const baseClass = onZoneClick
                ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300'
                : '';
              
              const borderClass = isSelected
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 bg-gray-50';

              return (
                <button
                  key={zone}
                  onClick={() => onZoneClick?.(isSelected ? null : zone)}
                  disabled={!onZoneClick}
                  className={`p-3 rounded-lg border-2 ${borderClass} ${baseClass} flex flex-col items-center transition-all`}
                >
                  <span className="text-xs font-bold text-gray-500 mb-1">{label}</span>
                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                  <span className="text-xs text-gray-400">({stats.shots})</span>
                  {stats.shots > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      {stats.efficiency.toFixed(0)}% eff
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7m Penalty */}
        <div>
          <div className="max-w-xs mx-auto">
            {(() => {
              const stats = zoneStats.get('7m');
              if (!stats) return null;

              const percentage = totalShots > 0 ? Math.round((stats.shots / totalShots) * 100) : 0;
              const isSelected = selectedZone === '7m';

              const baseClass = onZoneClick
                ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300'
                : '';
              
              const borderClass = isSelected
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 bg-gray-50';

              return (
                <button
                  onClick={() => onZoneClick?.(isSelected ? null : '7m')}
                  disabled={!onZoneClick}
                  className={`p-3 rounded-lg border-2 ${borderClass} ${baseClass} flex flex-col items-center transition-all w-full`}
                >
                  <span className="text-xs font-bold text-gray-500 mb-1">{ZONE_CONFIG.penalty.label}</span>
                  <span className="text-xl font-bold text-gray-800">{percentage}%</span>
                  <span className="text-xs text-gray-400">({stats.shots})</span>
                  {stats.shots > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      {stats.efficiency.toFixed(0)}% eff
                    </span>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
