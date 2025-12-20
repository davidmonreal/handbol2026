import type { SanctionType, TurnoverType, ShotResult } from '../../../types';
import type {
    ShotResultOption,
    TurnoverOption,
    SanctionOption,
} from './actionOptions';

interface ShotResultSelectorProps {
    selectedAction: ShotResult | null;
    results: ShotResultOption[];
    onSelect: (value: ShotResult) => void;
}

export const ShotResultSelector = ({ selectedAction, results, onSelect }: ShotResultSelectorProps) => (
    <div className="grid grid-cols-5 gap-2">
        {results.map(result => {
            const Icon = result.icon;
            return (
                <button
                    key={result.value}
                    onClick={() => onSelect(result.value)}
                    className={`px-2 py-2.5 rounded-lg text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1.5 ${selectedAction === result.value
                        ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300'
                        }`}
                >
                    <Icon size={20} />
                    <span className="text-xs">{result.label}</span>
                </button>
            );
        })}
    </div>
);

interface TurnoverSelectorProps {
    selectedAction: string | null;
    types: TurnoverOption[];
    onSelect: (value: TurnoverType) => void;
    onForceCollective: () => void;
    onForceOpposition: () => void;
}

export const TurnoverSelector = ({
    selectedAction,
    types,
    onSelect,
    onForceCollective,
    onForceOpposition,
}: TurnoverSelectorProps) => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {types.map(type => {
            const Icon = type.icon;
            return (
                <button
                    key={type.value}
                    onClick={() => {
                        onSelect(type.value);
                        if (type.value === 'Pass') onForceCollective();
                        if (type.value === 'Offensive Foul') onForceOpposition();
                    }}
                    className={`px-2 py-2.5 rounded-lg text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1.5 ${selectedAction === type.value
                        ? 'bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300'
                        }`}
                >
                    <Icon size={20} />
                    <span className="text-xs text-center">{type.label}</span>
                </button>
            );
        })}
    </div>
);

interface SanctionSelectorProps {
    selectedAction: string | null;
    sanctions: SanctionOption[];
    onSelect: (value: SanctionType) => void;
    onForceOpposition: () => void;
}

export const SanctionSelector = ({
    selectedAction,
    sanctions,
    onSelect,
    onForceOpposition,
}: SanctionSelectorProps) => (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {sanctions.map(sanction => {
            const isActive = selectedAction === sanction.value;
            return (
                <button
                    key={sanction.value}
                    onClick={() => {
                        onSelect(sanction.value);
                        if (sanction.value === 'Foul') onForceOpposition();
                    }}
                    className={`px-3 py-3 rounded-lg text-sm font-semibold transition-all text-white ${sanction.color} ${isActive
                        ? 'shadow-lg ring-2 ring-offset-1 ring-indigo-200 brightness-110'
                        : 'opacity-30 hover:opacity-90'
                        }`}
                >
                    {sanction.label}
                </button>
            );
        })}
    </div>
);
