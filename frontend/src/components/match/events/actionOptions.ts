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
import type { SanctionType, TurnoverType, ShotResult } from '../../../types';

export interface ShotResultOption {
    value: ShotResult;
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

export const buildShotResults = (t: (key: string) => string): ShotResultOption[] => [
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
