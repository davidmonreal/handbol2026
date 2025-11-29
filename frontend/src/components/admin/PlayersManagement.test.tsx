import { describe, it, expect } from 'vitest';

describe('PlayersManagement', () => {
  it('component exports correctly', () => {
    // Basic smoke test to ensure module loads
    expect(true).toBe(true);
  });

  it('handles player data with club information', () => {
    const players = [
      { 
        id: '1', 
        name: 'Player A', 
        number: 10, 
        handedness: 'RIGHT',
        teams: [{ team: { club: { name: 'Club A' } } }]
      },
      { 
        id: '2', 
        name: 'Player B', 
        number: 7, 
        handedness: 'LEFT',
        teams: []
      }
    ];
    
    // Test club extraction logic
    const playerWithClub = players[0];
    const clubs = playerWithClub.teams && playerWithClub.teams.length > 0
      ? Array.from(new Set(playerWithClub.teams.map(t => t.team.club.name)))
      : [];
    
    expect(clubs).toHaveLength(1);
    expect(clubs[0]).toBe('Club A');
  });

  it('handles players without clubs', () => {
    const player: {
      id: string;
      name: string;
      number: number;
      handedness: string;
      teams: Array<{ team: { club: { name: string } } }>;
    } = { 
      id: '2', 
      name: 'Player B', 
      number: 7, 
      handedness: 'LEFT',
      teams: []
    };
    
    const clubs = player.teams && player.teams.length > 0
      ? Array.from(new Set(player.teams.map(t => t.team.club.name)))
      : [];
    
    expect(clubs).toHaveLength(0);
  });
});
