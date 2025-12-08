import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GameEventRepository } from '../src/repositories/game-event-repository';
import prisma from '../src/lib/prisma';

describe('GameEvent Zone Derivation', () => {
  const repository = new GameEventRepository();
  let matchId: string;
  let teamId: string;

  beforeAll(async () => {
    // Create test match and team
    const season = await prisma.season.create({
      data: { name: 'Test Season', startDate: new Date(), endDate: new Date() },
    });

    const club = await prisma.club.create({
      data: { name: 'Test Club' },
    });

    const homeTeam = await prisma.team.create({
      data: {
        name: 'Home Team',
        clubId: club.id,
        seasonId: season.id,
      },
    });

    const awayTeam = await prisma.team.create({
      data: {
        name: 'Away Team',
        clubId: club.id,
        seasonId: season.id,
      },
    });

    const match = await prisma.match.create({
      data: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        date: new Date(),
      },
    });

    matchId = match.id;
    teamId = homeTeam.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.gameEvent.deleteMany({ where: { matchId } });
    await prisma.match.deleteMany({ where: { id: matchId } });
  });

  it('should derive zone as "7m" for 7M distance without position', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 100,
      teamId,
      type: 'Shot',
      subtype: 'Goal',
      distance: '7M',
      position: undefined,
      goalZone: 'TM',
    });

    expect(event.zone).toBe('7m');
    expect(event.distance).toBe('7M');
    expect(event.position).toBeNull();
  });

  it('should derive zone as "6m-LW" for 6M distance with LW position', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 101,
      teamId,
      type: 'Shot',
      subtype: 'Goal',
      distance: '6M',
      position: 'LW',
      goalZone: 'TM',
    });

    expect(event.zone).toBe('6m-LW');
    expect(event.distance).toBe('6M');
    expect(event.position).toBe('LW');
  });

  it('should derive zone as "9m-CB" for 9M distance with CB position', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 102,
      teamId,
      type: 'Shot',
      subtype: 'Miss',
      distance: '9M',
      position: 'CB',
      goalZone: 'MM',
    });

    expect(event.zone).toBe('9m-CB');
    expect(event.distance).toBe('9M');
    expect(event.position).toBe('CB');
  });

  it('should set zone to null if distance is missing', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 103,
      teamId,
      type: 'Turnover',
      position: 'LW',
      distance: undefined,
    });

    expect(event.zone).toBeNull();
  });

  it('should set zone to null if position is missing (except for 7M)', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 104,
      teamId,
      type: 'Turnover',
      distance: '6M',
      position: undefined,
    });

    expect(event.zone).toBeNull();
  });

  it('should recalculate zone on update when position changes', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 105,
      teamId,
      type: 'Shot',
      subtype: 'Miss',
      distance: '6M',
      position: 'LW',
    });

    expect(event.zone).toBe('6m-LW');

    // Update position
    const updated = await repository.update(event.id, {
      position: 'RW',
    });

    expect(updated.zone).toBe('6m-RW');
  });

  it('should recalculate zone on update when distance changes', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 106,
      teamId,
      type: 'Shot',
      subtype: 'Miss',
      distance: '6M',
      position: 'CB',
    });

    expect(event.zone).toBe('6m-CB');

    // Update distance
    const updated = await repository.update(event.id, {
      distance: '9M',
    });

    expect(updated.zone).toBe('9m-CB');
  });

  it('should recalculate zone when distance and position change together', async () => {
    const event = await repository.create({
      matchId,
      timestamp: 107,
      teamId,
      type: 'Shot',
      subtype: 'Goal',
      distance: '6M',
      position: 'LW',
    });

    const updated = await repository.update(event.id, {
      distance: '9M',
      position: 'RB',
    });

    expect(updated.zone).toBe('9m-RB');
    expect(updated.distance).toBe('9M');
    expect(updated.position).toBe('RB');
  });
});
