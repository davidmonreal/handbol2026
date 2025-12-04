import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import MatchTracker from './MatchTracker';
import { MatchProvider } from '../context/MatchContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock the sub-components to simplify testing
vi.mock('./match/Scoreboard', () => ({
    Scoreboard: () => <div data-testid="scoreboard">Scoreboard</div>
}));
vi.mock('./match/PlayerSelector', () => ({
    PlayerSelector: () => <div data-testid="player-selector">Player Selector</div>
}));
vi.mock('./match/DefenseFormationSelector', () => ({
    DefenseFormationSelector: () => <div data-testid="defense-selector">Defense Selector</div>
}));
vi.mock('./match/FlowSelector', () => ({
    FlowSelector: () => <div data-testid="flow-selector">Flow Selector</div>
}));

describe('MatchTracker Integration', () => {
    const mockMatchData = {
        id: 'match-1',
        homeTeam: {
            id: 'home-1',
            name: 'Home Team',
            players: [{ player: { id: 'p1', number: 1, name: 'Player 1', isGoalkeeper: false } }]
        },
        awayTeam: {
            id: 'visitor-1',
            name: 'Visitor Team',
            players: [{ player: { id: 'p2', number: 2, name: 'Player 2', isGoalkeeper: false } }]
        }
    };

    const mockEvents = [
        {
            id: 'event-1',
            timestamp: 100,
            playerId: 'p1',
            teamId: 'home-1',
            type: 'Shot',
            subtype: 'Goal',
            goalZone: 'TL',
            player: {
                id: 'p1',
                name: 'Player 1',
                number: 1
            }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockMatchData
        });
    });

    it('should switch to editing mode when an event is clicked', async () => {
        // We need to mock the fetch for events as well
        mockFetch.mockImplementation((url: string) => {
            // console.log('Mock fetch called with:', url); // Debug log
            if (url.includes('/api/game-events/match/') || url.includes('/events/match/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockEvents
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => mockMatchData
            });
        });

        render(
            <MatchProvider>
                <MemoryRouter initialEntries={['/match/match-1']}>
                    <Routes>
                        <Route path="/match/:matchId" element={<MatchTracker />} />
                    </Routes>
                </MemoryRouter>
            </MatchProvider>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Home Team vs Visitor Team')).toBeInTheDocument();
        });

        // Verify event list is present
        await waitFor(() => {
            expect(screen.getByText('Recent Events')).toBeInTheDocument();
        });

        // Find the event in the list (it renders as a button)
        const eventItem = screen.getByText('Goal').closest('button');
        expect(eventItem).toBeInTheDocument();

        // Click the event
        fireEvent.click(eventItem!);

        // Verify that the main area now shows "Edit Event"
        await waitFor(() => {
            expect(screen.getByText('Edit Event')).toBeInTheDocument();
        });

        // Verify that the EventEditResult component is rendered (look for specific buttons)
        expect(screen.getAllByText('Save').length).toBeGreaterThan(0);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });
});
