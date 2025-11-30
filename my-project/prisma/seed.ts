/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.gameEvent.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.playerTeamSeason.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.player.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.club.deleteMany({});

  // Create Clubs (3 existing + 5 new = 8 total)
  const mataro = await prisma.club.create({ data: { name: 'Mataró' } });
  const barca = await prisma.club.create({ data: { name: 'FC Barcelona' } });
  const granollers = await prisma.club.create({ data: { name: 'BM Granollers' } });
  const sabadell = await prisma.club.create({ data: { name: 'Handbol Sabadell' } });
  const terrassa = await prisma.club.create({ data: { name: 'BM Terrassa' } });
  const lleida = await prisma.club.create({ data: { name: 'Fraikin BM Lleida' } });
  const huesca = await prisma.club.create({ data: { name: 'Bada Huesca' } });
  const logrono = await prisma.club.create({ data: { name: 'Logroño' } });

  console.log('✅ Created 8 clubs');

  // Create Seasons (2 existing + 5 new = 7 total)
  const season2425 = await prisma.season.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
    },
  });

  const season2324 = await prisma.season.create({
    data: {
      name: '2023-2024',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
    },
  });

  const season2223 = await prisma.season.create({
    data: {
      name: '2022-2023',
      startDate: new Date('2022-09-01'),
      endDate: new Date('2023-06-30'),
    },
  });

  const season2122 = await prisma.season.create({
    data: {
      name: '2021-2022',
      startDate: new Date('2021-09-01'),
      endDate: new Date('2022-06-30'),
    },
  });

  const season2021 = await prisma.season.create({
    data: {
      name: '2020-2021',
      startDate: new Date('2020-09-01'),
      endDate: new Date('2021-06-30'),
    },
  });

  const season1920 = await prisma.season.create({
    data: {
      name: '2019-2020',
      startDate: new Date('2019-09-01'),
      endDate: new Date('2020-06-30'),
    },
  });

  const season1819 = await prisma.season.create({
    data: {
      name: '2018-2019',
      startDate: new Date('2018-09-01'),
      endDate: new Date('2019-06-30'),
    },
  });

  console.log('✅ Created 7 seasons');

  // Create Players (14 existing + 50 new = 64 total)
  const playerNames = [
    // Existing players
    { name: 'Martí Monreal', number: 21, handedness: 'RIGHT' },
    { name: 'Guillem Cuartero', number: 31, handedness: 'LEFT' },
    { name: 'Pol Rossell', number: 30, handedness: 'RIGHT' },
    { name: 'Guim', number: 33, handedness: 'RIGHT' },
    { name: 'Marc Garcia', number: 7, handedness: 'RIGHT' },
    { name: 'Joan López', number: 10, handedness: 'LEFT' },
    { name: 'Albert Martínez', number: 15, handedness: 'RIGHT' },
    { name: 'Pau Rodríguez', number: 3, handedness: 'LEFT' },
    { name: 'David Sánchez', number: 12, handedness: 'RIGHT' },
    { name: 'Carlos Fernández', number: 9, handedness: 'RIGHT' },
    { name: 'Jordi Vila', number: 5, handedness: 'LEFT' },
    { name: 'Gerard Pons', number: 21, handedness: 'RIGHT' },
    { name: 'Àlex Soler', number: 8, handedness: 'LEFT' },
    { name: 'Sergi Roca', number: 14, handedness: 'RIGHT' },
    // New players
    { name: 'Oriol Martí', number: 1, handedness: 'RIGHT' },
    { name: 'Arnau Vidal', number: 2, handedness: 'LEFT' },
    { name: 'Biel Torres', number: 4, handedness: 'RIGHT' },
    { name: 'Nil Camps', number: 6, handedness: 'LEFT' },
    { name: 'Roger Puig', number: 11, handedness: 'RIGHT' },
    { name: 'Adrià Sala', number: 13, handedness: 'LEFT' },
    { name: 'Miquel Roig', number: 16, handedness: 'RIGHT' },
    { name: 'Bernat Coll', number: 17, handedness: 'LEFT' },
    { name: 'Toni Mas', number: 18, handedness: 'RIGHT' },
    { name: 'Lluís Font', number: 19, handedness: 'LEFT' },
    { name: 'Pere Mir', number: 20, handedness: 'RIGHT' },
    { name: 'Raül Bosch', number: 22, handedness: 'LEFT' },
    { name: 'Enric Pla', number: 23, handedness: 'RIGHT' },
    { name: 'Xavi Ribas', number: 24, handedness: 'LEFT' },
    { name: 'Dani Casas', number: 25, handedness: 'RIGHT' },
    { name: 'Ivan Mora', number: 26, handedness: 'LEFT' },
    { name: 'Ferran Soler', number: 27, handedness: 'RIGHT' },
    { name: 'Aleix Pujol', number: 28, handedness: 'LEFT' },
    { name: 'Carles Gual', number: 29, handedness: 'RIGHT' },
    { name: 'Andreu Fàbregas', number: 32, handedness: 'LEFT' },
    { name: 'Jaume Serra', number: 34, handedness: 'RIGHT' },
    { name: 'Manel Riera', number: 35, handedness: 'LEFT' },
    { name: 'Vicenç Compte', number: 36, handedness: 'RIGHT' },
    { name: 'Francesc Batlle', number: 37, handedness: 'LEFT' },
    { name: 'Josep Lluch', number: 38, handedness: 'RIGHT' },
    { name: 'Esteve Parera', number: 39, handedness: 'LEFT' },
    { name: 'Joaquim Valls', number: 40, handedness: 'RIGHT' },
    { name: 'Ramon Casanovas', number: 41, handedness: 'LEFT' },
    { name: 'Ignasi Bonet', number: 42, handedness: 'RIGHT' },
    { name: 'Llorenç Prats', number: 43, handedness: 'LEFT' },
    { name: 'Salvador Mestre', number: 44, handedness: 'RIGHT' },
    { name: 'Tomàs Olivella', number: 45, handedness: 'LEFT' },
    { name: 'Valentí Carbonell', number: 46, handedness: 'RIGHT' },
    { name: 'Cristòfol Rius', number: 47, handedness: 'LEFT' },
    { name: 'Baldomer Camps', number: 48, handedness: 'RIGHT' },
    { name: 'Isidre Molina', number: 49, handedness: 'LEFT' },
    { name: 'Narcís Ferrer', number: 50, handedness: 'RIGHT' },
    { name: 'Oleguer Simó', number: 51, handedness: 'LEFT' },
    { name: 'Quirze Nadal', number: 52, handedness: 'RIGHT' },
    { name: 'Sebastià Tort', number: 53, handedness: 'LEFT' },
    { name: 'Urbà Colom', number: 54, handedness: 'RIGHT' },
    { name: 'Vicent Blanch', number: 55, handedness: 'LEFT' },
    { name: 'Abelard Grau', number: 56, handedness: 'RIGHT' },
    { name: 'Bartomeu Llopis', number: 57, handedness: 'LEFT' },
    { name: 'Cebrià Martorell', number: 58, handedness: 'RIGHT' },
    { name: 'Domènec Pascual', number: 59, handedness: 'LEFT' },
    { name: 'Ermengol Saura', number: 60, handedness: 'RIGHT' },
    { name: 'Felip Vendrell', number: 61, handedness: 'LEFT' },
    { name: 'Gaietà Corominas', number: 62, handedness: 'RIGHT' },
    { name: 'Hilari Montserrat', number: 63, handedness: 'LEFT' },
    { name: 'Innocenci Piera', number: 64, handedness: 'RIGHT' },
  ];

  const players = [];
  for (const playerData of playerNames) {
    const player = await prisma.player.create({ data: playerData });
    players.push(player);
  }

  console.log(`✅ Created ${players.length} players`);

  // Create Teams (5 new teams)
  const teamGrocMataro = await prisma.team.create({
    data: {
      name: 'Groc',
      category: 'CADET',
      clubId: mataro.id,
      seasonId: season2425.id,
      isMyTeam: true,
    },
  });

  const teamNegreMataro = await prisma.team.create({
    data: {
      name: 'Negre',
      category: 'CADET',
      clubId: mataro.id,
      seasonId: season2425.id,
      isMyTeam: false,
    },
  });

  const teamBarcaB = await prisma.team.create({
    data: {
      name: 'Barça B',
      category: 'JUVENIL',
      clubId: barca.id,
      seasonId: season2425.id,
      isMyTeam: false,
    },
  });

  const teamGranollers = await prisma.team.create({
    data: {
      name: 'Granollers Cadet A',
      category: 'CADET',
      clubId: granollers.id,
      seasonId: season2425.id,
      isMyTeam: false,
    },
  });

  const teamSabadell = await prisma.team.create({
    data: {
      name: 'Sabadell Infantil',
      category: 'INFANTIL',
      clubId: sabadell.id,
      seasonId: season2425.id,
      isMyTeam: false,
    },
  });

  console.log('✅ Created 5 teams');

  // Assign players to teams
  const teamGrocPlayers = players.slice(0, 12);
  const teamNegrePlayers = players.slice(12, 24);
  const teamBarcaPlayers = players.slice(24, 36);
  const teamGranollersPlayers = players.slice(36, 48);
  const teamSabadellPlayers = players.slice(48, 60);

  for (const player of teamGrocPlayers) {
    await prisma.playerTeamSeason.create({
      data: {
        playerId: player.id,
        teamId: teamGrocMataro.id,
        role: 'Player',
      },
    });
  }

  for (const player of teamNegrePlayers) {
    await prisma.playerTeamSeason.create({
      data: {
        playerId: player.id,
        teamId: teamNegreMataro.id,
        role: 'Player',
      },
    });
  }

  for (const player of teamBarcaPlayers) {
    await prisma.playerTeamSeason.create({
      data: {
        playerId: player.id,
        teamId: teamBarcaB.id,
        role: 'Player',
      },
    });
  }

  for (const player of teamGranollersPlayers) {
    await prisma.playerTeamSeason.create({
      data: {
        playerId: player.id,
        teamId: teamGranollers.id,
        role: 'Player',
      },
    });
  }

  for (const player of teamSabadellPlayers) {
    await prisma.playerTeamSeason.create({
      data: {
        playerId: player.id,
        teamId: teamSabadell.id,
        role: 'Player',
      },
    });
  }

  console.log('✅ Assigned players to teams');

  // Create 5 Matches
  const matches = [];

  const match1 = await prisma.match.create({
    data: {
      date: new Date('2024-11-15T18:00:00'),
      homeTeamId: teamGrocMataro.id,
      awayTeamId: teamNegreMataro.id,
      isFinished: true,
    },
  });
  matches.push(match1);

  const match2 = await prisma.match.create({
    data: {
      date: new Date('2024-11-22T19:00:00'),
      homeTeamId: teamGrocMataro.id,
      awayTeamId: teamGranollers.id,
      isFinished: true,
    },
  });
  matches.push(match2);

  const match3 = await prisma.match.create({
    data: {
      date: new Date('2024-11-29T18:30:00'),
      homeTeamId: teamBarcaB.id,
      awayTeamId: teamGrocMataro.id,
      isFinished: false,
    },
  });
  matches.push(match3);

  const match4 = await prisma.match.create({
    data: {
      date: new Date('2024-12-06T20:00:00'),
      homeTeamId: teamGranollers.id,
      awayTeamId: teamNegreMataro.id,
      isFinished: false,
    },
  });
  matches.push(match4);

  const match5 = await prisma.match.create({
    data: {
      date: new Date('2024-12-13T17:00:00'),
      homeTeamId: teamSabadell.id,
      awayTeamId: teamBarcaB.id,
      isFinished: false,
    },
  });
  matches.push(match5);

  console.log('✅ Created 5 matches');

  // Create 30 game events for each match
  // Only use positions that map to valid zones (removed PIVOT)
  const positions = ['LW', 'LB', 'CB', 'RB', 'RW'];
  // Only use distances that map to valid zones (removed COUNTER)
  const distances = ['6M', '9M', '7M'];
  const goalZones = ['TL', 'TM', 'TR', 'ML', 'MM', 'MR', 'BL', 'BM', 'BR'];
  const missSubtypes = ['OUT', 'SAVED', 'POST'];
  const sanctionTypes = ['Yellow', '2min', 'Red'];

  for (const match of matches) {
    const homeTeamPlayers =
      match.id === match1.id
        ? teamGrocPlayers
        : match.id === match2.id
          ? teamGrocPlayers
          : match.id === match3.id
            ? teamBarcaPlayers
            : match.id === match4.id
              ? teamGranollersPlayers
              : teamSabadellPlayers;

    const awayTeamPlayers =
      match.id === match1.id
        ? teamNegrePlayers
        : match.id === match2.id
          ? teamGranollersPlayers
          : match.id === match3.id
            ? teamGrocPlayers
            : match.id === match4.id
              ? teamNegrePlayers
              : teamBarcaPlayers;

    for (let i = 0; i < 30; i++) {
      const isHomeTeam = Math.random() > 0.5;
      const teamPlayers = isHomeTeam ? homeTeamPlayers : awayTeamPlayers;
      const teamId = isHomeTeam ? match.homeTeamId : match.awayTeamId;
      const player = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];

      // Use frontend-compatible event types
      const eventTypes = ['Shot', 'Shot', 'Turnover', 'Sanction']; // More shots than other events
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      const eventData: any = {
        matchId: match.id,
        timestamp: Math.floor(Math.random() * 3600), // Random time in match
        playerId: player.id,
        teamId: teamId,
        type: eventType,
        isCollective: Math.random() > 0.6,
        hasOpposition: Math.random() > 0.3,
        isCounterAttack: Math.random() > 0.8,
      };

      if (eventType === 'Shot') {
        eventData.distance = distances[Math.floor(Math.random() * distances.length)];

        // Filter positions based on distance
        let validPositions = positions;
        if (eventData.distance === '9M') {
          // 9m shots only from LB, CB, RB
          validPositions = ['LB', 'CB', 'RB'];
        } else if (eventData.distance === '7M') {
          // Position doesn't matter for 7m, but let's keep it clean
          validPositions = ['CB'];
        }

        eventData.position = validPositions[Math.floor(Math.random() * validPositions.length)];
        eventData.goalZone = goalZones[Math.floor(Math.random() * goalZones.length)];

        // Randomly decide if it's a goal or miss
        const shotResults = ['Goal', 'Save', 'Miss', 'Post'];
        eventData.subtype = shotResults[Math.floor(Math.random() * shotResults.length)];
      } else if (eventType === 'Turnover') {
        eventData.subtype = ['Pass', 'Steps', 'Double', 'Area'][Math.floor(Math.random() * 4)];
      } else if (eventType === 'Sanction') {
        eventData.sanctionType = sanctionTypes[Math.floor(Math.random() * sanctionTypes.length)];
        // subtype is not needed as we use sanctionType for action
      }

      await prisma.gameEvent.create({ data: eventData });
    }

    // Calculate and update match score
    const matchEvents = await prisma.gameEvent.findMany({
      where: { matchId: match.id, type: 'Shot', subtype: 'Goal' },
    });

    const homeGoals = matchEvents.filter((e) => e.teamId === match.homeTeamId).length;
    const awayGoals = matchEvents.filter((e) => e.teamId === match.awayTeamId).length;

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeScore: homeGoals,
        awayScore: awayGoals,
      },
    });
  }

  console.log('✅ Created 150 game events (30 per match)');
  console.log('🎉 Seeding completed!');
  console.log(
    `📊 Summary: 8 clubs, 7 seasons, ${players.length} players, 5 teams, 5 matches, 150 events`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
