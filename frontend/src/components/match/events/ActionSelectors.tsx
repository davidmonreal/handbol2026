import type { ComponentType } from 'react';
import {
    Target,
    Hand,
    Wind,
    Goal as GoalIcon,
    Ban,
    Shuffle,
    UserX,
    Footprints,
    Square,
} from 'lucide-react';
import type { SanctionType, TurnoverType } from '../../../types';

export interface ShotResult {
    value: string;
    label: string;
    icon: ComponentType<{ size?: number }>;
}

export interface TurnoverOption {
    value: TurnoverType;
    label: string;
    icon: ComponentType<{ size?: number }>;
}

export interface SanctionOption {
    value: SanctionType;
    label: string;
    color: string;
}

export const buildShotResults = (t: (key: string) => string): ShotResult[] => [
    { value: 'Goal', label: t('eventForm.result.goal'), icon: Target },
    { value: 'Save', label: t('eventForm.result.save'), icon: Hand },
    { value: 'Miss', label: t('eventForm.result.miss'), icon: Wind },
    { value: 'Post', label: t('eventForm.result.post'), icon: GoalIcon },
    { value: 'Block', label: t('eventForm.result.block'), icon: Ban },
];

export const buildTurnoverTypes = (t: (key: string) => string): TurnoverOption[] => [
    { value: 'Pass', label: t('eventForm.turnover.badPass'), icon: Shuffle },
    { value: 'Catch', label: t('eventForm.turnover.droppedBall'), icon: Hand },
    { value: 'Offensive Foul', label: t('eventForm.turnover.offensiveFoul'), icon: UserX },
    { value: 'Steps', label: t('eventForm.turnover.steps'), icon: Footprints },
    { value: 'Area', label: t('eventForm.turnover.area'), icon: Square },
];

export const buildSanctionTypes = (t: (key: string) => string): SanctionOption[] => [
    { value: 'Foul', label: t('eventForm.sanction.commonFoul'), color: 'bg-gray-600' },
    { value: '2min', label: t('eventForm.sanction.twoMinutes'), color: 'bg-blue-600' },
    { value: 'Yellow', label: t('eventForm.sanction.yellow'), color: 'bg-yellow-500' },
    { value: 'Red', label: t('eventForm.sanction.red'), color: 'bg-red-600' },
    { value: 'Blue Card', label: t('eventForm.sanction.blue'), color: 'bg-blue-800' },
];

interface ShotResultSelectorProps {
    selectedAction: string | null;
    results: ShotResult[];
    onSelect: (value: string) => void;
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
                        : 'opacity-60 hover:opacity-90'
                        }`}
                >
                    {sanction.label}
                </button>
            );
        })}
    </div>
);
