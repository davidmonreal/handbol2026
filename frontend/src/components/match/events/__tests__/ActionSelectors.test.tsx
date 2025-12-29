import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { ActionSelectors } from '../ActionSelectors';
import { actionCatalog } from '../actionCatalog';
import type { ShotResultOption, TurnoverOption, SanctionOption } from '../actionOptions';

const t = (key: string) => key;
const noop = () => {};

const shotResults: ShotResultOption[] = actionCatalog.Shot.map((entry) => ({
    value: entry.value,
    label: t(entry.labelKey),
    icon: entry.icon,
}));

const turnoverTypes: TurnoverOption[] = actionCatalog.Turnover.map((entry) => ({
    value: entry.value,
    label: t(entry.labelKey),
    icon: entry.icon,
}));

const sanctionTypes: SanctionOption[] = actionCatalog.Sanction.map((entry) => ({
    value: entry.value,
    label: t(entry.labelKey),
    color: entry.color,
}));

describe('ActionSelectors', () => {
    it('renders every shot action from the catalog', () => {
        render(
            <ActionSelectors
                selectedCategory="Shot"
                selectedAction={null}
                shotResults={shotResults}
                turnoverTypes={turnoverTypes}
                sanctionTypes={sanctionTypes}
                onSelectAction={noop}
                onForceCollective={noop}
                onForceOpposition={noop}
            />,
        );

        actionCatalog.Shot.forEach((entry) => {
            expect(screen.getByRole('button', { name: entry.labelKey })).toBeInTheDocument();
        });
    });

    it('renders every turnover action from the catalog', () => {
        render(
            <ActionSelectors
                selectedCategory="Turnover"
                selectedAction={null}
                shotResults={shotResults}
                turnoverTypes={turnoverTypes}
                sanctionTypes={sanctionTypes}
                onSelectAction={noop}
                onForceCollective={noop}
                onForceOpposition={noop}
            />,
        );

        actionCatalog.Turnover.forEach((entry) => {
            expect(screen.getByRole('button', { name: entry.labelKey })).toBeInTheDocument();
        });
    });

    it('renders every sanction action from the catalog', () => {
        render(
            <ActionSelectors
                selectedCategory="Sanction"
                selectedAction={null}
                shotResults={shotResults}
                turnoverTypes={turnoverTypes}
                sanctionTypes={sanctionTypes}
                onSelectAction={noop}
                onForceCollective={noop}
                onForceOpposition={noop}
            />,
        );

        actionCatalog.Sanction.forEach((entry) => {
            expect(screen.getByRole('button', { name: entry.labelKey })).toBeInTheDocument();
        });
    });
});
