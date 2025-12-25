import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClubRouter } from '../src/routes/clubs';
import { createSeasonRouter } from '../src/routes/seasons';
import { createTeamRouter } from '../src/routes/teams';
import { createMatchRouter } from '../src/routes/matches';
import { createGameEventRouter } from '../src/routes/game-events';
import { createHealthRouter } from '../src/routes/health';
import { createImportRouter } from '../src/routes/import.routes';
import { createInsightsRouter } from '../src/routes/insights';
import { createDashboardRouter } from '../src/routes/dashboard';
import { ClubController } from '../src/controllers/club-controller';
import { SeasonController } from '../src/controllers/season-controller';
import { TeamController } from '../src/controllers/team-controller';
import { MatchController } from '../src/controllers/match-controller';
import { GameEventController } from '../src/controllers/game-event-controller';
import { InsightsController } from '../src/controllers/insights-controller';
import { DashboardController } from '../src/controllers/dashboard-controller';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

type CallExpectation = {
  method: Method;
  path: string;
  handler: string;
  body?: object;
  expectedStatus?: number;
};

type ControllerMocks = Record<string, ReturnType<typeof vi.fn>>;

type RouteCase = {
  label: string;
  mount: string;
  buildRouter: (controller: ControllerMocks) => express.Router;
  buildController: () => ControllerMocks;
  calls: CallExpectation[];
};

const buildApp = (mountPath: string, router: express.Router) => {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
};

