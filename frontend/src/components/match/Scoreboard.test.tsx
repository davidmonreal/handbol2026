import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
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
    events: unknown[];
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
    events: [],
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

beforeEach(() => {
    setMatchMock({
        realTimeFirstHalfStart: null,
        realTimeFirstHalfEnd: null,
        realTimeSecondHalfStart: null,
        realTimeSecondHalfEnd: null,
        events: [],
        setRealTimeCalibration: () => Promise.resolve(),
        scoreMode: 'live',
    });
});

describe('Scoreboard half controls visibility', () => {
    it('stacks 1H start/finish vertically and disables finish until plays exist', () => {
        renderScoreboard();

        const start1 = screen.getByText('scoreboard.startFirstHalf');
        const finish1 = screen.getByText('scoreboard.finishFirstHalf');

        expect(start1).toBeEnabled();
        expect(finish1).toBeDisabled();
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();
    });

    it('hides half controls when hideHalfControls is true', () => {
        renderScoreboard({ hideHalfControls: true });
        expect(screen.queryByText('scoreboard.startFirstHalf')).not.toBeInTheDocument();
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();
    });

    it('resets the displayed clock when half controls are hidden (locked team)', () => {
        renderScoreboard({ hideHalfControls: true, time: 125 });
        expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('disables start 1H and enables finish 1H after the first play is present', () => {
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 1000,
            events: [{ id: 'e1' }],
        });

        renderScoreboard({ hideHalfControls: false });

        expect(screen.getByText('scoreboard.startFirstHalf')).toBeDisabled();
        expect(screen.getByText('scoreboard.finishFirstHalf')).toBeEnabled();
    });

    it('keeps the finish button enabled when a half is already running with events', () => {
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 45000,
            realTimeFirstHalfEnd: null,
            realTimeSecondHalfStart: null,
            realTimeSecondHalfEnd: null,
            events: [{ id: '1' }],
        });

        renderScoreboard({ hideHalfControls: false, time: 45 });

        expect(screen.getByText('scoreboard.finishFirstHalf')).toBeEnabled();
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();

        setMatchMock({
            realTimeFirstHalfStart: null,
            realTimeFirstHalfEnd: null,
            realTimeSecondHalfStart: null,
            realTimeSecondHalfEnd: null,
            events: [],
        });
    });

    it('shows 2H controls 3s after finishing 1H and keeps start enabled even if 1H had plays', () => {
        vi.useFakeTimers();
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 2000,
            realTimeFirstHalfEnd: Date.now() - 1000,
            events: [{ id: '1' }],
        });

        renderScoreboard({ hideHalfControls: false });

        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();
        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByText('scoreboard.startSecondHalf')).toBeEnabled();
        expect(screen.getByText('scoreboard.finishSecondHalf')).toBeDisabled();
        vi.useRealTimers();
    });

    it('when 2H is already running with plays, only finish 2H is enabled and 1H controls are hidden', () => {
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 1800000,
            realTimeFirstHalfEnd: Date.now() - 900000,
            realTimeSecondHalfStart: Date.now() - 60000,
            realTimeSecondHalfEnd: null,
            events: [{ id: '1' }],
        });

        renderScoreboard({ hideHalfControls: false, time: 900 + 60 });

        expect(screen.queryByText('scoreboard.finishFirstHalf')).not.toBeInTheDocument();
        expect(screen.getByText('scoreboard.startSecondHalf')).toBeDisabled();
        expect(screen.getByText('scoreboard.finishSecondHalf')).toBeEnabled();
    });

    it('calls finish match callback 3s after finishing 2H', async () => {
        vi.useFakeTimers();
        const finishMock = vi.fn();
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 1800000,
            realTimeFirstHalfEnd: Date.now() - 900000,
            realTimeSecondHalfStart: Date.now() - 60000,
            realTimeSecondHalfEnd: null,
            events: [{ id: '1' }],
        });

        renderScoreboard({ hideHalfControls: false, time: 900 + 60, onFinishMatch: finishMock });

        await act(async () => {
            fireEvent.click(screen.getByText('scoreboard.finishSecondHalf'));
            await Promise.resolve();
        });

        act(() => {
            vi.advanceTimersByTime(2999);
        });
        expect(finishMock).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(finishMock).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('hides second-half controls when score is locked (manual mode)', () => {
        setMatchMock({
            realTimeFirstHalfStart: Date.now() - 1800000,
            realTimeFirstHalfEnd: Date.now() - 900000,
            realTimeSecondHalfStart: Date.now() - 60000,
            realTimeSecondHalfEnd: null,
            events: [{ id: '1' }],
            scoreMode: 'manual',
        });

        renderScoreboard({ hideHalfControls: false, time: 900 + 60 });

        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();
        expect(screen.queryByText('scoreboard.finishSecondHalf')).not.toBeInTheDocument();
    });

    it('follows the button sequence from 1H start to 2H start/finish', async () => {
        vi.useFakeTimers();
        const finishMock = vi.fn();
        const setRealTimeCalibration = vi.fn(async (half: 1 | 2, timestamp: number, boundary: 'start' | 'end' = 'start') => {
            const payload: Partial<MatchMock> = {};
            if (half === 1) {
                if (boundary === 'start') payload.realTimeFirstHalfStart = timestamp;
                else payload.realTimeFirstHalfEnd = timestamp;
            } else {
                if (boundary === 'start') payload.realTimeSecondHalfStart = timestamp;
                else payload.realTimeSecondHalfEnd = timestamp;
            }
            setMatchMock(payload);
        });
        setMatchMock({ setRealTimeCalibration, events: [] });

        const renderTree = (props?: Partial<React.ComponentProps<typeof Scoreboard>>) => (
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
            </MemoryRouter>
        );

        const view = render(renderTree({ onFinishMatch: finishMock }));

        // Initial: only 1H controls, finish disabled.
        expect(screen.getByText('scoreboard.startFirstHalf')).toBeEnabled();
        expect(screen.getByText('scoreboard.finishFirstHalf')).toBeDisabled();
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();

        // Start 1H.
        await act(async () => {
            fireEvent.click(screen.getByText('scoreboard.startFirstHalf'));
            await Promise.resolve();
        });
        view.rerender(renderTree({ onFinishMatch: finishMock }));
        expect(screen.getByText('scoreboard.startFirstHalf')).toBeEnabled();
        expect(screen.getByText('scoreboard.finishFirstHalf')).toBeDisabled();

        // First play appears -> enable finish, disable start.
        setMatchMock({ events: [{ id: 'play-1' }] });
        view.rerender(renderTree({ onFinishMatch: finishMock }));
        expect(screen.getByText('scoreboard.startFirstHalf')).toBeDisabled();
        expect(screen.getByText('scoreboard.finishFirstHalf')).toBeEnabled();

        // Finish 1H schedules 2H controls after 3s.
        await act(async () => {
            fireEvent.click(screen.getByText('scoreboard.finishFirstHalf'));
            await Promise.resolve();
        });
        view.rerender(renderTree({ onFinishMatch: finishMock }));
        expect(screen.queryByText('scoreboard.startSecondHalf')).not.toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(screen.getByText('scoreboard.startSecondHalf')).toBeEnabled();
        expect(screen.getByText('scoreboard.finishSecondHalf')).toBeDisabled();

        // Start 2H; with plays present, start disables and finish enables.
        await act(async () => {
            fireEvent.click(screen.getByText('scoreboard.startSecondHalf'));
            await Promise.resolve();
        });
        view.rerender(renderTree({ onFinishMatch: finishMock }));
        expect(screen.getByText('scoreboard.startSecondHalf')).toBeDisabled();
        expect(screen.getByText('scoreboard.finishSecondHalf')).toBeEnabled();

        vi.useRealTimers();
    });
});
