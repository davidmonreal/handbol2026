import type { LucideIcon } from 'lucide-react';

interface SplitToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  leftOption: { label: string; icon: LucideIcon | LucideIcon[] };
  rightOption: { label: string; icon: LucideIcon | LucideIcon[] };
  leftValue?: boolean;
  rightValue?: boolean;
  colorClass?: 'purple' | 'orange' | 'cyan';
}

export const SplitToggle = ({
  value,
  onChange,
  leftOption,
  rightOption,
  leftValue = false,
  rightValue = true,
  colorClass = 'purple',
}: SplitToggleProps) => {
  const colorStyles: Record<'purple' | 'orange' | 'cyan', { active: string; inactive: string; border: string }> = {
    purple: {
      active: 'bg-purple-50 text-purple-700',
      inactive: 'bg-gray-50 text-gray-400',
      border: 'border-purple-500',
    },
    orange: {
      active: 'bg-orange-50 text-orange-700',
      inactive: 'bg-gray-50 text-gray-400',
      border: 'border-orange-500',
    },
    cyan: {
      active: 'bg-cyan-50 text-cyan-700',
      inactive: 'bg-gray-50 text-gray-400',
      border: 'border-cyan-500',
    },
  };

  const getStateClasses = (isActive: boolean) => {
    const palette = colorStyles[colorClass];
    if (!isActive) {
      return `${palette.inactive} ${palette.border} border-2`;
    }
    
    return `${palette.active} ${palette.border}`;
  };

  const isLeftActive = value === leftValue;
  const isRightActive = value === rightValue;

  return (
    <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(leftValue)}
        className={`px-2 py-2.5 font-bold border border-r-0 rounded-l-xl transition-all flex flex-col items-center justify-center gap-1.5 ${getStateClasses(isLeftActive)}`}
      >
        {Array.isArray(leftOption.icon) ? (
          <div className="flex items-center gap-1">
            {leftOption.icon.map((Icon, idx) => <Icon key={idx} size={20} />)}
          </div>
        ) : (
          <leftOption.icon size={20} />
        )}
        <span className="text-xs capitalize tracking-wide">{leftOption.label}</span>
      </button>

      <button
        onClick={() => onChange(rightValue)}
        className={`px-2 py-2.5 font-bold border rounded-r-xl transition-all flex flex-col items-center justify-center gap-1.5 ${getStateClasses(isRightActive)}`}
      >
        {Array.isArray(rightOption.icon) ? (
          <div className="flex items-center gap-1">
            {rightOption.icon.map((Icon, idx) => <Icon key={idx} size={20} />)}
          </div>
        ) : (
          <rightOption.icon size={20} />
        )}
        <span className="text-xs capitalize tracking-wide">{rightOption.label}</span>
      </button>
    </div>
  );
};
