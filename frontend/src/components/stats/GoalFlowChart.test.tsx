import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GoalFlowChart } from './GoalFlowChart';
import type { MatchEvent } from '../../types';

let idCounter = 0;
const buildEvent = (overrides: Partial<MatchEvent>): MatchEvent => ({
    id: `evt-${idCounter++}`,
    timestamp: 0,
    teamId: 'team-a',
    playerId: 'p1',
    category: 'Shot',
    action: 'Goal',
    ...overrides,
});

describe('GoalFlowChart', () => {
    const events: MatchEvent[] = [
        buildEvent({ timestamp: 120, teamId: 'team-a', action: 'Goal' }),
        buildEvent({ timestamp: 300, teamId: 'team-a', category: 'Turnover', action: 'Pass' }),
        buildEvent({ timestamp: 480, teamId: 'team-a', category: 'Sanction', action: 'Foul' }),
        buildEvent({ timestamp: 200, teamId: 'team-b', action: 'Goal' }),
        buildEvent({ timestamp: 1900, teamId: 'team-b', action: 'Goal' }),
    ];

    it('renders chart with legend and aria label', () => {
        render(
            <GoalFlowChart
                events={events}
                selectedTeamId="team-a"
                opponentTeamId="team-b"
                secondHalfMarkSeconds={1800}
                teamName="Club A U18 Team"
                opponentName="Club B U18 Team"
            />
        );

        expect(screen.getByText('Goal Flow & Errors')).toBeInTheDocument();
        expect(screen.getByLabelText(/Goal flow chart/i)).toBeInTheDocument();
        expect(screen.getByText(/Club A U18 Team/i)).toBeInTheDocument();
        expect(screen.getByText(/Club B U18 Team/i)).toBeInTheDocument();
    });
});
