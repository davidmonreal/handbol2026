import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';

interface ZoneSelectorProps {
  selectedZone: ZoneType | null;
  onZoneSelect: (zone: ZoneType) => void;
  hidePenalty?: boolean;
  variant?: 'default' | 'minimal';
}

export const ZoneSelector = ({ selectedZone, onZoneSelect, hidePenalty = false, variant = 'default' }: ZoneSelectorProps) => {
  const isMinimal = variant === 'minimal';

  const buttonClasses = (zone: ZoneType) => {
    const baseClasses = 'rounded-lg text-xs md:text-sm font-semibold transition-all';
    const selectedClasses = 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300';
    const unselectedClasses = isMinimal
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    const padding = isMinimal ? 'p-2' : 'p-2';

    return `${padding} ${baseClasses} ${selectedZone === zone ? selectedClasses : unselectedClasses}`;
  };

  const content = (
    <div className={isMinimal ? 'space-y-2' : 'space-y-2'}>
      {/* 6m Line */}
      <div className="grid grid-cols-5 gap-2">
        {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
          <button
            key={zone}
            onClick={() => onZoneSelect(zone)}
            className={buttonClasses(zone)}
          >
            {label}
          </button>
        ))}
      </div>
      {/* 9m Line */}
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {ZONE_CONFIG.nineMeter.map(({ zone, label }) => (
          <button
            key={zone}
            onClick={() => onZoneSelect(zone)}
            className={buttonClasses(zone)}
          >
            {label}
          </button>
        ))}
      </div>
      {/* 7m Penalty */}
      {!hidePenalty && (
        <div className="max-w-xs mx-auto">
          <button
            onClick={() => onZoneSelect(ZONE_CONFIG.penalty.zone)}
            className={`w-full ${buttonClasses(ZONE_CONFIG.penalty.zone)}`}
          >
            {ZONE_CONFIG.penalty.label}
          </button>
        </div>
      )}
    </div>
  );

  if (isMinimal) {
    return content;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 animate-fade-in">
      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">Select Zone</h3>
      {content}
    </div>
  );
};
