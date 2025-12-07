import type { LucideIcon } from 'lucide-react';

interface SplitToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  leftOption: { label: string; icon: LucideIcon | LucideIcon[] };
  rightOption: { label: string; icon: LucideIcon | LucideIcon[] };
  colorClass: 'purple' | 'orange' | 'cyan';
}

export const SplitToggle = ({
  value,
  onChange,
  leftOption,
  rightOption,
  colorClass
}: SplitToggleProps) => {
  const getStateClasses = (isActive: boolean) => {
    if (!isActive) {
      return `bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300`;
    }
    
    return `bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-200`;
  };

  return (
    <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(false)}
        className={`px-2 py-2.5 font-bold border-r-0 rounded-l-xl transition-all flex flex-col items-center justify-center gap-1.5 ${getStateClasses(!value)}`}
      >
        {Array.isArray(leftOption.icon) ? (
          <div className="flex items-center gap-1">
            {leftOption.icon.map((Icon, idx) => <Icon key={idx} size={20} />)}
          </div>
        ) : (
          <leftOption.icon size={20} />
        )}
        <span className="text-xs uppercase tracking-wider">{leftOption.label}</span>
      </button>

      <button
        onClick={() => onChange(true)}
        className={`px-2 py-2.5 font-bold rounded-r-xl transition-all flex flex-col items-center justify-center gap-1.5 ${getStateClasses(value)}`}
      >
        {Array.isArray(rightOption.icon) ? (
          <div className="flex items-center gap-1">
            {rightOption.icon.map((Icon, idx) => <Icon key={idx} size={20} />)}
          </div>
        ) : (
          <rightOption.icon size={20} />
        )}
        <span className="text-xs uppercase tracking-wider">{rightOption.label}</span>
      </button>
    </div>
  );
};
