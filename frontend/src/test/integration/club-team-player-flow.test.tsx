import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClubsManagement } from '../../components/admin/ClubsManagement';
import { TeamFormPage } from '../../components/admin/teams/TeamFormPage';

const PlayersPage = () => {
  const { id } = useParams();
  return <div data-testid="players-page">players-{id}</div>;
};

describe('Club → Team → Players flow', () => {
  const season = {
    id: 'season-1',
    name: '2025/2026',
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };

  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementationOnce(() => true).mockImplementationOnce(() => true);
    const mockFetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/clubs') && (!init || init.method === 'GET')) {
        // Team form needs the created club available in the list.
        return {
          ok: true,
          json: async () => [{ id: 'club-123', name: 'New Club' }],
        };
      }
      if (url.includes('/api/seasons')) {
        return { ok: true, json: async () => [season] };
      }
      if (url.includes('/api/clubs') && init?.method === 'POST') {
        const body = init.body ? JSON.parse(init.body as string) : {};
        return {
          ok: true,
          json: async () => ({ id: 'club-123', name: body.name }),
        };
      }
      if (url.includes('/api/teams') && (!init || init.method === 'POST')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        return {
          ok: true,
          json: async () => ({
            id: 'team-456',
            name: body.name,
            category: body.category,
            club: { id: body.clubId, name: 'New Club' },
          }),
        };
      }

      return { ok: true, json: async () => [] };
    });

    vi.spyOn(global, 'fetch').mockImplementation(mockFetch as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('navigates from club creation to team creation preselecting the club, then to players after saving the team', async () => {
    render(
      <MemoryRouter initialEntries={['/clubs']}>
        <Routes>
          <Route path="/clubs" element={<ClubsManagement />} />
          <Route path="/teams/new" element={<TeamFormPage />} />
          <Route path="/teams/:id/players" element={<PlayersPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Open club creation modal/form
    // CrudManager renders "New Club" button
    const newClubBtn = await screen.findByRole('button', { name: /new club/i });
    fireEvent.click(newClubBtn);

    const nameInput = await screen.findByPlaceholderText(/enter club name/i);
    fireEvent.change(nameInput, { target: { value: 'New Club' } });

    const createClubBtn = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createClubBtn);

    // Should land on team form; open club select to confirm our club exists (prefill may not render label in button until options load)
    await waitFor(() => expect(screen.getByText(/new team/i)).toBeInTheDocument());
    const clubSelect = await screen.findByRole('button', { name: 'New Club' });
    expect(clubSelect).toHaveTextContent('New Club');

    // Fill team name and save
    const teamNameInput = screen.getByPlaceholderText(/e\.g\. cadet a/i);
    fireEvent.change(teamNameInput, { target: { value: 'My Team' } });

    const createTeamBtn = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(createTeamBtn);

    // After creating the team, navigate to players page
    await waitFor(() =>
      expect(screen.getByTestId('players-page')).toHaveTextContent('players-team-456'),
    );
  });
});
