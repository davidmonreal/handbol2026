# Controllers Guidelines

- Tota entrada d’API ha de passar per validació Zod (`validateRequest` o `schema.safeParse`) amb missatges coherents; no dispersis `if`/`throw` dins dels mètodes.
- Mantén els mètodes curts: extreu parsejos (paginació, normalitzacions) a helpers amb nom semàntic i reutilitza'ls.
- No instanciïs dependències dins del controlador; usa els routers factory (`createXRouter`) per injectar serveis/repos.
- Gestiona errors amb missatges estables (constants) i codis adequats (400 per validació, 404 per not found, 500 per inesperats); evita literals repetits.
- Afegeix comentaris només per decisions d’enginyeria/negoci no trivials (p.ex. motius d’un bloqueig o missatge concret).
