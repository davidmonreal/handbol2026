import { Target, Check, Users, User, Shield, Unlock, Zap, Anchor, Activity } from 'lucide-react';
import type { ZoneType } from '../../../types';
import { ZONE_CONFIG } from '../../../config/zones';
import { FLOW_CONFIG } from '../../../config/flows';
import { CollapsedStep } from '../shared/CollapsedStep';
import { ZoneSelector } from '../shared/ZoneSelector';

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
    {selectedZone && (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-4">3. Context & Result</h3>
        
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
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={onToggleCollective}
                  className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                    isCollective 
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md' 
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isCollective ? <Users size={24} /> : <User size={24} />}
                  <span className="text-xs uppercase tracking-wider">{isCollective ? 'Collective' : 'Individual'}</span>
                </button>
                
                <button
                  onClick={onToggleOpposition}
                  className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                    hasOpposition 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' 
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {hasOpposition ? <Shield size={24} /> : <Unlock size={24} />}
                  <span className="text-xs uppercase tracking-wider">{hasOpposition ? 'Opposition' : 'Free'}</span>
                </button>
                
                <button
                  onClick={onToggleCounter}
                  className={`p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${
                    isCounterAttack 
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md' 
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isCounterAttack ? <Zap size={24} /> : <Anchor size={24} />}
                  <span className="text-xs uppercase tracking-wider">{isCounterAttack ? 'Counter' : 'Static'}</span>
                </button>
              </div>
            )}

            {/* Result Buttons - Driven by Config */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {FLOW_CONFIG.Shot.getAvailableActions(selectedZone).map((action) => (
                <button
                  key={action}
                  onClick={() => onActionSelect(action)}
                  className={`p-2 md:p-3 rounded-lg font-bold text-xs md:text-sm ${
                    selectedAction === action ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Goal Grid */}
        {selectedAction === 'Goal' && (
          <div className="animate-fade-in">
            <h4 className="text-sm font-bold text-gray-500 mb-2 text-center">Select Target to Confirm</h4>
            <div className="max-w-[200px] mx-auto aspect-square bg-gray-100 rounded-lg p-2 border-4 border-gray-200">
              <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
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
        
        {/* Confirm button */}
        {selectedAction && selectedAction !== 'Goal' && (
          <div className="animate-fade-in mt-4">
            <button 
              onClick={() => onFinalizeEvent()}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={24} />
              Confirm {selectedAction}
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);
