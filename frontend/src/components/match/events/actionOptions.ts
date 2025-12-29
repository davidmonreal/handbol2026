import type { ComponentType } from 'react';
import type { SanctionType, TurnoverType, ShotResult } from '../../../types';
import { actionCatalog } from './actionCatalog';

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

export const buildShotResults = (t: (key: string) => string): ShotResultOption[] =>
    actionCatalog.Shot.map((entry) => ({
        value: entry.value,
        label: t(entry.labelKey),
        icon: entry.icon,
    }));

export const buildTurnoverTypes = (t: (key: string) => string): TurnoverOption[] =>
    actionCatalog.Turnover.map((entry) => ({
        value: entry.value,
        label: t(entry.labelKey),
        icon: entry.icon,
    }));

export const buildSanctionTypes = (t: (key: string) => string): SanctionOption[] =>
    actionCatalog.Sanction.map((entry) => ({
        value: entry.value,
        label: t(entry.labelKey),
        color: entry.color,
    }));
