import { FileWarning } from 'lucide-react';
import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import { FLOW_CONFIG } from '../../../config/flows';
import { CollapsedStep } from '../shared/CollapsedStep';

interface SanctionFlowProps {
  selectedAction: string | null;
  onActionSelect: (action: string) => void;
  onZoneSelect: (zone: ZoneType) => void;
  onEditSeverity: () => void;
  onFinalizeEvent: (targetIndex?: number, zoneOverride?: ZoneType) => void;
}

export const SanctionFlow = ({
  selectedAction,
  onActionSelect,
  onZoneSelect,
  onEditSeverity,
  onFinalizeEvent
}: SanctionFlowProps) => (
  <div className="space-y-6 animate-fade-in">
    {/* Step 2: Severity */}
    {selectedAction ? (
      <CollapsedStep
        label="Severity"
        value={selectedAction}
        onEdit={onEditSeverity}
        icon={FileWarning}
      />
    ) : (
      <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 animate-fade-in">
        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">2. Select Severity</h3>
        <div className="grid grid-cols-2 gap-3">
          {FLOW_CONFIG.Sanction.actions.map((action) => (
            <button
              key={action}
              onClick={() => onActionSelect(action)}
              className={`p-3 font-bold rounded-lg text-sm hover:opacity-90 ${action === 'Foul' ? 'bg-gray-100 text-gray-800 border-2 border-gray-200 col-span-2' :
                  action === 'Yellow' ? 'bg-yellow-400 text-yellow-900' :
                    action === '2min' ? 'bg-gray-800 text-white' :
                      action === 'Red' ? 'bg-red-600 text-white' :
                        'bg-blue-600 text-white'
                }`}
            >
              {action === 'Foul' ? 'Common Foul' :
                action === '2min' ? '2 Minutes' :
                  action === 'Yellow' ? 'Yellow Card' :
                    action + (action.includes('Card') ? '' : ' Card')}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Step 3: Zone (Only if Severity selected) */}
    {selectedAction && (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-4">3. Select Zone</h3>
        <div className="space-y-3">
          {/* 6m Line */}
          <div className="grid grid-cols-5 gap-2">
            {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
              <button
                key={zone}
                onClick={() => { onZoneSelect(zone); onFinalizeEvent(undefined, zone); }}
                className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white transition-all"
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
                onClick={() => { onZoneSelect(zone); onFinalizeEvent(undefined, zone); }}
                className="p-3 rounded-lg text-xs md:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);
