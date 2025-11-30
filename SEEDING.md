# Database Seeding

This project includes database seeding with dummy data for testing and development.

## Running the Seed

To populate the database with test data, run:

```bash
cd my-project
npx prisma db seed
```

## Seed Data

The seed creates:
- **3 Clubs**: Mataró, FC Barcelona, BM Granollers
- **2 Seasons**: 2024-2025, 2023-2024
- **10 Players**: Various handball players with different numbers and handedness

## Reset Database

To clear and reseed the database:

```bash
cd my-project
npx prisma migrate reset
```

This will:
1. Drop the database
2. Run all migrations
3. Automatically run the seed (due to the `prisma.seed` configuration in package.json)

## Modify Seed Data

Edit `my-project/prisma/seed.ts` to change the dummy data.
