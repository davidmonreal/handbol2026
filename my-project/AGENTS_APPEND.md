## Arquitectura, SOLID i TDD

Per mantenir el projecte sostenible i fàcil de modificar, seguim aquestes normes concretes:

1. Estructura de fitxers i tests juntament amb el codi

- Col·loqueu els tests propers al codi que proven. Ideal: tests al costat del mòdul (`src/module/x.ts` i `src/module/x.spec.ts` o `src/module/__tests__/x.spec.ts`). Això facilita refactors i assegura que els documents que canvien junts viuen junts.

2. SOLID i patrons de disseny

- Respecteu els principis SOLID per definir responsabilitats clares. Quan un patró de disseny millori la separació de preocupacions o la testabilitat (p. ex. Strategy per variar comportaments, Factory per crear dependències), utilitzeu-lo i afegiu una línia a la PR explicant la raó.

3. Reutilització i factorització

- Eviteu duplicació: extreu utilitats i components comuns a mòduls reutilitzables. Sempre preferiu composition over inheritance quan sigui possible.

4. TDD i nivell de cobertura

- Desenvolupeu en mode TDD: escriviu tests automàtics abans d’implementar. Els tests han de cobrir units crítiques i fluxos d’integració. Per canvis nous o modificats, apunteu a una cobertura alta (recomanat 85–90% per l’àrea afectada).

5. Tipus de tests i eines

- Unit tests: Vitest per al frontend i backend per a codi aïllat.
- Integració/API: Supertest + Vitest per validar rutes i integracions amb Prisma/DB.
- E2E: afegir solució quan els fluxos el requereixin (opcional).
- CI: assegureu-vos que la pipeline corre `prisma generate` si cal i executa tests amb la mateixa configuració que local (`npm ci && npm test`).

6. PRs i verificació

- A la PR incloeu: com provar localment, quins tests s’han afegit, i una justificació si s’ha aplicat un patró de disseny. No tanqueu la PR fins que tots els tests passin i la cobertura requerida estigui complerta per les files modificades.
