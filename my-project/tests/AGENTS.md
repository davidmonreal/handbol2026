# Tests Guidelines

- Empra factories de dades (`tests/factories/*.ts`) per fer els casos llegibles i consistents; evita literals repetits en els payloads.
- Escriu tests que assegurin signatures de repositoris (paràmetres `select`/`where`) i wiring de rutes (`createXRouter`); els expect han d’expressar explícitament què es demana a la BBDD.
- Per a validació, cobreix tant camins feliços com errors de payload amb missatges esperats (coherents amb Zod/middleware).
- Mantén els tests curts i amb noms declaratius; separa unit/integració segons carpeta (`tests/integration/...` per fluxos complets).
- Evita mocks excessius quan hi ha factories/helpers; però mockeja dependències externes (Prisma/OpenAI) per aïllar el comportament.
- Qualsevol nom d’entitat creat a tests (clubs/equips/temporades/jugadors) ha de començar per `test-` per facilitar la neteja de dades.
