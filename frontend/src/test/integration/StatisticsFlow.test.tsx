import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchesManagement } from '../../components/admin/MatchesManagement';
import Statistics from '../../components/Statistics';
import { MatchProvider } from '../../context/MatchContext';


// Mock fetch


const mockMatches = [
  {
    id: 'match-1',
    date: '2024-11-15T18:00:00',
    homeTeamId: 'home-1',
    awayTeamId: 'away-1',
    homeTeam: { id: 'home-1', name: 'Home Team', players: [{ player: { id: 'p1', name: 'Player 1' }, number: 1 }] },
    awayTeam: { id: 'away-1', name: 'Away Team', players: [{ player: { id: 'p2', name: 'Player 2' }, number: 2 }] },
    isFinished: true,
    homeScore: 10,
    awayScore: 5
  }
];

const mockEvents = [
  {
    id: 'event-1',
    matchId: 'match-1',
    timestamp: 100,
    playerId: 'p1',
    teamId: 'home-1',
    type: 'Shot',
    subtype: 'Goal',
    position: 'LW',
    distance: '6M',
    goalZone: 'TL'
  },
  {
    id: 'event-2',
    matchId: 'match-1',
    timestamp: 200,
    playerId: 'p1',
    teamId: 'home-1',
    type: 'Sanction',
    action: 'Yellow'
  }
];

const mockTeams = [
  { id: 'home-1', name: 'Home Team' },
  { id: 'away-1', name: 'Away Team' }
];

describe('Statistics Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      console.log('Mock fetch called with:', url);

      if (url.includes('/api/matches/match-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMatches[0])
        } as Response);
      }
      if (url.includes('/api/matches')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMatches)
        } as Response);
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTeams)
        } as Response);
      }
      if (url.includes('/api/game-events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEvents)
        } as Response);
      }
      return Promise.reject(new Error(`Not found: ${url}`));
    });
  });

  it('renders matches list and opens statistics modal', async () => {
    render(
      <MatchProvider>
        <MemoryRouter initialEntries={['/matches']}>
          <Routes>
            <Route path="/matches" element={<MatchesManagement />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </MemoryRouter>
      </MatchProvider>
    );

    // Check if match is rendered
    await waitFor(() => {
      // screen.debug();
      const homeTeams = screen.getAllByText('Home Team');
      expect(homeTeams.length).toBeGreaterThan(0);
      const awayTeams = screen.getAllByText('Away Team');
      expect(awayTeams.length).toBeGreaterThan(0);
      expect(screen.getByText(/10\s*:\s*5/)).toBeInTheDocument(); // Score check with regex
    }).catch(e => {
      screen.debug();
      throw e;
    });

    // Click View Statistics button
    const statsButton = screen.getByTitle('View Statistics');
    fireEvent.click(statsButton);

    // Check if modal opens and displays stats
    await waitFor(() => {
      expect(screen.getByText(/Match Statistics/)).toBeInTheDocument();
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('YC')).toBeInTheDocument();
      // Check for event data (this depends on StatisticsView implementation)
      // We can check if the goal is counted
      // expect(screen.getByText('10')).toBeInTheDocument(); // Might be ambiguous
    });
  });

  it('calculates zone statistics correctly', async () => {
    // Add a 9m shot event
    const eventsWith9m = [
      ...mockEvents,
      {
        id: 'event-3',
        matchId: 'match-1',
        timestamp: 300,
        playerId: 'p1',
        teamId: 'home-1',
        type: 'Shot',
        subtype: 'Goal',
        position: 'cb',
        distance: '9M',
        goalZone: 'TR'
      }
    ];

    // Mock fetch to return these events
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/api/game-events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(eventsWith9m)
        } as Response);
      }
      // ... handle other endpoints same as before
      if (url.includes('/api/matches/match-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMatches[0])
        } as Response);
      }
      if (url.includes('/api/matches')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMatches)
        } as Response);
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTeams)
        } as Response);
      }
      return Promise.reject(new Error(`Not found: ${url}`));
    });

    render(
      <MatchProvider>
        <MemoryRouter initialEntries={['/matches']}>
          <Routes>
            <Route path="/matches" element={<MatchesManagement />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </MemoryRouter>
      </MatchProvider>
    );

    // Open stats
    const statsButton = await screen.findByTitle('View Statistics');
    fireEvent.click(statsButton);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText(/Match Statistics/)).toBeInTheDocument();
    });

    // Check if 9m CB zone shows 1 shot (100%)
    // The component renders "CB 9m" as label and "100%" as percentage
    // We need to be careful with selectors as multiple zones might have 0%

    // Find the button containing "CB 9m"
    const cb9mButton = screen.getByText('CB 9m').closest('button');
    expect(cb9mButton).toBeInTheDocument();

    // Check if it contains "100%" and "(1)"
    expect(cb9mButton).toHaveTextContent('100%');
    expect(cb9mButton).toHaveTextContent('(1)');
  });
});
