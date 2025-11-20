---
name: "Millora: Husky + lint-staged"
about: Afegir hooks pre-commit per garantir qualitat de codi
title: "build(lint): configurar Husky i lint-staged"
labels: [enhancement, tooling]
assignees: ""
---

## Context
Assegurar que els commits passen lint/format i, opcionalment, proves ràpides.

## Tasques
- [ ] Afegir `husky` i `lint-staged` com a devDependencies.
- [ ] Inicialitzar Husky (`npx husky install`) i afegir script `prepare` a `package.json`.
- [ ] Configurar `lint-staged` per executar `eslint --fix` i `prettier --write` sobre fitxers staged.
- [ ] (Opcional) Executar `vitest --run --reporter dot` en pre-commit.

## Criteris d'acceptació
- [ ] El hook `pre-commit` bloqueja canvis que no passen lint/format.
- [ ] Documentació breu en `AGENTS.md` o `README.md`.

## Exemple de config `lint-staged`
```
{
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{md,json}": ["prettier --write"]
}
```

