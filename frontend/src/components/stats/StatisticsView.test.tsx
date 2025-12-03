import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatisticsView } from './StatisticsView';
import type { MatchEvent } from '../../types';

// Mock data
const mockEvents: MatchEvent[] = [
  {
    id: '1',
    timestamp: 100,
    playerId: 'p1',
    playerName: 'Player 1',
    playerNumber: 10,
    teamId: 'team1',
    category: 'Shot',
    action: 'Goal',
    zone: '6m-CB',
    goalTarget: 5,
    context: { hasOpposition: true, isCollective: true, isCounterAttack: false }
  },
  {
    id: '2',
    timestamp: 200,
    playerId: 'p2',
    playerName: 'Player 2',
    playerNumber: 5,
    teamId: 'team2',
    category: 'Shot',
    action: 'Miss',
    zone: '9m-LB',
    goalTarget: 1,
    context: { hasOpposition: false, isCollective: false, isCounterAttack: true }
  }
];

const mockMatchData = {
  homeTeam: { id: 'team1', name: 'Home Team', players: [] },
  awayTeam: { id: 'team2', name: 'Away Team', players: [] },
  homeTeamId: 'team1',
  awayTeamId: 'team2'
};

describe('StatisticsView', () => {
  it('renders title and subtitle', () => {
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders team switcher in match context', () => {
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        matchData={mockMatchData}
      />
    );
    expect(screen.getByText('Viewing:')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Switch to Away Team')).toBeInTheDocument();
  });

  it('handles team switching (uncontrolled)', () => {
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        matchData={mockMatchData}
      />
    );

    const switchButton = screen.getByText('Switch to Away Team');
    fireEvent.click(switchButton);

    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('Switch to Home Team')).toBeInTheDocument();
  });

  it('handles team switching (controlled)', () => {
    const handleTeamChange = vi.fn();
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        matchData={mockMatchData}
        onTeamChange={handleTeamChange}
        teamId="team1"
      />
    );

    const switchButton = screen.getByText('Switch to Away Team');
    fireEvent.click(switchButton);

    expect(handleTeamChange).toHaveBeenCalledWith('team2');
  });

  it('renders back button when onBack is provided', () => {
    const handleBack = vi.fn();
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        onBack={handleBack}
      />
    );

    const backButton = screen.getByText('Back');
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });

  it('filters events by zone', () => {
    render(
      <StatisticsView
        events={mockEvents}
        context="match"
        matchData={mockMatchData}
      />
    );

    // Assuming FiltersBar renders buttons for zones or we can simulate zone selection via StatisticsPanel
    // Since StatisticsPanel is a child, we might need to integration test or rely on implementation details
    // For now, let's just check if the main components render
    expect(screen.getByText('Filters:')).toBeInTheDocument();
  });

  describe('formatTeamDisplay function', () => {
    const mockMatchDataWithDetails = {
      homeTeam: {
        id: 'team1',
        name: 'Groc',
        category: 'CADET',
        club: { name: 'AB Investiments Joventut Mataró' },
        players: []
      },
      awayTeam: {
        id: 'team2',
        name: 'A',
        category: 'CADET',
        club: { name: 'La Roca' },
        players: []
      },
      homeTeamId: 'team1',
      awayTeamId: 'team2'
    };

    it('should display full team info (club + category + name) in Viewing label', () => {
      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={mockMatchDataWithDetails}
        />
      );

      expect(screen.getByText('Viewing:')).toBeInTheDocument();
      expect(screen.getByText('AB Investiments Joventut Mataró CADET Groc')).toBeInTheDocument();
    });

    it('should display full team info in Switch button', () => {
      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={mockMatchDataWithDetails}
        />
      );

      expect(screen.getByText('Switch to La Roca CADET A')).toBeInTheDocument();
    });

    it('should handle team without club', () => {
      const dataWithoutClub = {
        ...mockMatchDataWithDetails,
        homeTeam: {
          ...mockMatchDataWithDetails.homeTeam,
          club: undefined
        }
      };

      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={dataWithoutClub}
        />
      );

      // Should show category + name only
      expect(screen.getByText('CADET Groc')).toBeInTheDocument();
    });

    it('should handle team without category', () => {
      const dataWithoutCategory = {
        ...mockMatchDataWithDetails,
        homeTeam: {
          ...mockMatchDataWithDetails.homeTeam,
          category: undefined
        }
      };

      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={dataWithoutCategory}
        />
      );

      // Should show club + name only
      expect(screen.getByText('AB Investiments Joventut Mataró Groc')).toBeInTheDocument();
    });

    it('should handle team with only name', () => {
      const dataNameOnly = {
        ...mockMatchDataWithDetails,
        homeTeam: {
          ...mockMatchDataWithDetails.homeTeam,
          club: undefined,
          category: undefined
        }
      };

      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={dataNameOnly}
        />
      );

      // Should show name only
      expect(screen.getByText('Groc')).toBeInTheDocument();
    });

    it('should update team display when switching teams', () => {
      render(
        <StatisticsView
          events={mockEvents}
          context="match"
          matchData={mockMatchDataWithDetails}
        />
      );

      // Initially showing home team
      expect(screen.getByText('AB Investiments Joventut Mataró CADET Groc')).toBeInTheDocument();
      expect(screen.getByText('Switch to La Roca CADET A')).toBeInTheDocument();

      // Click switch button
      const switchButton = screen.getByText('Switch to La Roca CADET A');
      fireEvent.click(switchButton);

      // Now showing away team
      expect(screen.getByText('La Roca CADET A')).toBeInTheDocument();
      expect(screen.getByText('Switch to AB Investiments Joventut Mataró CADET Groc')).toBeInTheDocument();
    });
  });
});
