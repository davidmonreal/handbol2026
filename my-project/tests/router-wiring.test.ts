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

const buildApp = (mountPath: string, router: express.Router) => {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
};

describe('router factories wiring', () => {
  describe('clubs', () => {
    let controller: ClubController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getAll: vi.fn((_, res) => res.json([{ id: 'club-1' }])),
        getById: vi.fn((req, res) => res.json({ id: req.params.id })),
        create: vi.fn((req, res) => res.status(201).json({ id: 'new', ...req.body })),
        update: vi.fn((req, res) => res.json({ id: req.params.id, ...req.body })),
        delete: vi.fn((_, res) => res.status(204).send()),
      } as unknown as ClubController;
      app = buildApp('/clubs', createClubRouter({ controller }));
    });

    it('routes CRUD endpoints', async () => {
      await request(app).get('/clubs');
      await request(app).get('/clubs/abc');
      await request(app).post('/clubs').send({ name: 'New Club' });
      await request(app).put('/clubs/abc').send({ name: 'Updated' });
      await request(app).delete('/clubs/abc');

      expect(controller.getAll).toHaveBeenCalled();
      expect(controller.getById).toHaveBeenCalled();
      expect(controller.create).toHaveBeenCalled();
      expect(controller.update).toHaveBeenCalled();
      expect(controller.delete).toHaveBeenCalled();
    });
  });

  describe('seasons', () => {
    let controller: SeasonController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getAll: vi.fn((_, res) => res.json([])),
        getById: vi.fn((req, res) => res.json({ id: req.params.id })),
        create: vi.fn((_, res) => res.status(201).json({ id: 'season-1' })),
        update: vi.fn((req, res) => res.json({ id: req.params.id })),
        delete: vi.fn((_, res) => res.status(204).send()),
      } as unknown as SeasonController;
      app = buildApp('/seasons', createSeasonRouter({ controller }));
    });

    it('routes CRUD endpoints', async () => {
      await request(app).get('/seasons');
      await request(app).get('/seasons/abc');
      await request(app).post('/seasons').send({});
      await request(app).put('/seasons/abc').send({});
      await request(app).delete('/seasons/abc');

      expect(controller.getAll).toHaveBeenCalled();
      expect(controller.getById).toHaveBeenCalled();
      expect(controller.create).toHaveBeenCalled();
      expect(controller.update).toHaveBeenCalled();
      expect(controller.delete).toHaveBeenCalled();
    });
  });

  describe('teams', () => {
    let controller: TeamController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getAll: vi.fn((_, res) => res.json([])),
        getById: vi.fn((req, res) => res.json({ id: req.params.id })),
        create: vi.fn((_, res) => res.status(201).json({ id: 'team-1' })),
        update: vi.fn((req, res) => res.json({ id: req.params.id })),
        delete: vi.fn((_, res) => res.status(204).send()),
        getTeamPlayers: vi.fn((req, res) => res.json({ teamId: req.params.id, players: [] })),
        assignPlayer: vi.fn((req, res) => res.status(201).json({ teamId: req.params.id, ...req.body })),
        unassignPlayer: vi.fn((req, res) => res.status(204).send()),
      } as unknown as TeamController;
      app = buildApp('/teams', createTeamRouter({ controller }));
    });

    it('routes CRUD and player management endpoints', async () => {
      await request(app).get('/teams');
      await request(app).get('/teams/abc');
      await request(app).post('/teams').send({});
      await request(app).put('/teams/abc').send({});
      await request(app).delete('/teams/abc');
      await request(app).get('/teams/abc/players');
      await request(app).post('/teams/abc/players').send({ playerId: 'p1' });
      await request(app).delete('/teams/abc/players/p1');

      expect(controller.getAll).toHaveBeenCalled();
      expect(controller.getById).toHaveBeenCalled();
      expect(controller.create).toHaveBeenCalled();
      expect(controller.update).toHaveBeenCalled();
      expect(controller.delete).toHaveBeenCalled();
      expect(controller.getTeamPlayers).toHaveBeenCalled();
      expect(controller.assignPlayer).toHaveBeenCalled();
      expect(controller.unassignPlayer).toHaveBeenCalled();
    });
  });

  describe('matches', () => {
    let controller: MatchController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getAll: vi.fn((_, res) => res.json([])),
        getById: vi.fn((req, res) => res.json({ id: req.params.id })),
        create: vi.fn((req, res) => res.status(201).json({ id: 'match-1', ...req.body })),
        update: vi.fn((req, res) => res.json({ id: req.params.id, ...req.body })),
        delete: vi.fn((_, res) => res.status(204).send()),
      } as unknown as MatchController;
      app = buildApp('/matches', createMatchRouter({ controller }));
    });

    it('routes CRUD endpoints (including patch)', async () => {
      const basePayload = { date: new Date().toISOString(), homeTeamId: 'h1', awayTeamId: 'a1' };

      await request(app).get('/matches');
      await request(app).get('/matches/abc');
      await request(app).post('/matches').send(basePayload);
      await request(app).put('/matches/abc').send(basePayload);
      await request(app).patch('/matches/abc').send({ isFinished: true });
      await request(app).delete('/matches/abc');

      expect(controller.getAll).toHaveBeenCalled();
      expect(controller.getById).toHaveBeenCalled();
      expect(controller.create).toHaveBeenCalled();
      expect(controller.update).toHaveBeenCalledTimes(2); // put + patch
      expect(controller.delete).toHaveBeenCalled();
    });
  });

  describe('game events', () => {
    let controller: GameEventController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getAll: vi.fn((_, res) => res.json([])),
        getByMatchId: vi.fn((req, res) => res.json({ matchId: req.params.matchId })),
        getById: vi.fn((req, res) => res.json({ id: req.params.id })),
        create: vi.fn((_, res) => res.status(201).json({ id: 'event-1' })),
        update: vi.fn((req, res) => res.json({ id: req.params.id })),
        delete: vi.fn((_, res) => res.status(204).send()),
      } as unknown as GameEventController;
      app = buildApp('/game-events', createGameEventRouter({ controller }));
    });

    it('routes CRUD endpoints and match filter', async () => {
      await request(app).get('/game-events');
      await request(app).get('/game-events/match/m1');
      await request(app).get('/game-events/e1');
      await request(app).post('/game-events').send({});
      await request(app).put('/game-events/e1').send({});
      await request(app).patch('/game-events/e1').send({});
      await request(app).delete('/game-events/e1');

      expect(controller.getAll).toHaveBeenCalled();
      expect(controller.getByMatchId).toHaveBeenCalled();
      expect(controller.getById).toHaveBeenCalled();
      expect(controller.create).toHaveBeenCalled();
      expect(controller.update).toHaveBeenCalledTimes(2); // put + patch
      expect(controller.delete).toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('returns status from injected service', async () => {
      const getStatus = vi.fn().mockReturnValue({ ok: true });
      const service = { getStatus } as unknown as { getStatus: typeof getStatus };
      const app = buildApp('/health', createHealthRouter({ service: service as never, startedAt: 123 }));

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(getStatus).toHaveBeenCalledWith(123, process.env.npm_package_version);
    });
  });

  describe('import', () => {
    it('routes all import endpoints', async () => {
      const handlers = {
        importPlayersFromImage: vi.fn((_, res) => res.json({ imported: true })),
        batchCreatePlayers: vi.fn((_, res) => res.json({ batch: true })),
        batchCreateWithTeam: vi.fn((_, res) => res.json({ batchWithTeam: true })),
        checkDuplicates: vi.fn((_, res) => res.json({ duplicates: [] })),
        mergePlayer: vi.fn((_, res) => res.json({ merged: true })),
      };
      const app = buildApp('/import', createImportRouter(handlers));

      await request(app)
        .post('/import/import-players-from-image')
        .send({ image: 'data:image/png;base64,AAA' });
      await request(app).post('/import/players/batch').send({});
      await request(app).post('/import/players/batch-with-team').send({});
      await request(app).post('/import/players/check-duplicates').send({});
      await request(app).post('/import/players/merge').send({});

      expect(handlers.importPlayersFromImage).toHaveBeenCalled();
      expect(handlers.batchCreatePlayers).toHaveBeenCalled();
      expect(handlers.batchCreateWithTeam).toHaveBeenCalled();
      expect(handlers.checkDuplicates).toHaveBeenCalled();
      expect(handlers.mergePlayer).toHaveBeenCalled();
    });
  });

  describe('insights', () => {
    let controller: InsightsController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getWeeklyInsights: vi.fn((_, res) => res.json({ weekly: [] })),
        recomputeWeeklyInsights: vi.fn((_, res) => res.status(202).json({ recompute: true })),
      } as unknown as InsightsController;
      app = buildApp('/insights', createInsightsRouter({ controller }));
    });

    it('routes insight endpoints', async () => {
      await request(app).get('/insights/weekly');
      await request(app).post('/insights/weekly/recompute');

      expect(controller.getWeeklyInsights).toHaveBeenCalled();
      expect(controller.recomputeWeeklyInsights).toHaveBeenCalled();
    });
  });

  describe('dashboard', () => {
    let controller: DashboardController;
    let app: express.Express;

    beforeEach(() => {
      controller = {
        getSnapshot: vi.fn((_, res) => res.json({ snapshot: true })),
      } as unknown as DashboardController;
      app = buildApp('/dashboard', createDashboardRouter({ controller }));
    });

    it('routes snapshot endpoint', async () => {
      await request(app).get('/dashboard');
      expect(controller.getSnapshot).toHaveBeenCalled();
    });
  });
});
