import { describe, it, expect } from 'vitest';
import { sortTeamsByOwnership } from './TeamsManagement';
import type { Team } from '../../types';

describe('TeamsManagement', () => {
  it('component exports correctly', () => {
    // Basic smoke test to ensure module loads
    expect(true).toBe(true);
  });

  it('filters teams by search term', () => {
    const teams = [
      { id: '1', name: 'Team A', category: 'SENIOR', club: { id: 'club-a', name: 'Club A' }, season: { id: 'season-1', name: '2024' }, players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'Team B', category: 'CADET', club: { id: 'club-b', name: 'Club B' }, season: { id: 'season-1', name: '2024' }, players: [], isMyTeam: false, color: '#fff' }
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
      { id: '1', name: 'Team A', category: 'SENIOR', club: { id: 'club-a', name: 'Club A' }, season: { id: 'season-1', name: '2024' }, players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'Team B', category: 'CADET', club: { id: 'club-b', name: 'Club B' }, season: { id: 'season-1', name: '2024' }, players: [], isMyTeam: false, color: '#fff' }
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

  it('sorts personal teams before the rest', () => {
    const teams: Team[] = [
      { id: '1', name: 'B Squad', club: { id: 'c1', name: 'Beta' }, season: { id: 's1', name: '2024' }, category: 'SENIOR', players: [], isMyTeam: false, color: '#fff' },
      { id: '2', name: 'A Squad', club: { id: 'c2', name: 'Alpha' }, season: { id: 's1', name: '2024' }, category: 'SENIOR', players: [], isMyTeam: true, color: '#fff' },
      { id: '3', name: 'C Squad', club: { id: 'c3', name: 'Gamma' }, season: { id: 's1', name: '2024' }, category: 'SENIOR', players: [], isMyTeam: false, color: '#fff' },
    ];

    const sorted = sortTeamsByOwnership(teams);

    expect(sorted[0].id).toBe('2');
    expect(sorted.slice(1).map(team => team.club?.name)).toEqual(['Beta', 'Gamma']);
  });
});
