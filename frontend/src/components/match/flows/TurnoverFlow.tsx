import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import { FLOW_CONFIG } from '../../../config/flows';
import { ZoneSelector } from '../shared/ZoneSelector';

interface TurnoverFlowProps {
  selectedAction: string | null;
  onActionSelect: (action: string) => void;
  onZoneSelect: (zone: ZoneType | null) => void;
  onFinalizeEvent: (targetIndex?: number, zoneOverride?: ZoneType) => void;
}

export const TurnoverFlow = ({
  selectedAction,
  onActionSelect,
  onZoneSelect,
  onFinalizeEvent
}: TurnoverFlowProps) => (
  <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 animate-fade-in">
    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">2. Select Error Type</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {FLOW_CONFIG.Turnover.actions.map((type) => (
        <button
          key={type}
          onClick={() => onActionSelect(type)}
          className={`p-3 rounded-lg font-medium transition-colors text-xs md:text-sm ${selectedAction === type ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
        >
          {type === 'Pass' ? 'Bad Pass' :
            type === 'Catch' ? 'Dropped Ball' :
              type}
        </button>
      ))}
    </div>

    {selectedAction && (
      <div className="mt-6 animate-fade-in">
        {selectedAction === 'Area' ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">3. Where? (Select 6m Zone)</h3>
            <div className="grid grid-cols-5 gap-2">
              {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
                <button
                  key={zone}
                  onClick={() => { onZoneSelect(zone); onFinalizeEvent(undefined, zone); }}
                  className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">3. Where? (Optional)</h3>

            {/* Reuse ZoneSelector component */}
            <ZoneSelector
              selectedZone={null}
              onZoneSelect={(zone) => { onZoneSelect(zone); onFinalizeEvent(undefined, zone); }}
              hidePenalty={true}
              variant="minimal"
            />

            {/* Skip button */}
            <button
              onClick={() => { onZoneSelect(null); onFinalizeEvent(); }}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Skip (Midfield / Unknown)
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);