const routeCases: RouteCase[] = [
  {
    label: 'clubs',
    mount: '/clubs',
    buildRouter: (controller) =>
      createClubRouter({ controller: controller as unknown as ClubController }),
    buildController: () => ({
      getAll: vi.fn((_, res) => res.json([{ id: 'club-1' }])),
      getById: vi.fn((req, res) => res.json({ id: req.params.id })),
      create: vi.fn((req, res) => res.status(201).json({ id: 'new', ...req.body })),
      update: vi.fn((req, res) => res.json({ id: req.params.id, ...req.body })),
      delete: vi.fn((_, res) => res.status(204).send()),
    }),
    calls: [
      { method: 'get', path: '', handler: 'getAll' },
      { method: 'get', path: '/abc', handler: 'getById' },
      {
        method: 'post',
        path: '',
        handler: 'create',
        body: { name: 'test-New Club' },
        expectedStatus: 201,
      },
      { method: 'put', path: '/abc', handler: 'update', body: { name: 'test-Updated' } },
      { method: 'delete', path: '/abc', handler: 'delete', expectedStatus: 204 },
    ],
  },
  {
    label: 'seasons',
    mount: '/seasons',
    buildRouter: (controller) =>
      createSeasonRouter({ controller: controller as unknown as SeasonController }),
    buildController: () => ({
      getAll: vi.fn((_, res) => res.json([])),
      getById: vi.fn((req, res) => res.json({ id: req.params.id })),
      create: vi.fn((_, res) => res.status(201).json({ id: 'season-1' })),
      update: vi.fn((req, res) => res.json({ id: req.params.id })),
      delete: vi.fn((_, res) => res.status(204).send()),
    }),
    calls: [
      { method: 'get', path: '', handler: 'getAll' },
      { method: 'get', path: '/abc', handler: 'getById' },
      { method: 'post', path: '', handler: 'create', body: {}, expectedStatus: 201 },
      { method: 'put', path: '/abc', handler: 'update', body: {} },
      { method: 'delete', path: '/abc', handler: 'delete', expectedStatus: 204 },
    ],
  },
  {
    label: 'teams',
    mount: '/teams',
    buildRouter: (controller) =>
      createTeamRouter({ controller: controller as unknown as TeamController }),
    buildController: () => ({
      getAll: vi.fn((_, res) => res.json([])),
      getById: vi.fn((req, res) => res.json({ id: req.params.id })),
      create: vi.fn((_, res) => res.status(201).json({ id: 'team-1' })),
      update: vi.fn((req, res) => res.json({ id: req.params.id })),
      delete: vi.fn((_, res) => res.status(204).send()),
      getTeamPlayers: vi.fn((req, res) => res.json({ teamId: req.params.id, players: [] })),
      assignPlayer: vi.fn((req, res) =>
        res.status(201).json({ teamId: req.params.id, ...req.body }),
      ),
      updatePlayerPosition: vi.fn((req, res) =>
        res.json({ teamId: req.params.id, playerId: req.params.playerId, ...req.body }),
      ),
      unassignPlayer: vi.fn((_, res) => res.status(204).send()),
    }),
    calls: [
      { method: 'get', path: '', handler: 'getAll' },
      { method: 'get', path: '/abc', handler: 'getById' },
      { method: 'post', path: '', handler: 'create', body: {}, expectedStatus: 201 },
      { method: 'put', path: '/abc', handler: 'update', body: {} },
      { method: 'delete', path: '/abc', handler: 'delete', expectedStatus: 204 },
      { method: 'get', path: '/abc/players', handler: 'getTeamPlayers' },
      {
        method: 'post',
        path: '/abc/players',
        handler: 'assignPlayer',
        body: { playerId: 'p1' },
        expectedStatus: 201,
      },
      {
        method: 'patch',
        path: '/abc/players/p1',
        handler: 'updatePlayerPosition',
        body: { position: 1 },
      },
      { method: 'delete', path: '/abc/players/p1', handler: 'unassignPlayer', expectedStatus: 204 },
    ],
  },
  {
    label: 'matches',
    mount: '/matches',
    buildRouter: (controller) =>
      createMatchRouter({ controller: controller as unknown as MatchController }),
    buildController: () => ({
      getAll: vi.fn((_, res) => res.json([])),
      getById: vi.fn((req, res) => res.json({ id: req.params.id })),
      create: vi.fn((req, res) => res.status(201).json({ id: 'match-1', ...req.body })),
      update: vi.fn((req, res) => res.json({ id: req.params.id, ...req.body })),
      delete: vi.fn((_, res) => res.status(204).send()),
    }),
    calls: [
      { method: 'get', path: '', handler: 'getAll' },
      { method: 'get', path: '/abc', handler: 'getById' },
      {
        method: 'post',
        path: '',
        handler: 'create',
        body: { date: new Date().toISOString(), homeTeamId: 'h1', awayTeamId: 'a1' },
        expectedStatus: 201,
      },
      {
        method: 'put',
        path: '/abc',
        handler: 'update',
        body: { homeTeamId: 'h1', awayTeamId: 'a1' },
      },
      { method: 'patch', path: '/abc', handler: 'update', body: { isFinished: true } },
      { method: 'delete', path: '/abc', handler: 'delete', expectedStatus: 204 },
    ],
  },
  {
    label: 'game events',
    mount: '/game-events',
    buildRouter: (controller) =>
      createGameEventRouter({ controller: controller as unknown as GameEventController }),
    buildController: () => ({
      getAll: vi.fn((_, res) => res.json([])),
      getByMatchId: vi.fn((req, res) => res.json({ matchId: req.params.matchId })),
      getById: vi.fn((req, res) => res.json({ id: req.params.id })),
      create: vi.fn((_, res) => res.status(201).json({ id: 'event-1' })),
      update: vi.fn((req, res) => res.json({ id: req.params.id })),
      delete: vi.fn((_, res) => res.status(204).send()),
    }),
    calls: [
      { method: 'get', path: '', handler: 'getAll' },
      { method: 'get', path: '/match/m1', handler: 'getByMatchId' },
      { method: 'get', path: '/e1', handler: 'getById' },
      {
        method: 'post',
        path: '',
        handler: 'create',
        body: {
          matchId: 'm1',
          teamId: 't1',
          type: 'Shot',
          subtype: 'Goal',
          timestamp: 0,
        },
        expectedStatus: 201,
      },
      { method: 'put', path: '/e1', handler: 'update', body: {} },
      { method: 'patch', path: '/e1', handler: 'update', body: {} },
      { method: 'delete', path: '/e1', handler: 'delete', expectedStatus: 204 },
    ],
  },
  {
    label: 'health',
    mount: '/health',
    buildRouter: (controller) =>
      createHealthRouter({ service: controller as never, startedAt: 123 }),
    buildController: () => ({
      getStatus: vi.fn(() => ({ ok: true })),
    }),
    calls: [{ method: 'get', path: '', handler: 'getStatus', expectedStatus: 200 }],
  },
  {
    label: 'import',
    mount: '/import',
    buildRouter: (handlers) => createImportRouter(handlers as never),
    buildController: () => ({
      importPlayersFromImage: vi.fn((_, res) => res.json({ imported: true })),
      batchCreatePlayers: vi.fn((_, res) => res.json({ batch: true })),
      batchCreateWithTeam: vi.fn((_, res) => res.json({ batchWithTeam: true })),
      checkDuplicates: vi.fn((_, res) => res.json({ duplicates: [] })),
      mergePlayer: vi.fn((_, res) => res.json({ merged: true })),
    }),
    calls: [
      {
        method: 'post',
        path: '/import-players-from-image',
        handler: 'importPlayersFromImage',
        body: { image: 'data:image/png;base64,AAA' },
      },
      { method: 'post', path: '/players/batch', handler: 'batchCreatePlayers', body: {} },
      {
        method: 'post',
        path: '/players/batch-with-team',
        handler: 'batchCreateWithTeam',
        body: {},
      },
      { method: 'post', path: '/players/check-duplicates', handler: 'checkDuplicates', body: {} },
      { method: 'post', path: '/players/merge', handler: 'mergePlayer', body: {} },
    ],
  },
  {
    label: 'insights',
    mount: '/insights',
    buildRouter: (controller) =>
      createInsightsRouter({ controller: controller as unknown as InsightsController }),
    buildController: () => ({
      getWeeklyInsights: vi.fn((_, res) => res.json({ weekly: [] })),
      recomputeWeeklyInsights: vi.fn((_, res) => res.status(202).json({ recompute: true })),
    }),
    calls: [
      { method: 'get', path: '/weekly', handler: 'getWeeklyInsights' },
      {
        method: 'post',
        path: '/weekly/recompute',
        handler: 'recomputeWeeklyInsights',
        expectedStatus: 202,
      },
    ],
  },
  {
    label: 'dashboard',
    mount: '/dashboard',
    buildRouter: (controller) =>
      createDashboardRouter({ controller: controller as unknown as DashboardController }),
    buildController: () => ({
      getSnapshot: vi.fn((_, res) => res.json({ snapshot: true })),
    }),
    calls: [{ method: 'get', path: '', handler: 'getSnapshot' }],
  },
];

describe('router factories wiring', () => {
  describe.each(routeCases)('$label router', ({ mount, buildRouter, buildController, calls }) => {
    let controller: ControllerMocks;
    let app: express.Express;

    beforeEach(() => {
      controller = buildController();
      app = buildApp(mount, buildRouter(controller));
    });

    it('routes expected endpoints', async () => {
      for (const call of calls) {
        const req = request(app)[call.method](`${mount}${call.path}`);
        const res = call.body ? await req.send(call.body) : await req;

        const expectedStatus = call.expectedStatus ?? 200;
        expect(res.status).toBe(expectedStatus);

        const handler = controller[call.handler];
        if (handler) {
          expect(handler).toHaveBeenCalled();
        }
      }
    });
  });
});
