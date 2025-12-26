# Controllers Guidelines

- Tota entrada d’API ha de passar per validació Zod (`validateRequest` o `schema.safeParse`) amb missatges coherents; no dispersis `if`/`throw` dins dels mètodes.
- Mantén els mètodes curts: extreu parsejos (paginació, normalitzacions) a helpers amb nom semàntic i reutilitza'ls.
- No instanciïs dependències dins del controlador; usa els routers factory (`createXRouter`) per injectar serveis/repos.
- Gestiona errors amb missatges estables (constants) i codis adequats (400 per validació, 404 per not found, 500 per inesperats); evita literals repetits.
- Afegeix comentaris només per decisions d’enginyeria/negoci no trivials (p.ex. motius d’un bloqueig o missatge concret).

## Controladors: Arrow Functions

Fes servir **Arrow Functions** per a tots els mètodes del controlador. Això elimina la necessitat de fer `.bind(this)` al constructor i garanteix que `this` es manté correcte quan es passa als router.

✅ **Correcte:**

```typescript
class MatchController {
  constructor(private service: MatchService) {}

  // Arrow function: `this` està bindejat automàticament
  getAll = async (req: Request, res: Response) => {
    const data = await this.service.getAll();
    res.json(data);
  };
}
```

❌ **Incorrecte:**

```typescript
class MatchController {
  constructor(private service: MatchService) {
    // Boilerplate innecessari
    this.getAll = this.getAll.bind(this);
  }

  // Mètode normal: perd el context `this` si no es bindeja
  async getAll(req: Request, res: Response) {
    // ...
  }
}
```
