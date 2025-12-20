# Repositories Guidelines

- Prefer `select` amb els camps mínims necessaris; evita `include` profund. Si només cal validar existència, fes `findUnique`/`findMany` amb `select: { id: true }`.
- Per multiples checks de dependències, agrupa en un sol `findMany` amb `where: { id: { in: [...] } }` abans que diverses crides separades.
- No carreguis col·leccions grans si no són imprescindibles per la vista retornada (p.ex. no incloure `players` complets quan només calen IDs o counts).
- Quan derivis camps (p.ex. `zone` a events), calcula'ls al repositori i documenta-ho en comentaris breus.
- Escriu tests de repositori que verifiquin els `select`/`where` esperats per cada mètode; manté'ls en `tests/*-repository.test.ts`.
