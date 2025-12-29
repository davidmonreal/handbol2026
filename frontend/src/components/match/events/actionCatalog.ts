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

export type ShotActionCatalogEntry = {
    value: ShotResult;
    labelKey: string;
    icon: ComponentType<{ size?: number }>;
};

export type TurnoverActionCatalogEntry = {
    value: TurnoverType;
    labelKey: string;
    icon: ComponentType<{ size?: number }>;
};

export type SanctionActionCatalogEntry = {
    value: SanctionType;
    labelKey: string;
    color: string;
};

export type ActionCatalog = {
    Shot: ShotActionCatalogEntry[];
    Turnover: TurnoverActionCatalogEntry[];
    Sanction: SanctionActionCatalogEntry[];
};

export const actionCatalog: ActionCatalog = {
    Shot: [
        { value: 'Goal', labelKey: 'eventForm.result.goal', icon: Target },
        { value: 'Save', labelKey: 'eventForm.result.save', icon: Hand },
        { value: 'Miss', labelKey: 'eventForm.result.miss', icon: Wind },
        { value: 'Post', labelKey: 'eventForm.result.post', icon: GoalIcon },
        { value: 'Block', labelKey: 'eventForm.result.block', icon: Ban },
    ],
    Turnover: [
        { value: 'Pass', labelKey: 'eventForm.turnover.badPass', icon: Shuffle },
        { value: 'Catch', labelKey: 'eventForm.turnover.droppedBall', icon: Hand },
        { value: 'Offensive Foul', labelKey: 'eventForm.turnover.offensiveFoul', icon: UserX },
        { value: 'Steps', labelKey: 'eventForm.turnover.steps', icon: Footprints },
        { value: 'Area', labelKey: 'eventForm.turnover.area', icon: Square },
    ],
    Sanction: [
        { value: 'Foul', labelKey: 'eventForm.sanction.commonFoul', color: 'bg-gray-600' },
        { value: '2min', labelKey: 'eventForm.sanction.twoMinutes', color: 'bg-blue-600' },
        { value: 'Yellow', labelKey: 'eventForm.sanction.yellow', color: 'bg-yellow-500' },
        { value: 'Red', labelKey: 'eventForm.sanction.red', color: 'bg-red-600' },
        { value: 'Blue Card', labelKey: 'eventForm.sanction.blue', color: 'bg-blue-800' },
    ],
};

export const shotActionValues = actionCatalog.Shot.map(({ value }) => value);
export const turnoverActionValues = actionCatalog.Turnover.map(({ value }) => value);
export const sanctionActionValues = actionCatalog.Sanction.map(({ value }) => value);
