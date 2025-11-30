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
    return (
      <CollapsedStep 
        label="Category" 
        value={flowType} 
        onEdit={onEditFlow}
        icon={flowType === 'Shot' ? Target : flowType === 'Turnover' ? AlertTriangle : FileWarning}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Activity size={20} /> 1. Select Category
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onFlowSelect('Shot')}
          className="p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <Target size={24} className="md:w-8 md:h-8" />
          Shot
        </button>
        <button
          onClick={() => onFlowSelect('Turnover')}
          className="p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <AlertTriangle size={24} className="md:w-8 md:h-8" />
          Turnover
        </button>
        <button
          onClick={() => onFlowSelect('Sanction')}
          className="p-4 md:p-6 rounded-xl font-bold text-sm md:text-xl flex flex-col items-center gap-2 transition-all bg-gray-50 text-gray-700 hover:bg-gray-100"
        >
          <FileWarning size={24} className="md:w-8 md:h-8" />
          Foul
        </button>
      </div>
    </div>
  );
};
