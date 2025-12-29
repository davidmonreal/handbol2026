import '@testing-library/jest-dom'; // Explicit import to fix lint
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MatchTracker from '../../components/MatchTracker';
import { MatchProvider } from '../../context/MatchContext';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ matchId: 'match-123' }),
        useNavigate: () => vi.fn(),
    };
});

// Mock the API calls
globalThis.fetch = vi.fn();

// Mock initial match data response
const mockMatchData = {
    id: 'match-123',
    homeTeam: {
        id: 'home-1',
        name: 'Home Team',
        players: [{ player: { id: 'p1', number: 1, name: 'P1' }, position: 4 }]
    },
    awayTeam: {
        id: 'away-1',
        name: 'Away Team',
        players: [
            { player: { id: 'gk-1', number: 1, name: 'GK One', isGoalkeeper: true }, position: 1 },
            { player: { id: 'gk-2', number: 2, name: 'GK Two', isGoalkeeper: true }, position: 1 }
        ]
    },
    isFinished: false,
    realTimeFirstHalfStart: 1,
};

// Mock EventForm to expose onSave trigger and selected GK state
vi.mock('../../components/match/events/EventForm', async () => {
    const actual = await vi.importActual('../../components/match/events/useEventFormState');
    const { useEventFormState } = actual as { useEventFormState: typeof import('../../components/match/events/useEventFormState').useEventFormState };

    return {
        EventForm: ({ onSave, event, team, initialState, locked }: any) => {
            const { state } = useEventFormState({
                event,
                teamId: team?.id ?? 'home-1',
                initialState,
                locked,
                onSave,
                onCancel: () => undefined,
                t: (key: string) => key,
            });

            return (
                <div data-testid="mock-event-form">
                    <div data-testid="selected-opponent-gk">{state.selectedOpponentGkId}</div>
                    <button
                        data-testid="save-event-btn"
                        onClick={() => onSave({
                            id: 'evt-1',
                            category: 'Shot',
                            action: 'Goal',
                            teamId: 'home-1',
                            timestamp: 100
                        }, 'gk-1')}
                    >
                        Save GK 1
                    </button>
                    <button
                        data-testid="save-event-gk2-btn"
                        onClick={() => onSave({
                            id: 'evt-1',
                            category: 'Shot',
                            action: 'Goal',
                            teamId: 'home-1',
                            timestamp: 100
                        }, 'gk-2')}
                    >
                        Save GK 2
                    </button>
                    {event ? <div data-testid="editing-mode">Editing: {event.id}</div> : <div data-testid="creation-mode">Creation Mode</div>}
                </div>
            );
        },
    };
});

// Mock EventList to trigger edit with the current event from context
vi.mock('../../components/match/events/EventList', async () => {
    const actual = await vi.importActual('../../context/MatchContext');
    const { useMatch } = actual as { useMatch: typeof import('../../context/MatchContext').useMatch };

    return {
        EventList: ({ onEditEvent }: any) => {
            const { events } = useMatch();
            const event = events[0];
            return (
                <div data-testid="mock-event-list">
                    {event ? (
                        <button
                            data-testid="edit-event-btn"
                            onClick={() => onEditEvent(event)}
                        >
                            Edit Event
                        </button>
                    ) : null}
                </div>
            );
        },
    };
});

describe('MatchTracker GK Persistence', () => {
    let localStorageMock: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Explicitly mock localStorage
        localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            clear: vi.fn(),
            removeItem: vi.fn(),
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });
        window.scrollTo = vi.fn();

        (globalThis.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockMatchData,
        });
    });

    it('should persist opponent goalkeeper globally when saving a NEW event', async () => {
        render(
            <BrowserRouter>
                <MatchProvider>
                    <MatchTracker />
                </MatchProvider>
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument());

        // Click save with GK-1
        await act(async () => {
            fireEvent.click(screen.getByTestId('save-event-btn'));
        });

        // Expect localStorage to be updated
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            expect.stringContaining('goalkeeper-match-123'),
            'gk-1'
        );
    });

    it('should NOT persist opponent goalkeeper globally when EDITING an event', async () => {
        render(
            <BrowserRouter>
                <MatchProvider>
                    <MatchTracker />
                </MatchProvider>
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument());

        // 1. Create an event first (sets GK to gk-1)
        await act(async () => {
            fireEvent.click(screen.getByTestId('save-event-btn'));
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith(expect.anything(), 'gk-1');
        localStorageMock.setItem.mockClear();

        // 2. Trigger active GK change just to be sure we are in a state where we "could" change it
        // (In reality, we want to try saving with gk-2 and ensure it DOES NOT call setItem)

        // 3. Enter Edit Mode
        await waitFor(() => expect(screen.getByTestId('edit-event-btn')).toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByTestId('edit-event-btn'));
        });
        await waitFor(() => expect(screen.getByTestId('editing-mode')).toBeInTheDocument());

        // 4. Save with GK-2 (simulating changing GK during edit)
        await act(async () => {
            fireEvent.click(screen.getByTestId('save-event-gk2-btn'));
        });

        // 5. Verification:
        // - setItem should NOT be called (preserving 'gk-1' as global default)
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('prefers event goalkeeper over persisted selection when editing', async () => {
        localStorageMock.getItem.mockReturnValue('gk-2');
        render(
            <BrowserRouter>
                <MatchProvider>
                    <MatchTracker />
                </MatchProvider>
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Home Team vs Away Team')).toBeInTheDocument());

        await act(async () => {
            fireEvent.click(screen.getByTestId('save-event-btn'));
        });
        await waitFor(() => expect(screen.getByTestId('edit-event-btn')).toBeInTheDocument());
        await act(async () => {
            fireEvent.click(screen.getByTestId('edit-event-btn'));
        });
        await waitFor(() => expect(screen.getByTestId('editing-mode')).toBeInTheDocument());

        expect(screen.getByTestId('selected-opponent-gk')).toHaveTextContent('gk-1');
    });
});
