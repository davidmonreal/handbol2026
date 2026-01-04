/// <reference types="node" />
import { describe, it, expect } from 'vitest';

describe('Player Info Resolution Tests', () => {
    // Mock data structures
    const mockMatchData = {
        homeTeam: {
            players: [
                { player: { id: 'p1', name: 'Home Player 1' }, number: 10 },
                { player: { id: 'p2', name: 'Home Player 2' }, number: 20 },
            ]
        },
        awayTeam: {
            players: [
                { player: { id: 'p3', name: 'Away Player 1' }, number: 30 },
                { player: { id: 'p4', name: 'Away Player 2' }, number: 40 },
            ]
        }
    };

    const mockEvents = [
        { playerId: 'p1', playerName: 'Event Player 1', playerNumber: 10 },
        { playerId: 'p5', playerName: 'Event Player 5', playerNumber: 50 }, // Player only in events
    ];

    const mockContextTeam = {
        players: [
            { player: { id: 'p1', name: 'Context Player 1' }, number: 10 },
        ]
    };

    // The logic we want to test (extracted from Statistics.tsx)
    const getPlayerInfo = (
        playerId: string,
        matchId: string | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchData: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchEvents: any[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: any[],
        activeTeamId: string | null
    ) => {
        // 1. Try to find in matchData (API structure)
        if (matchId && matchData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const findInTeam = (team: any) => team?.players?.find((p: any) => p.player?.id === playerId);

            const homePlayer = findInTeam(matchData.homeTeam);
            if (homePlayer) return { name: homePlayer.player.name, number: homePlayer.number };

            const awayPlayer = findInTeam(matchData.awayTeam);
            if (awayPlayer) return { name: awayPlayer.player.name, number: awayPlayer.number };
        }

        // 2. Try to find in events
        const sourceEvents = matchId ? matchEvents : events;
        const eventWithPlayer = sourceEvents.find(e => e.playerId === playerId && e.playerName);
        if (eventWithPlayer) {
            return { name: eventWithPlayer.playerName!, number: eventWithPlayer.playerNumber };
        }

        // 3. Fallback to context/mock data (simplified for test)
        if (activeTeamId) {
        const player = mockContextTeam.players.find(p => p.player.id === playerId);
        return player ? { name: player.player.name, number: player.number } : { name: 'Unknown', number: undefined };
        }

        return { name: 'Unknown', number: undefined };
    };

    it('should resolve player from matchData home team', () => {
        const info = getPlayerInfo('p1', 'match-1', mockMatchData, [], [], null);
        expect(info.name).toBe('Home Player 1');
        expect(info.number).toBe(10);
    });

    it('should resolve player from matchData away team', () => {
        const info = getPlayerInfo('p3', 'match-1', mockMatchData, [], [], null);
        expect(info.name).toBe('Away Player 1');
        expect(info.number).toBe(30);
    });

    it('should resolve player from events if not in matchData', () => {
        const info = getPlayerInfo('p5', 'match-1', mockMatchData, mockEvents, [], null);
        expect(info.name).toBe('Event Player 5');
        expect(info.number).toBe(50);
    });

    it('should fallback to context data if no matchId', () => {
        const info = getPlayerInfo('p1', null, null, [], [], 'active-team');
        expect(info.name).toBe('Context Player 1');
        expect(info.number).toBe(10);
    });

    it('should return Unknown if player not found anywhere', () => {
        const info = getPlayerInfo('non-existent', 'match-1', mockMatchData, [], [], null);
        expect(info.name).toBe('Unknown');
        expect(info.number).toBeUndefined();
    });
});
