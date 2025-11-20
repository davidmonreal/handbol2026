---
name: "Millora: Afegir proves HTTP amb Supertest"
about: Configurar proves d'integració per a rutes Express
title: "test(api): afegir proves HTTP amb Supertest"
labels: [enhancement, testing]
assignees: ""
---

## Context
Volem validar els endpoints d'Express (p. ex. `GET /`) amb proves d'integració.

## Tasques
- [ ] Afegir `supertest` i `@types/supertest` com a devDependencies.
- [ ] Exposar l'`app` d'Express sense escoltar el port (export des de `src/app.ts`).
- [ ] Crear `tests/app.spec.ts` amb casos bàsics (200 OK i cos previst).
- [ ] Afegir script `test:integration` si cal.

## Criteris d'acceptació
- [ ] Les proves passen amb `npm test` i en CI.
- [ ] Cobertura mínima 80% per a rutes noves/modificades.

## Notes
- Evitar arrencar el servidor real a les proves; utilitzar l'`app` exportat.

