import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Scoreboard } from './Scoreboard';

vi.mock('../../context/LanguageContext', () => ({
    useSafeTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../context/MatchContext', () => ({
    useMatch: () => ({
        realTimeFirstHalfStart: null,
        realTimeSecondHalfStart: null,
        realTimeFirstHalfEnd: null,
        realTimeSecondHalfEnd: null,
        firstHalfVideoStart: null,
        secondHalfVideoStart: null,
        setRealTimeCalibration: () => Promise.resolve(),
        scoreMode: 'live',
        matchId: null,
    }),
}));

const team = { id: 't1', name: 'Team 1', color: 'blue' };
const opponent = { id: 't2', name: 'Team 2', color: 'red' };

const renderScoreboard = (props?: Partial<React.ComponentProps<typeof Scoreboard>>) =>
    render(
        <MemoryRouter>
            <Scoreboard
                homeTeam={team}
                visitorTeam={opponent}
                homeScore={0}
                visitorScore={0}
                time={0}
                activeTeamId={team.id}
                onHomeScoreChange={() => {}}
                onVisitorScoreChange={() => {}}
                onTeamSelect={() => {}}
                {...props}
            />
        </MemoryRouter>,
    );

describe('Scoreboard half controls visibility', () => {
    it('shows half controls when not hidden', () => {
        renderScoreboard();
        expect(screen.getByText('scoreboard.startFirstHalf')).toBeInTheDocument();
        expect(screen.getByText('scoreboard.startSecondHalf')).toBeInTheDocument();
    });

    it('hides half controls when hideHalfControls is true', () => {
        renderScoreboard({ hideHalfControls: true });
        expect(screen.queryByText('scoreboard.startFirstHalf')).not.toBeInTheDocument();
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();
    });
});
