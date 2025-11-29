import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';

interface ZoneSelectorProps {
  selectedZone: ZoneType | null;
  onZoneSelect: (zone: ZoneType) => void;
  hidePenalty?: boolean;
}

export const ZoneSelector = ({ selectedZone, onZoneSelect, hidePenalty = false }: ZoneSelectorProps) => (
  <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Select Zone</h3>
    <div className="space-y-3">
      {/* 6m Line */}
      <div className="grid grid-cols-5 gap-2">
        {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
          <button
            key={zone}
            onClick={() => onZoneSelect(zone)}
            className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              selectedZone === zone 
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
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
            className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              selectedZone === zone 
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
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
            className={`w-full p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              selectedZone === ZONE_CONFIG.penalty.zone 
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {ZONE_CONFIG.penalty.label}
          </button>
        </div>
      )}
    </div>
  </div>
);
