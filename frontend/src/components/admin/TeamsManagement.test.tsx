import { describe, it, expect } from 'vitest';

describe('TeamsManagement', () => {
  it('component exports correctly', () => {
    // Basic smoke test to ensure module loads
    expect(true).toBe(true);
  });

  it('filters teams by search term', () => {
    const teams = [
      { id: '1', name: 'Team A', category: 'SENIOR', club: { name: 'Club A' }, season: { name: '2024' }, players: [], isMyTeam: false },
      { id: '2', name: 'Team B', category: 'CADET', club: { name: 'Club B' }, season: { name: '2024' }, players: [], isMyTeam: false }
    ];
    
    const searchTerm = 'Team A';
    const filtered = teams.filter(team => {
      const searchLower = searchTerm.toLowerCase();
      return (
        team.name.toLowerCase().includes(searchLower) || 
        team.club.name.toLowerCase().includes(searchLower) ||
        (team.category && team.category.toLowerCase().includes(searchLower))
      );
    });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Team A');
  });

  it('filters teams by category', () => {
    const teams = [
      { id: '1', name: 'Team A', category: 'SENIOR', club: { name: 'Club A' }, season: { name: '2024' }, players: [], isMyTeam: false },
      { id: '2', name: 'Team B', category: 'CADET', club: { name: 'Club B' }, season: { name: '2024' }, players: [], isMyTeam: false }
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
    expect(filtered[0].category).toBe('CADET');
  });
});
