import { Target, Check, User, Activity, ArrowUp, ArrowLeftRight, Users } from 'lucide-react';
import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import { FLOW_CONFIG } from '../../../config/flows';
import { CollapsedStep } from '../shared/CollapsedStep';
import { ZoneSelector } from '../shared/ZoneSelector';
import { SplitToggle } from '../shared/SplitToggle';

interface ShotFlowProps {
  selectedZone: ZoneType | null;
  selectedAction: string | null;
  isCollective: boolean;
  hasOpposition: boolean;
  isCounterAttack: boolean;
  onZoneSelect: (zone: ZoneType) => void;
  onActionSelect: (action: string) => void;
  onToggleCollective: () => void;
  onToggleOpposition: () => void;
  onToggleCounter: () => void;
  onEditZone: () => void;
  onEditResult: () => void;
  onFinalizeEvent: (targetIndex?: number) => void;
}

export const ShotFlow = ({
  selectedZone,
  selectedAction,
  isCollective,
  hasOpposition,
  isCounterAttack,
  onZoneSelect,
  onActionSelect,
  onToggleCollective,
  onToggleOpposition,
  onToggleCounter,
  onEditZone,
  onEditResult,
  onFinalizeEvent
}: ShotFlowProps) => (
  <div className="space-y-6 animate-fade-in">
    {/* Zone Selection */}
    {selectedZone ? (
      <CollapsedStep
        label="Zone"
        value={ZONE_CONFIG.sixMeter.find(z => z.zone === selectedZone)?.label ||
          ZONE_CONFIG.nineMeter.find(z => z.zone === selectedZone)?.label ||
          ZONE_CONFIG.penalty.label}
        onEdit={onEditZone}
        icon={Activity}
      />
    ) : (
      <ZoneSelector selectedZone={selectedZone} onZoneSelect={onZoneSelect} />
    )}

    {/* Context & Result */}
    {/* Context & Result */}
    {selectedZone && (
      <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 animate-fade-in">
        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3">3. Context & Result</h3>

        {selectedAction === 'Goal' ? (
          <div className="mb-4">
            <CollapsedStep
              label="Result"
              value="Goal (Select Target)"
              onEdit={onEditResult}
              icon={Target}
            />
          </div>
        ) : (
          <>
            {/* Context Toggles - Driven by Config */}
            {FLOW_CONFIG.Shot.showContext(selectedZone) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <SplitToggle
                  value={isCollective}
                  onChange={(val) => !val ? onToggleCollective() : onToggleCollective()} // Toggle logic needs to match boolean
                  leftOption={{ label: 'Individual', icon: User }}
                  rightOption={{ label: 'Collective', icon: Users }}
                />

                <SplitToggle
                  value={hasOpposition}
                  onChange={(val) => !val ? onToggleOpposition() : onToggleOpposition()}
                  leftOption={{ label: 'Free', icon: User }}
                  rightOption={{ label: 'Opposition', icon: [User, Users] }}
                />

                <SplitToggle
                  value={isCounterAttack}
                  onChange={(val) => !val ? onToggleCounter() : onToggleCounter()}
                  leftOption={{ label: 'Static', icon: ArrowLeftRight }}
                  rightOption={{ label: 'Counter', icon: ArrowUp }}
                />
              </div>
            )}

            {/* Result Buttons - Driven by Config */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {FLOW_CONFIG.Shot.getAvailableActions(selectedZone).map((action) => (
                <button
                  key={action}
                  onClick={() => onActionSelect(action)}
                  className={`p-2 rounded-lg font-bold text-xs ${selectedAction === action ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Goal Grid - Show for Goal and Save */}
        {(selectedAction === 'Goal' || selectedAction === 'Save') && (
          <div className="animate-fade-in">
            <h4 className="text-xs font-bold text-gray-500 mb-2 text-center">
              {selectedAction === 'Goal' ? 'Select Target to Confirm' : 'Select Shot Target (Saved)'}
            </h4>
            <div className="max-w-[180px] mx-auto aspect-square bg-gray-100 rounded-lg p-2 border-4 border-gray-200">
              <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => (
                  <button
                    key={target}
                    onClick={() => onFinalizeEvent(target)}
                    className="bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-md transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confirm button - Only for non-Goal and non-Save actions */}
        {selectedAction && selectedAction !== 'Goal' && selectedAction !== 'Save' && (
          <div className="animate-fade-in mt-4">
            <button
              onClick={() => onFinalizeEvent()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-base shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Confirm {selectedAction}
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);
