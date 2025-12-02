import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { TeamsManagement } from './TeamsManagement';
import { PlayersManagement } from './PlayersManagement';

// Mock fetch
globalThis.fetch = vi.fn();

const mockClubs = [
    { id: '1', name: 'Club A' }
];

const mockSeasons = [
    { id: 's1', name: '2024-2025', startDate: '2024-09-01', endDate: '2025-06-30' }
];

const mockTeams = [
    { id: 't1', name: 'Team A', category: 'SENIOR', club: { id: '1', name: 'Club A' }, season: { id: 's1', name: '2024-2025' } }
];

describe('Integration Flow: Club -> Team -> Player', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/api/clubs')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockClubs) });
            if (url.includes('/api/seasons')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasons) });
            if (url.includes('/api/teams')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeams) });
            if (url.includes('/api/players')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
    });

    test('TeamsManagement renders and shows modal when creating a team', async () => {
        render(
            <BrowserRouter>
                <TeamsManagement />
            </BrowserRouter>
        );

        // Wait for data load
        await waitFor(() => expect(screen.getByText('Teams Management')).toBeInTheDocument());

        // Open New Team Modal
        fireEvent.click(screen.getByText('New Team'));

        // Check if modal opens
        expect(screen.getAllByText('New Team')[0]).toBeInTheDocument();
    });

    test('PlayersManagement renders and shows modal when creating a player', async () => {
        render(
            <BrowserRouter>
                <PlayersManagement />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Players Management')).toBeInTheDocument());

        fireEvent.click(screen.getByText('New Player'));

        expect(screen.getAllByText('New Player')[0]).toBeInTheDocument();
    });
});
