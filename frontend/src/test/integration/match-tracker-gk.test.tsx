import '@testing-library/jest-dom'; // Explicit import to fix lint
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
        players: [{ player: { id: 'p1', number: 1, name: 'P1' } }]
    },
    awayTeam: {
        id: 'away-1',
        name: 'Away Team',
        players: [
            { player: { id: 'gk-1', number: 1, name: 'GK One', isGoalkeeper: true } },
            { player: { id: 'gk-2', number: 2, name: 'GK Two', isGoalkeeper: true } }
        ]
    },
    isFinished: false,
};

// Mock EventForm to expose onSave trigger
vi.mock('../../components/match/events/EventForm', () => ({
    EventForm: ({ onSave, event }: any) => (
        <div data-testid="mock-event-form">
            <button
                data-testid="save-event-btn"
                onClick={() => onSave({
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
    )
}));

// Mock EventList to trigger edit
vi.mock('../../components/match/events/EventList', () => ({
    EventList: ({ onEditEvent }: any) => (
        <div data-testid="mock-event-list">
            <button
                data-testid="edit-event-btn"
                onClick={() => onEditEvent({ id: 'evt-1', teamId: 'home-1', opponentGoalkeeperId: 'gk-1' })}
            >
                Edit Event
            </button>
        </div>
    )
}));

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
        fireEvent.click(screen.getByTestId('save-event-btn'));

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
        fireEvent.click(screen.getByTestId('save-event-btn'));
        expect(localStorageMock.setItem).toHaveBeenCalledWith(expect.anything(), 'gk-1');
        localStorageMock.setItem.mockClear();

        // 2. Trigger active GK change just to be sure we are in a state where we "could" change it
        // (In reality, we want to try saving with gk-2 and ensure it DOES NOT call setItem)

        // 3. Enter Edit Mode
        fireEvent.click(screen.getByTestId('edit-event-btn'));
        await waitFor(() => expect(screen.getByTestId('editing-mode')).toBeInTheDocument());

        // 4. Save with GK-2 (simulating changing GK during edit)
        fireEvent.click(screen.getByTestId('save-event-gk2-btn'));

        // 5. Verification:
        // - setItem should NOT be called (preserving 'gk-1' as global default)
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
});
