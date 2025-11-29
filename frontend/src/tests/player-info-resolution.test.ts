import { describe, it, expect } from 'vitest';

describe('Player Info Resolution Tests', () => {
    // Mock data structures
    const mockMatchData = {
        homeTeam: {
            players: [
                { player: { id: 'p1', name: 'Home Player 1', number: 10 } },
                { player: { id: 'p2', name: 'Home Player 2', number: 20 } },
            ]
        },
        awayTeam: {
            players: [
                { player: { id: 'p3', name: 'Away Player 1', number: 30 } },
                { player: { id: 'p4', name: 'Away Player 2', number: 40 } },
            ]
        }
    };

    const mockEvents = [
        { playerId: 'p1', playerName: 'Event Player 1', playerNumber: 10 },
        { playerId: 'p5', playerName: 'Event Player 5', playerNumber: 50 }, // Player only in events
    ];

    const mockContextTeam = {
        players: [
            { id: 'p1', name: 'Context Player 1', number: 10 },
        ]
    };

    // The logic we want to test (extracted from Statistics.tsx)
    const getPlayerInfo = (
        playerId: string,
        matchId: string | null,
        matchData: any,
        matchEvents: any[],
        events: any[],
        activeTeamId: string | null,
        homeTeamId: string
    ) => {
        // 1. Try to find in matchData (API structure)
        if (matchId && matchData) {
            const findInTeam = (team: any) => team?.players?.find((p: any) => p.player?.id === playerId)?.player;

            const homePlayer = findInTeam(matchData.homeTeam);
            if (homePlayer) return { name: homePlayer.name, number: homePlayer.number };

            const awayPlayer = findInTeam(matchData.awayTeam);
            if (awayPlayer) return { name: awayPlayer.name, number: awayPlayer.number };
        }

        // 2. Try to find in events
        const sourceEvents = matchId ? matchEvents : events;
        const eventWithPlayer = sourceEvents.find(e => e.playerId === playerId && e.playerName);
        if (eventWithPlayer) {
            return { name: eventWithPlayer.playerName!, number: eventWithPlayer.playerNumber || 0 };
        }

        // 3. Fallback to context/mock data (simplified for test)
        if (activeTeamId) {
            const player = mockContextTeam.players.find(p => p.id === playerId);
            return player ? { name: player.name, number: player.number } : { name: 'Unknown', number: 0 };
        }

        return { name: 'Unknown', number: 0 };
    };

    it('should resolve player from matchData home team', () => {
        const info = getPlayerInfo('p1', 'match-1', mockMatchData, [], [], null, 'home-id');
        expect(info.name).toBe('Home Player 1');
        expect(info.number).toBe(10);
    });

    it('should resolve player from matchData away team', () => {
        const info = getPlayerInfo('p3', 'match-1', mockMatchData, [], [], null, 'home-id');
        expect(info.name).toBe('Away Player 1');
        expect(info.number).toBe(30);
    });

    it('should resolve player from events if not in matchData', () => {
        const info = getPlayerInfo('p5', 'match-1', mockMatchData, mockEvents, [], null, 'home-id');
        expect(info.name).toBe('Event Player 5');
        expect(info.number).toBe(50);
    });

    it('should fallback to context data if no matchId', () => {
        const info = getPlayerInfo('p1', null, null, [], [], 'active-team', 'home-id');
        expect(info.name).toBe('Context Player 1');
        expect(info.number).toBe(10);
    });

    it('should return Unknown if player not found anywhere', () => {
        const info = getPlayerInfo('non-existent', 'match-1', mockMatchData, [], [], null, 'home-id');
        expect(info.name).toBe('Unknown');
        expect(info.number).toBe(0);
    });
});
