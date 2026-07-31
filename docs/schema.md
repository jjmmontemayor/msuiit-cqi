# CQI Data Model

Source data audited from `docs/source-data/Program Assessment and Evaluation (by
Courses and Students) CLO to PLO Version.xlsx` (BSCS, batch 2022–2025, 99 students,
28 courses × 3 CLOs each, 11 PLOs). The workbook mixes true source data with derived
rollups computed by spreadsheet formulas; this schema stores only the source data and
recomputes rollups as SQL views, so there is exactly one place each fact can be wrong.

## Mapping workbook sheets → schema

| Sheet | Nature | Schema equivalent |
|---|---|---|
| `CLO_Attainments` | raw fact | `clo_attainments` table |
| `Mapping` | raw fact (CLO→PLO, I/P/D) | `clo_plo_mappings` table |
| `MapWeight` | static lookup, not real data | `mapping_levels` seed table (I=1, P=2, D=3) |
| `PLO Attainment by Courses` | derived | `v_plo_attainment_by_course` view |
| `PLO Attainment by Students` | derived | `v_plo_attainment_by_student` view |
| `PLO Attainment Evaluation` | narrative, faculty-entered | `pi_evaluations` table |

## Entity-relationship diagram

```mermaid
erDiagram
    PROGRAMS ||--o{ CURRICULUM_COURSES : offers
    PROGRAMS ||--o{ PLOS : defines
    PROGRAMS ||--o{ COHORTS : has
    PROGRAMS ||--o{ STUDENTS : enrolls
    PROGRAMS ||--o{ USER_PROGRAM_ROLES : scopes

    COURSES ||--o{ CURRICULUM_COURSES : "used in"
    COURSES ||--o{ CLOS : defines
    COURSES ||--o{ COURSE_OFFERINGS : "offered as"

    PLOS ||--o{ PERFORMANCE_INDICATORS : "broken into"
    PLOS ||--o{ CLO_PLO_MAPPINGS : "mapped from"
    PERFORMANCE_INDICATORS |o--o{ CLO_PLO_MAPPINGS : "optionally refines"
    CLOS ||--o{ CLO_PLO_MAPPINGS : "maps to"
    MAPPING_LEVELS ||--o{ CLO_PLO_MAPPINGS : weights

    COHORTS ||--o{ STUDENTS : groups
    STUDENTS ||--o{ ENROLLMENTS : has
    COURSE_OFFERINGS ||--o{ ENROLLMENTS : fills
    ACADEMIC_TERMS ||--o{ COURSE_OFFERINGS : schedules

    ENROLLMENTS ||--o{ CLO_ATTAINMENTS : scores
    CLOS ||--o{ CLO_ATTAINMENTS : "scored on"

    PERFORMANCE_INDICATORS ||--o{ PI_EVALUATIONS : "evaluated per cohort"
    COHORTS ||--o{ PI_EVALUATIONS : "evaluated in"
    USERS ||--o{ PI_EVALUATIONS : authors
    USERS ||--o{ USER_PROGRAM_ROLES : holds

    PROGRAMS {
        uuid id PK
        text code
        text name
        text description
    }
    COURSES {
        uuid id PK
        text code
        text title
        text description
    }
    MAPPING_LEVELS {
        text code PK "I | P | D"
        text label
        int weight
    }
    ACADEMIC_TERMS {
        uuid id PK
        int school_year_start
        int school_year_end
        text semester "1 | 2 | summer"
        text label
    }
    CURRICULUM_COURSES {
        uuid id PK
        uuid program_id FK
        uuid course_id FK
        text elective_group "nullable, e.g. Elective 1"
        int year_level
        text term
        int display_order
        bool is_active
    }
    PLOS {
        uuid id PK
        uuid program_id FK
        text code "PLO1.."
        text description
        int display_order
    }
    PERFORMANCE_INDICATORS {
        uuid id PK
        uuid plo_id FK
        text code "PI1.."
        text description
        int display_order
    }
    CLOS {
        uuid id PK
        uuid course_id FK
        text code "CLO1.."
        text description
        int display_order
    }
    CLO_PLO_MAPPINGS {
        uuid id PK
        uuid clo_id FK
        uuid plo_id FK
        text level_code FK
        uuid pi_id FK "nullable"
        text assessment_method "nullable"
    }
    COHORTS {
        uuid id PK
        uuid program_id FK
        text code "2022-2025"
        int start_year
        int end_year
        text description
    }
    STUDENTS {
        uuid id PK
        text student_number
        text first_name
        text last_name
        uuid program_id FK
        uuid cohort_id FK
        text status "active | graduated | withdrawn"
    }
    COURSE_OFFERINGS {
        uuid id PK
        uuid course_id FK
        uuid academic_term_id FK
        text section "nullable"
        text instructor_name "nullable"
    }
    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid course_offering_id FK
    }
    CLO_ATTAINMENTS {
        uuid id PK
        uuid enrollment_id FK
        uuid clo_id FK
        numeric score "0-100"
    }
    PI_EVALUATIONS {
        uuid id PK
        uuid pi_id FK
        uuid cohort_id FK
        text benchmark_description
        numeric target_percentage
        text results_narrative
        text status "draft | final"
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    USERS {
        uuid id PK
        text email
        text password_hash
        text full_name
        bool is_active
    }
    USER_PROGRAM_ROLES {
        uuid id PK
        uuid user_id FK
        uuid program_id FK
        text role "admin | program_chair | faculty | viewer"
    }
```

