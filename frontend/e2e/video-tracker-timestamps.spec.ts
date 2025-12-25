import { test, expect } from '@playwright/test';

test.describe('VideoMatchTracker timestamps', () => {
  test('saves event with synchronized match and video timestamps', async ({ page }) => {
    const matchId = 'test-video-match';
    const events: any[] = [];
    let lastEvent: any = null;

    await page.addInitScript(() => {
      const fixedVideoTime = 160;
      class PlayerStub {
        options: any;
        constructor(_id: string, options: any) {
          this.options = options;
          setTimeout(() => options?.events?.onReady?.({ target: this }), 0);
        }
        getCurrentTime() {
          return fixedVideoTime;
        }
        seekTo() {}
        playVideo() {}
        pauseVideo() {}
        destroy() {}
      }
      // @ts-expect-error - test stub for the YouTube API
      window.YT = {
        Player: PlayerStub,
        PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3 },
      };
    });

    await page.route('**/api/matches/test-video-match', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: matchId,
            isFinished: false,
            homeScore: 0,
            awayScore: 0,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            firstHalfVideoStart: 100,
            secondHalfVideoStart: null,
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
        return;
      }
      if (method === 'PATCH') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }
      await route.fallback();
    });

    await page.route('**/api/game-events/match/test-video-match', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(events),
        });
        return;
      }
      await route.fallback();
    });

    await page.route('**/api/game-events', async route => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      lastEvent = await route.request().postDataJSON();
      const id = `e-${events.length + 1}`;
      events.push({
        id,
        ...lastEvent,
        player: { name: 'test-Player 1', number: 10 },
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id }),
      });
    });

    await page.goto(`/video-tracker/${matchId}`);

    await expect(page.getByText('01:00')).toBeVisible();

    await page.getByTestId('home-team-card').click();
    await page.getByRole('button', { name: /10 test-player 1/i }).click();
    await page.getByRole('button', { name: /^goal$/i }).click();
    await page.getByRole('button', { name: /add event/i }).click();

    await expect.poll(() => lastEvent?.timestamp).toBe(60);
    await expect.poll(() => lastEvent?.videoTimestamp).toBe(160);
  });
});
