import { Activity, Target, AlertTriangle, FileWarning } from 'lucide-react';
import type { FlowType } from '../../types';
import { CollapsedStep } from './shared/CollapsedStep';

interface FlowSelectorProps {
  flowType: FlowType;
  onFlowSelect: (type: FlowType) => void;
  onEditFlow: () => void;
}

export const FlowSelector = ({ flowType, onFlowSelect, onEditFlow }: FlowSelectorProps) => {
  if (flowType) {
    const flowLabel = flowType === 'Sanction' ? 'Foul' : flowType === 'Shot' ? 'Shot' : flowType;
    return (
      <CollapsedStep
        label="Category"
        value={flowLabel}
        onEdit={onEditFlow}
        icon={flowType === 'Shot' ? Target : flowType === 'Turnover' ? AlertTriangle : FileWarning}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 animate-fade-in">
      <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Activity size={18} /> 1. Select Category
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onFlowSelect('Shot')}
          className="p-3 md:p-4 rounded-xl font-bold text-xs md:text-base flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <Target size={20} className="md:w-6 md:h-6" />
          Shot
        </button>
        <button
          onClick={() => onFlowSelect('Sanction')}
          className="p-3 md:p-4 rounded-xl font-bold text-xs md:text-base flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <FileWarning size={20} className="md:w-6 md:h-6" />
          Foul
        </button>
        <button
          onClick={() => onFlowSelect('Turnover')}
          className="p-3 md:p-4 rounded-xl font-bold text-xs md:text-base flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <AlertTriangle size={20} className="md:w-6 md:h-6" />
          Turnover
        </button>
      </div>
    </div>
  );
};
