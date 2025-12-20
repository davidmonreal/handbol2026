import type { ShotResult, TurnoverType, SanctionType } from '../../../../types';
import type { Translator } from './types';

type GoalTargetGridProps = {
    selectedAction: ShotResult | TurnoverType | SanctionType | null;
    selectedTarget?: number;
    onSelect: (target?: number) => void;
    t: Translator;
};

export const GoalTargetGrid = ({
    selectedAction,
    selectedTarget,
    onSelect,
    t,
}: GoalTargetGridProps) => (
    <div className="animate-fade-in bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="text-sm font-bold text-gray-500 mb-3 text-center">
            {selectedAction === 'Goal'
                ? t('eventForm.goalTargetTitle')
                : t('eventForm.saveLocationTitle')}
        </h4>
        <div className="max-w-[220px] mx-auto bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => {
                    const isActive = selectedTarget === target;
                    return (
                        <button
                            key={target}
                            aria-label={`goal-target-${target}`}
                            aria-pressed={isActive}
                            onClick={() => onSelect(target)}
                            className={`h-14 rounded-lg transition-all border-2 flex items-center justify-center ${
                                isActive
                                    ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    </div>
);
