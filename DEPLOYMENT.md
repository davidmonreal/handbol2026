# Deploying to Vercel

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. Git repository connected to Vercel

## Step 1: Set up Vercel Postgres Database

1. Go to your Vercel dashboard
2. Click on "Storage" → "Create Database"
3. Select "Postgres" and create a new database
4. Copy the connection string (it will be added automatically to your project)

## Step 2: Deploy Backend

```bash
cd my-project
vercel
```

Follow the prompts:
- Link to existing project or create new
- Set up environment variables (will be auto-configured if using Vercel Postgres)

### Environment Variables for Backend

The following will be auto-configured by Vercel Postgres:
- `DATABASE_URL` - PostgreSQL connection string

## Step 3: Deploy Frontend

```bash
cd frontend
vercel
```

### Environment Variables for Frontend

Add this in the Vercel dashboard under your frontend project settings:
- `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.vercel.app`)

## Step 4: Run Database Migrations

After deploying the backend for the first time:

1. Go to your backend project in Vercel dashboard
2. Go to "Settings" → "Functions"
3. Add environment variable:
   - `DATABASE_URL` should already be set by Vercel Postgres

Run migrations via Vercel CLI:
```bash
cd my-project
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed  # Optional: seed the database
```

## Local Development with PostgreSQL

To develop locally with PostgreSQL instead of SQLite:

1. Install PostgreSQL locally or use Docker:
```bash
docker run --name handbol-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=handbol2026 -p 5432:5432 -d postgres
```

2. Create `.env` file in `my-project`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/handbol2026?schema=public"
PORT=3000
```

3. Run migrations:
```bash
cd my-project
npx prisma migrate dev
npx prisma db seed
```

4. Start the backend:
```bash
npm run start
```

5. Update frontend `.env`:
```
VITE_API_URL=http://localhost:3000
```

6. Start the frontend:
```bash
cd ../frontend
npm run dev
```

## Troubleshooting

### "Cannot find module '@vercel/node'"
Run `npm install` in the `my-project` directory.

### Database connection errors
1. Check that `DATABASE_URL` is set in Vercel environment variables
2. Verify migrations have been run: `npx prisma migrate deploy`

### CORS errors
The backend is configured to allow all origins with `cors()`. For production, you may want to restrict this to your frontend domain.

### API not working
1. Check Vercel function logs in the dashboard
2. Verify environment variables are set
3. Ensure the backend deployment succeeded

## Production Checklist

- [ ] Backend deployed to Vercel
- [ ] Vercel Postgres database created and connected
- [ ] Database migrations run
- [ ] Frontend deployed to Vercel
- [ ] Frontend `VITE_API_URL` points to backend
- [ ] Test all API endpoints work
- [ ] Seed database if needed

## Useful Commands

```bash
# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# View deployment logs
vercel logs [deployment-url]

# Redeploy
vercel --prod
```
