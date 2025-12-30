import { User, ArrowUp, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { SplitToggle } from '../../shared/SplitToggle';
import type { Translator } from './types';

type ContextTogglesProps = {
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    onToggleCollective: (value: boolean) => void;
    onToggleOpposition: (value: boolean) => void;
    onToggleCounterAttack: (value: boolean) => void;
    t: Translator;
};

export const ContextToggles = ({
    isCollective,
    hasOpposition,
    isCounterAttack,
    onToggleCollective,
    onToggleOpposition,
    onToggleCounterAttack,
    t,
}: ContextTogglesProps) => (
    <div>
        <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('eventForm.contextLabel')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SplitToggle
                value={isCounterAttack}
                onChange={onToggleCounterAttack}
                leftOption={{ label: t('eventForm.context.static'), icon: ArrowLeftRight }}
                rightOption={{ label: t('eventForm.context.counter'), icon: ArrowUp }}
            />
            <SplitToggle
                value={isCollective}
                onChange={onToggleCollective}
                leftValue={true}
                rightValue={false}
                leftOption={{ label: t('eventForm.context.collective'), icon: [User, ArrowRight, User] }}
                rightOption={{ label: t('eventForm.context.individual'), icon: [User, ArrowRight] }}
            />
            <SplitToggle
                value={hasOpposition}
                onChange={onToggleOpposition}
                leftValue={true}
                rightValue={false}
                leftOption={{ label: t('eventForm.context.opposition'), icon: [User, Users] }}
                rightOption={{ label: t('eventForm.context.free'), icon: User }}
            />
        </div>
    </div>
);
