import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Scoreboard } from './Scoreboard';

vi.mock('../../context/LanguageContext', () => ({
    useSafeTranslation: () => ({ t: (key: string) => key }),
}));

type MatchMock = {
    realTimeFirstHalfStart: number | null;
    realTimeSecondHalfStart: number | null;
    realTimeFirstHalfEnd: number | null;
    realTimeSecondHalfEnd: number | null;
    firstHalfVideoStart: number | null;
    secondHalfVideoStart: number | null;
    setRealTimeCalibration: () => Promise<void> | Promise<unknown>;
    scoreMode: 'live' | 'manual';
    matchId: string | null;
};

const matchMock: MatchMock = {
    realTimeFirstHalfStart: null,
    realTimeSecondHalfStart: null,
    realTimeFirstHalfEnd: null,
    realTimeSecondHalfEnd: null,
    firstHalfVideoStart: null,
    secondHalfVideoStart: null,
    setRealTimeCalibration: () => Promise.resolve(),
    scoreMode: 'live',
    matchId: null,
};

const setMatchMock = (partial: Partial<MatchMock>) => {
    Object.assign(matchMock, partial);
};

vi.mock('../../context/MatchContext', () => ({
    useMatch: () => matchMock,
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

    it('shows start buttons even if halves were previously finished when active team is unlocked', () => {
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 600000,
            realTimeFirstHalfEnd: Date.now() - 300000,
            realTimeSecondHalfStart: Date.now() - 120000,
            realTimeSecondHalfEnd: Date.now() - 60000,
        });

        renderScoreboard({ hideHalfControls: false });

        // Because hideHalfControls is false, we ignore effective markers to allow restarting halves.
        const startFirst = screen.getByText('scoreboard.startFirstHalf');
        const startSecond = screen.getByText('scoreboard.startSecondHalf');
        expect(startFirst).toBeInTheDocument();
        expect(startSecond).toBeInTheDocument();
        expect(startFirst).not.toBeDisabled();
        // Second half requires first to be (re)started/finished; remains disabled until then.
        expect(startSecond).toBeDisabled();

        // Reset mock to avoid leaking state between tests
        setMatchMock({
            realTimeFirstHalfStart: null,
            realTimeFirstHalfEnd: null,
            realTimeSecondHalfStart: null,
            realTimeSecondHalfEnd: null,
        });
    });
});
