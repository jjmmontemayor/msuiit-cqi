-- Reporting views for CQI attainment rollups.
--
-- These are intentionally NOT modeled as Prisma models/tables: they are pure
-- aggregations over clo_attainments + clo_plo_mappings + mapping_levels, so
-- storing them would create update anomalies (the derived value could go
-- stale relative to the raw scores).
--
-- This file is the human-readable copy for reference. It is kept in sync
-- with migrations/<timestamp>_add_reporting_views/migration.sql (and the
-- later migrations/<timestamp>_update_reporting_views_for_cohort_scoped_mapping,
-- migrations/<timestamp>_add_curriculum_versions, and
-- migrations/<timestamp>_mapping_levels_by_id), which is what actually
-- creates/updates these views in every environment via `prisma migrate
-- deploy` — no manual psql step needed. If you change the view definitions,
-- update both files and add a new migration for changes made after the
-- initial one.
--
-- See ../../docs/schema.md for the full rationale.

-- Average score per (course, CLO), across all enrollments in any offering of
-- that course. Equivalent to a per-CLO cell in the "CLO Attainment" columns
-- of the "PLO Attainment by Courses" sheet. Not cohort-scoped: raw CLO
-- scores don't depend on which batch's CLO->PLO mapping is in effect.
CREATE OR REPLACE VIEW v_clo_attainment_by_course AS
SELECT
    c.id            AS course_id,
    c.code          AS course_code,
    clo.id          AS clo_id,
    clo.code        AS clo_code,
    AVG(ca.score)   AS avg_score,
    COUNT(ca.score)::int AS attainment_count
FROM clo_attainments ca
JOIN clos clo             ON clo.id = ca.clo_id
JOIN course_offerings co  ON co.id = (
    SELECT e.course_offering_id FROM enrollments e WHERE e.id = ca.enrollment_id
)
JOIN courses c             ON c.id = co.course_id
GROUP BY c.id, c.code, clo.id, clo.code;

-- Weighted rollup of a course's CLO attainments into each PLO it maps to,
-- weighted by the mapping's level (mapping_levels.weight, program-defined --
-- historically I=1/P=2/D=3, but admins can add/edit/delete levels freely).
-- Equivalent to "PLO Attainment by Courses". Joins clo_plo_mappings directly
-- (not via performance indicators) since a CLO->PLO mapping can exist before
-- any PI is defined.
--
-- clo_plo_mappings is scoped per curriculum version, not per cohort
-- directly (curricula get revised over time, and multiple cohorts can share
-- a version) -- so each attainment is matched to the mapping in effect for
-- the version the student's own cohort is assigned to, via
-- cpm.curriculum_version_id = coh.curriculum_version_id. A cohort with no
-- version assigned yet simply produces no rows here. The rollup is grouped
-- per (course, cohort, PLO) rather than just (course, PLO) — averaging
-- across cohorts on different versions would mix incompatible schemes.
-- New columns are appended at the end of each SELECT list rather than
-- inserted among the existing ones: CREATE OR REPLACE VIEW requires
-- pre-existing columns to keep their name, order, and type.
CREATE OR REPLACE VIEW v_plo_attainment_by_course AS
SELECT
    c.id                                                        AS course_id,
    c.code                                                      AS course_code,
    plo.id                                                      AS plo_id,
    plo.code                                                    AS plo_code,
    SUM(ca.score * ml.weight) / NULLIF(SUM(ml.weight), 0)       AS weighted_attainment,
    COUNT(DISTINCT ca.id)::int                                  AS attainment_count,
    coh.id                                                      AS cohort_id,
    coh.code                                                    AS cohort_code
FROM clo_attainments ca
JOIN clos clo               ON clo.id = ca.clo_id
JOIN enrollments e          ON e.id = ca.enrollment_id
JOIN students s              ON s.id = e.student_id
JOIN cohorts coh             ON coh.id = s.cohort_id
JOIN course_offerings co    ON co.id = e.course_offering_id
JOIN courses c               ON c.id = co.course_id
JOIN clo_plo_mappings cpm    ON cpm.clo_id = clo.id AND cpm.curriculum_version_id = coh.curriculum_version_id
JOIN plos plo                 ON plo.id = cpm.plo_id
JOIN mapping_levels ml        ON ml.id = cpm.mapping_level_id
GROUP BY c.id, c.code, plo.id, plo.code, coh.id, coh.code;

-- Weighted rollup of a student's CLO scores (across all their enrollments)
-- into each PLO. Equivalent to "PLO Attainment by Students". A student
-- belongs to exactly one cohort, so the mapping join is pinned to that
-- cohort's assigned curriculum version's mapping set.
CREATE OR REPLACE VIEW v_plo_attainment_by_student AS
SELECT
    s.id                                                        AS student_id,
    s.student_number                                            AS student_number,
    plo.id                                                      AS plo_id,
    plo.code                                                    AS plo_code,
    SUM(ca.score * ml.weight) / NULLIF(SUM(ml.weight), 0)       AS weighted_attainment,
    COUNT(DISTINCT ca.id)::int                                  AS attainment_count,
    s.cohort_id                                                 AS cohort_id
FROM clo_attainments ca
JOIN enrollments e             ON e.id = ca.enrollment_id
JOIN students s                 ON s.id = e.student_id
JOIN cohorts coh                ON coh.id = s.cohort_id
JOIN clo_plo_mappings cpm       ON cpm.clo_id = ca.clo_id AND cpm.curriculum_version_id = coh.curriculum_version_id
JOIN plos plo                    ON plo.id = cpm.plo_id
JOIN mapping_levels ml           ON ml.id = cpm.mapping_level_id
GROUP BY s.id, s.student_number, plo.id, plo.code, s.cohort_id;

-- Program-wide average per PLO across all courses, equivalent to the
-- workbook's "All Courses" / "Program Performance" summary row, reported per
-- cohort since the underlying course rollup is now per-cohort too.
CREATE OR REPLACE VIEW v_program_plo_performance AS
SELECT
    plo.program_id                    AS program_id,
    plo.id                            AS plo_id,
    plo.code                          AS plo_code,
    AVG(vpac.weighted_attainment)     AS program_avg_attainment,
    vpac.cohort_id                    AS cohort_id,
    vpac.cohort_code                  AS cohort_code
FROM v_plo_attainment_by_course vpac
JOIN plos plo ON plo.id = vpac.plo_id
GROUP BY plo.program_id, plo.id, plo.code, vpac.cohort_id, vpac.cohort_code;
