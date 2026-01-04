import { test, expect } from '@playwright/test';

test.describe('MatchTracker timestamps', () => {
  test('saves event with live clock timestamp', async ({ page }) => {
    const matchId = 'test-live-match';
    const events: any[] = [];
    let lastEvent: any = null;
    const fixedNow = 1_700_000_000_000;

    await page.addInitScript((now) => {
      Date.now = () => now;
    }, fixedNow);

    await page.route('**/api/matches/test-live-match', async route => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: matchId,
          isFinished: false,
          homeScore: 0,
          awayScore: 0,
          realTimeFirstHalfStart: fixedNow - 60_000,
          realTimeSecondHalfStart: null,
          realTimeFirstHalfEnd: null,
          realTimeSecondHalfEnd: null,
          homeTeam: {
            id: 'team-home',
            name: 'test-Home Team',
            category: 'CADET',
            club: { name: 'test-Club A' },
            players: [
              { player: { id: 'p1', name: 'test-Player 1', isGoalkeeper: false }, number: 10, position: 4 },
            ],
          },
          awayTeam: {
            id: 'team-away',
            name: 'test-Away Team',
            category: 'JUVENIL',
            club: { name: 'test-Club B' },
            players: [
              { player: { id: 'p2', name: 'test-Player 2', isGoalkeeper: true }, number: 12, position: 1 },
            ],
          },
        }),
      });
    });

    await page.route('**/api/game-events/match/test-live-match', async route => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(events),
      });
    });

    await page.route('**/api/game-events', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      lastEvent = await route.request().postDataJSON();
      const id = `e-${events.length + 1}`;
      events.push({
        id,
        ...lastEvent,
        player: { name: 'test-Player 1' },
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id }),
      });
    });

    await page.goto(`/match-tracker/${matchId}`);

    await expect(page.getByText('01:00')).toBeVisible();

    await page.getByTestId('home-team-card').click();
    await page.getByRole('button', { name: /10\s*test-player 1/i }).click();
    await page.getByRole('button', { name: /12\s*test-player 2/i }).click();
    await page.getByRole('button', { name: /^goal$/i }).click();
    await page.getByRole('button', { name: /add event/i }).click();

    await expect.poll(() => lastEvent?.timestamp).toBe(60);
    await expect.poll(() => lastEvent?.videoTimestamp).toBeUndefined();
  });
});
