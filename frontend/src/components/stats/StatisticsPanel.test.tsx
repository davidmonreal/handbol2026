import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { MatchEvent } from '../../types';
import { StatisticsPanel } from './StatisticsPanel';

describe('StatisticsPanel', () => {
  it('shows trend indicators when summary baselines are provided', () => {
    const events: MatchEvent[] = [
      {
        id: '1',
        timestamp: 10,
        playerId: 'p1',
        teamId: 't1',
        category: 'Shot',
        action: 'Goal',
        zone: '6m-CB',
      },
      {
        id: '2',
        timestamp: 20,
        playerId: 'p1',
        teamId: 't1',
        category: 'Shot',
        action: 'Miss',
        zone: '6m-CB',
      },
      {
        id: '3',
        timestamp: 30,
        playerId: 'p1',
        teamId: 't1',
        category: 'Turnover',
        action: 'Bad Pass',
      },
    ];

    render(
      <StatisticsPanel
        data={{ events, title: 'Player Stats', context: 'player' }}
        comparison={{
          summaryBaselines: {
            goalsVsShots: 0.1,
            goalsVsPlays: 0.9,
            missesVsPlays: null,
            turnoversVsPlays: null,
            foulsVsPlays: null,
          },
        }}
      />
    );

    expect(document.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
  });
});
