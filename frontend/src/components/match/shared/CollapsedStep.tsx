import { Check, Edit2 } from 'lucide-react';

interface CollapsedStepProps {
  label: string;
  value: string;
  onEdit: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const CollapsedStep = ({ 
  label, 
  value, 
  onEdit,
  icon: Icon
}: CollapsedStepProps) => (
  <div 
    onClick={onEdit}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group animate-fade-in"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-green-100 text-green-700 rounded-lg">
        <Check size={16} />
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium uppercase">{label}</div>
        <div className="font-bold text-gray-800 flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          {value}
        </div>
      </div>
    </div>
    <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
      <Edit2 size={16} />
    </div>
  </div>
);
