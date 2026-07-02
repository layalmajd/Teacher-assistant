# Free Deployment Guide

This project is a full-stack app:

- Frontend: React + Vite static app
- Backend: FastAPI Docker service
- Database: PostgreSQL
- Runtime uploads: local filesystem under `STORAGE_ROOT`

## Recommended Free Stack

Use separate free services:

- Frontend: Vercel Hobby project
- Backend: Render free Web Service using `backend/Dockerfile`
- Database: Neon Free Postgres

This avoids Render's 30-day limit for free Postgres and keeps the frontend on a static hosting platform.

## Files Added for Deployment

- `render.yaml`: Render Blueprint for the FastAPI Docker backend.
- `frontend/vercel.json`: Vercel project config for the Vite frontend and SPA routing.

Render Blueprints expect `render.yaml` in the repository root. Vercel should import the same repository with the project root set to `frontend`.

## Deployment Order

1. Push the project to GitHub.
2. Create the Neon Postgres database and copy the connection string.
3. Deploy the backend on Render using `render.yaml`.
4. Deploy the frontend on Vercel using `frontend` as the root directory.
5. Update backend `CORS_ORIGINS` with the final Vercel domain.
6. Smoke test login/register and `/api/v1/health`.

## Required Environment Variables

Backend service:

```text
APP_ENV=production
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
JWT_SECRET_KEY=<long-random-secret>
JWT_REFRESH_SECRET_KEY=<different-long-random-secret>
API_KEY_ENCRYPTION_KEY=<fernet-key>
CORS_ORIGINS=https://<your-frontend-domain>
CORS_ORIGIN_REGEX=^https://[a-z0-9-]+\.vercel\.app$
STORAGE_ROOT=/app/uploads
SEED_DEMO_USER=false
DATABASE_POOL_RECYCLE_SECONDS=300
BATCH_MAX_PARALLEL_EVALUATIONS=2
BATCH_MAX_PARALLEL_EVALUATIONS_GROQ=1
BATCH_RATE_LIMIT_RETRY_ATTEMPTS=3
BATCH_RATE_LIMIT_RETRY_BASE_SECONDS=2
```

Frontend service:

```text
VITE_API_URL=https://<your-backend-domain>/api/v1
```

Generate `API_KEY_ENCRYPTION_KEY` locally:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Service Settings

### Backend on Render

- Use Blueprint: `render.yaml`
- Service name: `automated-project-evaluation-api`
- Runtime: Docker
- Plan: Free
- Root directory: `backend`
- Health check path: `/api/v1/health`

The backend Dockerfile uses `${PORT:-8000}`, so it works with platforms that inject a `PORT` environment variable.

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`

The `frontend/vercel.json` file also rewrites all routes to `index.html`, which is required for direct browser refresh on React Router pages.

## Important Limitations

- Render free Web Services spin down after inactivity, so the first request after a pause can be slow.
- Files saved to local disk on free container hosting are not durable across redeploys. The app caches extracted submission text in Postgres, but original uploaded files should be treated as temporary unless object storage is added.
- Do not use the demo Docker secrets in production. Generate new values for all secrets.
- If public users will upload real student work, confirm consent/privacy requirements before collecting files.
- Keep `CORS_ORIGIN_REGEX` only for the testing phase if you want Vercel preview URLs to work. For stricter production, clear it and keep only the exact frontend URL in `CORS_ORIGINS`.

## Usage Monitoring Already Available

The app already stores:

- Dashboard totals and recent activity
- Provider usage logs
- Audit logs for auth, uploads, groups, providers, preferences, and evaluations

For product analytics such as page views and click flows, add a privacy-friendly analytics tool later, for example Plausible or PostHog, after deciding what events you actually need.
