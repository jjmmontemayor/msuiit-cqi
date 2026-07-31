# MSU-IIT CQI

Web application for MSU-IIT Program Assessment and Evaluation (Continuous Quality
Improvement): mapping Course Learning Outcomes (CLOs) to Program Learning Outcomes
(PLOs), recording student CLO attainment, and reporting PLO attainment by course and
by student. Replaces the manually-maintained "Program Assessment and Evaluation (by
Courses and Students) CLO to PLO" workbook (kept for reference in
`docs/source-data/`).

Schema is generalized to support multiple programs, not just BSCS — see
[`docs/schema.md`](docs/schema.md) for the full data model and rationale.

## Repo layout

```
msuiit-cqi-api/   NestJS + Prisma + PostgreSQL API
msuiit-cqi-web/   Next.js + TypeScript + Tailwind frontend
docs/             schema design (ERD) and reference source data
docker-compose.yml   local PostgreSQL for development
```

## Local development

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. API (`msuiit-cqi-api`)

```bash
cd msuiit-cqi-api
cp .env.example .env
npm install
npx prisma migrate dev                     # creates tables and the reporting views
npm run start:dev                          # http://localhost:3001
```

To load the original workbook's data as a starting dataset:

```bash
npm run seed:xlsx
```

### 3. Web (`msuiit-cqi-web`)

```bash
cd msuiit-cqi-web
cp .env.example .env.local
npm install
npm run dev                                # http://localhost:3000
```

## Data model summary

- **Catalog**: `programs`, `courses`, `mapping_levels` (I/P/D), `academic_terms`
- **Program structure**: `curriculum_courses`, `plos`, `performance_indicators`, `clos`, `clo_plo_mappings`
- **People**: `cohorts`, `students`, `course_offerings`, `enrollments`
- **Facts**: `clo_attainments` (raw scores)
- **Evaluation**: `pi_evaluations` (narrative per PI per cohort)
- **Auth**: `users`, `user_program_roles`
- **Derived**: SQL views for PLO attainment by course / by student, computed from the
  raw facts and mapping weights rather than stored, to avoid update anomalies.

See [`docs/schema.md`](docs/schema.md) for full column definitions and an ER diagram.

## Deployment

API + Postgres on **Railway**, web app on **Cloudflare Workers** (via
[OpenNext](https://opennext.js.org/cloudflare)). Deploy the API first so you
have its public URL for the web app's build-time env var.

### API + Postgres on Railway

1. Create a Postgres database service on Railway (or use Railway's managed
   Postgres plugin) — copy its connection string.
2. Create a service from this repo, **set its Root Directory to
   `msuiit-cqi-api`** in the service settings so Railway finds
   `Dockerfile`/`railway.json` there. Railway auto-detects the Dockerfile
   build via `railway.json`.
3. Set environment variables on the service:
   - `DATABASE_URL` — the Postgres connection string from step 1
   - `JWT_SECRET` — a real random secret (not the dev placeholder)
   - `WEB_ORIGIN` — the Cloudflare Workers URL from the next section
     (comma-separate multiple origins if needed, e.g. a custom domain plus
     the `*.workers.dev` URL)
   - `PORT` — Railway sets this automatically; the app already reads it
4. Deploy. The container's `CMD` runs `prisma migrate deploy` (which also
   creates the reporting views, see `prisma/migrations/*_add_reporting_views`)
   before starting the server, so migrations apply automatically on every
   deploy — no manual DB step needed.
5. Optionally run `npm run seed:xlsx` once via Railway's shell/CLI to load
   the original workbook's data as a starting dataset.

### Web app on Cloudflare Workers

```bash
cd msuiit-cqi-web
npm run cf:build     # builds with OpenNext and bundles the Worker
npm run cf:preview   # optional: run the built Worker locally first
npm run cf:deploy    # builds and deploys via wrangler
```

Before deploying, set `NEXT_PUBLIC_API_URL` to the Railway API's public URL —
either in `.env.local`/`.env.production.local` at build time, or as a
Cloudflare Workers environment variable/secret (`wrangler secret put` or via
the dashboard) if you prefer not to bake it into the build. It must point to
the Railway URL, not `localhost`, for the deployed app to reach the API.

After the first deploy, take the Workers URL Cloudflare gives you
(`https://msuiit-cqi-web.<subdomain>.workers.dev` or your custom domain) and
set it as `WEB_ORIGIN` on the Railway API service so CORS allows requests
from it.
