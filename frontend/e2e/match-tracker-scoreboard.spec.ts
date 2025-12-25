import { test, expect } from '@playwright/test';

test.describe('MatchTracker scoreboard live goal lifecycle', () => {
  test('user creates a goal and deletes it, ending clean', async ({ page }) => {
    const matchId = 'test-match';

    // In-memory fake backend state
    const events: any[] = [];

    const startTime = Date.now() - 60_000;

    // Stub match details
    await page.route('**/api/matches/test-match', async route => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: matchId,
          isFinished: false,
          homeScore: 0,
          awayScore: 0,
          realTimeFirstHalfStart: startTime,
          realTimeSecondHalfStart: null,
          realTimeFirstHalfEnd: null,
          realTimeSecondHalfEnd: null,
          homeTeam: {
            id: 'team-home',
            name: 'test-Home Team',
            category: 'CADET',
            club: { name: 'test-Club A' },
            players: [
              { player: { id: 'p1', name: 'test-Player 1', number: 10, isGoalkeeper: false }, role: 'CB' },
            ],
          },
          awayTeam: {
            id: 'team-away',
            name: 'test-Away Team',
            category: 'JUVENIL',
            club: { name: 'test-Club B' },
            players: [
              { player: { id: 'p2', name: 'test-Player 2', number: 12, isGoalkeeper: true }, role: 'GK' },
            ],
          },
        }),
      });
    });

    // Stub events (GET/POST/DELETE) with in-memory list
    await page.route('**/api/game-events/match/test-match', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(events),
        });
      } else {
        route.fallback();
      }
    });

    await page.route('**/api/game-events', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = await route.request().postDataJSON();
      const id = `e-${events.length + 1}`;
      events.push({
        id,
        timestamp: body.timestamp,
        playerId: body.playerId,
        teamId: body.teamId,
        type: body.type,
        subtype: body.subtype,
        player: { name: 'Player 1', number: 10 },
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id }),
      });
    });

    await page.route('**/api/game-events/*', async route => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      const id = route.request().url().split('/').pop();
      const idx = events.findIndex(e => e.id === id);
      if (idx >= 0) {
        events.splice(idx, 1);
      } else if (events.length > 0) {
        // If frontend uses a local-only ID, still clear backend list to end clean
        events.shift();
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/match-tracker/${matchId}`);

    // Initial scoreboard empty
    await expect(page.getByTestId('home-score')).toHaveText('0');

    // Select home team to enable event form
    await page.getByTestId('home-team-card').click();

    // Create a goal
    await page.getByRole('button', { name: /10 test-player 1/i }).click();
    await page.getByRole('button', { name: /^goal$/i }).click();
    await page.getByRole('button', { name: /add event/i }).click();

    await expect(page.getByTestId('home-score')).toHaveText('1');
    const eventButton = page.getByTestId(/event-item-/).first();
    await expect(eventButton).toBeVisible();

    // Delete the created event
    await eventButton.click();
    await page.getByTestId('delete-event-button').click();
    await page.getByTestId('confirmation-confirm-button').click();

    await expect(page.getByTestId('home-score')).toHaveText('0');
    await expect(page.getByText('No events recorded yet')).toBeVisible();
    expect(events).toHaveLength(0);
  });
});
