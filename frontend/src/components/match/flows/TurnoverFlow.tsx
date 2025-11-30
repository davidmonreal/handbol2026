import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import { FLOW_CONFIG } from '../../../config/flows';

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
  <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
    <h3 className="text-lg font-bold text-gray-800 mb-4">2. Select Error Type</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {FLOW_CONFIG.Turnover.actions.map((type) => (
        <button
          key={type}
          onClick={() => onActionSelect(type)}
          className={`p-4 rounded-lg font-medium transition-colors text-sm md:text-base ${
            selectedAction === type ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {type}
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
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-4">3. Where? (Optional)</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => { onZoneSelect('9m-CB'); onFinalizeEvent(undefined, '9m-CB'); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-sm">9m Area</button>
              <button onClick={() => { onZoneSelect('6m-CB'); onFinalizeEvent(undefined, '6m-CB'); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded text-sm">6m Area</button>
              <button onClick={() => { onZoneSelect(null); onFinalizeEvent(); }} className="p-3 border-2 border-gray-200 rounded text-gray-500 text-sm">Skip</button>
            </div>
          </>
        )}
      </div>
    )}
  </div>
);