## Table notes

### Catalog (institution-wide, program-independent)

- **`courses`** is a global catalog, not owned by a program — the same course code
  (e.g. `CCC100`) can be part of multiple programs' curricula. `curriculum_courses`
  is the join that puts a course into a specific program's curriculum, carrying the
  "Elective N" slot label from the workbook (`elective_group`) so an elective slot's
  chosen course can change between curriculum revisions without altering history.
- **`mapping_levels`** seeds exactly three rows (`I`/1, `P`/2, `D`/3), replacing the
  `MapWeight` sheet. Because it's a lookup joined at query time, changing a weighting
  scheme later doesn't require rewriting historical mapping data.
- **`academic_terms`** exists for real record-keeping (which semester a course was
  offered) even though the source workbook aggregates by batch only.

### Program structure

- **`plos`** and **`performance_indicators`** are scoped per program
  (`UNIQUE(program_id, code)` / `UNIQUE(plo_id, code)`) since PLO/PI numbering restarts
  per program.
- **`clos`** are scoped per course (`UNIQUE(course_id, code)`), matching the workbook
  where every course independently defines CLO1–CLO3.
- **`clo_plo_mappings`** is the single source of truth for outcome mapping, and links
  a CLO straight to a PLO (`plo_id` required) — matching the `Mapping` sheet, which
  maps every course's CLOs to all 11 PLOs directly with no PI column. `pi_id` is
  **nullable**: it's only set once a PLO has been elaborated into specific Performance
  Indicators (as the `PLO Attainment Evaluation` sheet does — in the source workbook,
  only for PLO1; the other 10 PLOs have no PIs defined yet). Making `pi_id` required
  would have made it impossible to import the other 10 PLOs' mappings at all, since
  their PIs don't exist. `assessment_method` captures the sheet's free-text
  "Assessment Methods" column, when known.

### People and facts

- **`cohorts`** models "Batch 2022 to 2025" as a first-class, program-scoped entity
  rather than a text label, so reporting can be filtered/joined by cohort.
- **`enrollments`** links a student to a specific `course_offering` (course + term +
  section) rather than directly to a course, so a retake in a later term is a distinct
  record.
- **`clo_attainments`** is the only raw numeric fact table (`UNIQUE(enrollment_id,
  clo_id)`), replacing `CLO_Attainments`.

### Evaluation and auth

- **`pi_evaluations`** captures the narrative per PI per cohort (benchmark, target %,
  results) from the `PLO Attainment Evaluation` sheet, with `status` distinguishing
  draft from finalized evaluations and `created_by` giving accountability the
  spreadsheet had no way to track.
- **`users`** / **`user_program_roles`** provide multi-program RBAC (`admin`,
  `program_chair`, `faculty`, `viewer`) — not present in the workbook, but required
  for a real multi-user app where narrative entry needs to be attributable and
  access-controlled per program.

## Derived views (not tables)

Computed on read from `clo_attainments` and `clo_plo_mappings`/`mapping_levels`, so
there is no duplicate storage to keep in sync:

- **`v_clo_attainment_by_course`** — average score per course/CLO across all
  enrollments.
- **`v_plo_attainment_by_course`** — weighted rollup (by `mapping_levels.weight`) of
  a course's CLO attainments into each mapped PLO. Equivalent to `PLO Attainment by
  Courses`.
- **`v_plo_attainment_by_student`** — weighted rollup of a student's CLO scores
  (across all their enrollments) into each PLO. Equivalent to `PLO Attainment by
  Students`.
- **`v_program_plo_performance`** — program-wide average per PLO across all courses,
  equivalent to the workbook's "All Courses" / "Program Performance" row.

See `msuiit-cqi-api/prisma/views.sql` for the SQL definitions.
