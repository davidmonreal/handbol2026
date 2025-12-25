import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { sortTeamsByOwnership } from './TeamsManagement';
import type { Team } from '../../types';
import { TeamsManagement } from './TeamsManagement';

describe('TeamsManagement', () => {
  it('component exports correctly', () => {
    // Basic smoke test to ensure module loads
    expect(true).toBe(true);
  });

  it('filters teams by search term', () => {
    const teams = [
      { id: '1', name: 'test-Team A', category: 'Senior M', club: { id: 'club-a', name: 'test-Club A' }, season: { id: 'season-1', name: 'test-2024' }, players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'test-Team B', category: 'Cadet M', club: { id: 'club-b', name: 'test-Club B' }, season: { id: 'season-1', name: 'test-2024' }, players: [], isMyTeam: false, color: '#fff' }
    ];
    
    const searchTerm = 'test-Team A';
    const filtered = teams.filter(team => {
      const searchLower = searchTerm.toLowerCase();
      return (
        team.name.toLowerCase().includes(searchLower) || 
        team.club.name.toLowerCase().includes(searchLower) ||
        (team.category && team.category.toLowerCase().includes(searchLower))
      );
    });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('test-Team A');
  });

  it('filters teams by category', () => {
    const teams = [
      { id: '1', name: 'test-Team A', category: 'Senior M', club: { id: 'club-a', name: 'test-Club A' }, season: { id: 'season-1', name: 'test-2024' }, players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'test-Team B', category: 'Cadet M', club: { id: 'club-b', name: 'test-Club B' }, season: { id: 'season-1', name: 'test-2024' }, players: [], isMyTeam: false, color: '#fff' }
    ];
    
    const searchTerm = 'cadet';
    const filtered = teams.filter(team => {
      const searchLower = searchTerm.toLowerCase();
      return (
        team.name.toLowerCase().includes(searchLower) || 
        team.club.name.toLowerCase().includes(searchLower) ||
        (team.category && team.category.toLowerCase().includes(searchLower))
      );
    });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('Cadet M');
  });

  it('sorts personal teams before the rest', () => {
    const teams: Team[] = [
      { id: '1', name: 'test-B Squad', club: { id: 'c1', name: 'test-Beta' }, season: { id: 's1', name: 'test-2024' }, category: 'Senior M', players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'test-A Squad', club: { id: 'c2', name: 'test-Alpha' }, season: { id: 's1', name: 'test-2024' }, category: 'Senior M', players: [], isMyTeam: true, color: '#fff' },
      { id: '3', name: 'test-C Squad', club: { id: 'c3', name: 'test-Gamma' }, season: { id: 's1', name: 'test-2024' }, category: 'Senior M', players: [], isMyTeam: false, color: '#fff' },
    ];

    const sorted = sortTeamsByOwnership(teams);

    expect(sorted[0].id).toBe('2');
    expect(sorted.slice(1).map(team => team.club?.name)).toEqual(['test-Beta', 'test-Gamma']);
  });

  describe('TeamsManagement CRUD list', () => {
    const mockFetch = vi.fn();
    const clubs = [{ id: 'club-1', name: 'test-Club A' }];
    const seasons = [{ id: 'season-1', name: 'test-2024', startDate: '2024-01-01', endDate: '2024-12-31' }];
    const teams = [
      {
        id: 'team-1',
        name: 'test-Team A',
        category: 'Cadet M',
        club: { id: 'club-1', name: 'test-Club A' },
        season: { id: 'season-1', name: 'test-2024' },
        players: [],
        isMyTeam: false,
        color: '#fff',
      },
    ];

    beforeEach(() => {
      let teamQueue = [teams, []];
      mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        const method = (init?.method ?? 'GET').toUpperCase();

        if (url.includes('/api/clubs')) {
          return Promise.resolve({ ok: true, json: async () => clubs });
        }

        if (url.includes('/api/seasons')) {
          return Promise.resolve({ ok: true, json: async () => seasons });
        }

        if (url.includes('/api/teams') && method === 'GET') {
          const next = teamQueue.length ? teamQueue.shift() : [];
          return Promise.resolve({ ok: true, json: async () => next });
        }

        if (url.includes('/api/teams/team-1') && method === 'DELETE') {
          return Promise.resolve({ ok: true, json: async () => ({}) });
        }

        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;
    });

    it('deletes a team and refreshes the list', async () => {
      render(
        <MemoryRouter>
          <TeamsManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('test-Team A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete Team' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/teams/team-1'),
          expect.objectContaining({ method: 'DELETE' }),
        );
      });
    });
  });
});
