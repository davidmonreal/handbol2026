import { User, Users, ArrowUp, ArrowLeftRight } from 'lucide-react';
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
                value={isCollective}
                onChange={onToggleCollective}
                leftOption={{ label: t('eventForm.context.individual'), icon: User }}
                rightOption={{ label: t('eventForm.context.collective'), icon: Users }}
            />
            <SplitToggle
                value={hasOpposition}
                onChange={onToggleOpposition}
                leftOption={{ label: t('eventForm.context.free'), icon: User }}
                rightOption={{ label: t('eventForm.context.opposition'), icon: [User, Users] }}
            />
            <SplitToggle
                value={isCounterAttack}
                onChange={onToggleCounterAttack}
                leftOption={{ label: t('eventForm.context.static'), icon: ArrowLeftRight }}
                rightOption={{ label: t('eventForm.context.counter'), icon: ArrowUp }}
            />
        </div>
    </div>
);
