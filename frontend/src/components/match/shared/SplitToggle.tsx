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
  const getBorderColor = () => {
    switch (colorClass) {
      case 'purple': return 'border-purple-500';
      case 'orange': return 'border-orange-500';
      case 'cyan': return 'border-cyan-500';
      default: return 'border-gray-200';
    }
  };

  const getStateClasses = (isActive: boolean) => {
    const borderColor = getBorderColor();
    
    if (!isActive) {
      return `${borderColor} bg-gray-50 text-gray-400 hover:bg-gray-100`;
    }
    
    switch (colorClass) {
      case 'purple':
        return `${borderColor} bg-purple-50 text-purple-700 shadow-sm`;
      case 'orange':
        return `${borderColor} bg-orange-50 text-orange-700 shadow-sm`;
      case 'cyan':
        return `${borderColor} bg-cyan-50 text-cyan-700 shadow-sm`;
      default:
        return `${borderColor} bg-gray-50 text-gray-400`;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(false)}
        className={`p-4 font-bold border-2 border-r-0 rounded-l-xl transition-all flex flex-col items-center gap-2 ${getStateClasses(!value)}`}
      >
        {Array.isArray(leftOption.icon) ? (
          <div className="flex items-center gap-1">
            {leftOption.icon.map((Icon, idx) => <Icon key={idx} size={24} />)}
          </div>
        ) : (
          <leftOption.icon size={24} />
        )}
        <span className="text-xs uppercase tracking-wider">{leftOption.label}</span>
      </button>

      <button
        onClick={() => onChange(true)}
        className={`p-4 font-bold border-2 rounded-r-xl transition-all flex flex-col items-center gap-2 ${getStateClasses(value)}`}
      >
        {Array.isArray(rightOption.icon) ? (
          <div className="flex items-center gap-1">
            {rightOption.icon.map((Icon, idx) => <Icon key={idx} size={24} />)}
          </div>
        ) : (
          <rightOption.icon size={24} />
        )}
        <span className="text-xs uppercase tracking-wider">{rightOption.label}</span>
      </button>
    </div>
  );
};
