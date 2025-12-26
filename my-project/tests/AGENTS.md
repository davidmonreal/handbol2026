# Tests Guidelines

- Empra factories de dades (`tests/factories/*.ts`) per fer els casos llegibles i consistents; evita literals repetits en els payloads.
- Escriu tests que assegurin signatures de repositoris (paràmetres `select`/`where`) i wiring de rutes (`createXRouter`); els expect han d’expressar explícitament què es demana a la BBDD.
- Per a validació, cobreix tant camins feliços com errors de payload amb missatges esperats (coherents amb Zod/middleware).
- Mantén els tests curts i amb noms declaratius; separa unit/integració segons carpeta (`tests/integration/...` per fluxos complets).
- Evita mocks excessius quan hi ha factories/helpers; però mockeja dependències externes (Prisma/OpenAI) per aïllar el comportament.
- Qualsevol nom d’entitat creat a tests (clubs/equips/temporades/jugadors) ha de començar per `test-` per facilitar la neteja de dades.

## Testing amb DIP (Service + Repository)

Quan testegis serveis, NO facis mock de Prisma directament. Fes mock dels Repositoris.

### Exemple de Test Unitari (Servei)

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatchService } from '../src/services/match-service';
import { MatchRepository } from '../src/repositories/match-repository';
import { TeamRepository } from '../src/repositories/team-repository';
import { GameEventRepository } from '../src/repositories/game-event-repository';

// 1. Mock dels mòduls de repositori
vi.mock('../src/repositories/match-repository');
vi.mock('../src/repositories/team-repository');
vi.mock('../src/repositories/game-event-repository');

describe('MatchService', () => {
  let service: MatchService;
  // Defineix variables amb els tipus de repositori
  let matchRepository: MatchRepository;
  let teamRepository: TeamRepository;
  let gameEventRepository: GameEventRepository;

  beforeEach(() => {
    // 2. Instancia els mocks
    matchRepository = new MatchRepository();
    teamRepository = new TeamRepository();
    gameEventRepository = new GameEventRepository();

    // 3. Injecta'ls al servei
    service = new MatchService(matchRepository, teamRepository, gameEventRepository);
    vi.clearAllMocks();
  });

  it('crea un partit si els equips existeixen', async () => {
    // 4. Configura el comportament del mock del repositori (NO de prisma)
    vi.mocked(teamRepository.exists).mockResolvedValue(true);
    vi.mocked(matchRepository.create).mockResolvedValue({ id: '1' } as any);

    await service.create({ ... });

    // 5. Verifica la crida al repositori
    expect(matchRepository.create).toHaveBeenCalled();
  });
});
```
