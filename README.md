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
npx prisma migrate dev
psql "$DATABASE_URL" -f prisma/views.sql   # create reporting views (see prisma/views.sql)
npm run start:dev                          # http://localhost:3001
```

To load the original workbook's data as a starting dataset:

```bash
npm run seed:xlsx
```

### 3. Web (`msuiit-cqi-web`)

```bash
cd msuiit-cqi-web
cp .env.example .env
npm install
npm run dev                                # http://localhost:3000
```

## Data model summary

- **Catalog**: `programs`, `courses`, `mapping_levels` (I/P/D), `academic_terms`
- **Program structure**: `curriculum_courses`, `plos`, `performance_indicators`, `clos`, `clo_pi_mappings`
- **People**: `cohorts`, `students`, `course_offerings`, `enrollments`
- **Facts**: `clo_attainments` (raw scores)
- **Evaluation**: `pi_evaluations` (narrative per PI per cohort)
- **Auth**: `users`, `user_program_roles`
- **Derived**: SQL views for PLO attainment by course / by student, computed from the
  raw facts and mapping weights rather than stored, to avoid update anomalies.

See [`docs/schema.md`](docs/schema.md) for full column definitions and an ER diagram.
