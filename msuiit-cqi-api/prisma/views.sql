-- Reporting views for CQI attainment rollups.
--
-- These are intentionally NOT modeled as Prisma models/tables: they are pure
-- aggregations over clo_attainments + clo_pi_mappings + mapping_levels, so
-- storing them would create update anomalies (the derived value could go
-- stale relative to the raw scores). Apply after `prisma migrate dev`:
--
--   psql "$DATABASE_URL" -f prisma/views.sql
--
-- See ../../docs/schema.md for the full rationale.

-- Average score per (course, CLO), across all enrollments in any offering of
-- that course. Equivalent to a per-CLO cell in the "CLO Attainment" columns
-- of the "PLO Attainment by Courses" sheet.
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
-- weighted by mapping level (I=1, P=2, D=3). Equivalent to "PLO Attainment
-- by Courses". Joins clo_plo_mappings directly (not via performance
-- indicators) since a CLO->PLO mapping can exist before any PI is defined.
CREATE OR REPLACE VIEW v_plo_attainment_by_course AS
SELECT
    c.id                                                        AS course_id,
    c.code                                                      AS course_code,
    plo.id                                                      AS plo_id,
    plo.code                                                    AS plo_code,
    SUM(ca.score * ml.weight) / NULLIF(SUM(ml.weight), 0)       AS weighted_attainment,
    COUNT(DISTINCT ca.id)::int                                  AS attainment_count
FROM clo_attainments ca
JOIN clos clo               ON clo.id = ca.clo_id
JOIN course_offerings co    ON co.id = (
    SELECT e.course_offering_id FROM enrollments e WHERE e.id = ca.enrollment_id
)
JOIN courses c               ON c.id = co.course_id
JOIN clo_plo_mappings cpm    ON cpm.clo_id = clo.id
JOIN plos plo                 ON plo.id = cpm.plo_id
JOIN mapping_levels ml        ON ml.code = cpm.level_code
GROUP BY c.id, c.code, plo.id, plo.code;

-- Weighted rollup of a student's CLO scores (across all their enrollments)
-- into each PLO. Equivalent to "PLO Attainment by Students".
CREATE OR REPLACE VIEW v_plo_attainment_by_student AS
SELECT
    s.id                                                        AS student_id,
    s.student_number                                            AS student_number,
    plo.id                                                      AS plo_id,
    plo.code                                                    AS plo_code,
    SUM(ca.score * ml.weight) / NULLIF(SUM(ml.weight), 0)       AS weighted_attainment,
    COUNT(DISTINCT ca.id)::int                                  AS attainment_count
FROM clo_attainments ca
JOIN enrollments e             ON e.id = ca.enrollment_id
JOIN students s                 ON s.id = e.student_id
JOIN clo_plo_mappings cpm       ON cpm.clo_id = ca.clo_id
JOIN plos plo                    ON plo.id = cpm.plo_id
JOIN mapping_levels ml           ON ml.code = cpm.level_code
GROUP BY s.id, s.student_number, plo.id, plo.code;

-- Program-wide average per PLO across all courses, equivalent to the
-- workbook's "All Courses" / "Program Performance" summary row.
CREATE OR REPLACE VIEW v_program_plo_performance AS
SELECT
    plo.program_id                    AS program_id,
    plo.id                            AS plo_id,
    plo.code                          AS plo_code,
    AVG(vpac.weighted_attainment)     AS program_avg_attainment
FROM v_plo_attainment_by_course vpac
JOIN plos plo ON plo.id = vpac.plo_id
GROUP BY plo.program_id, plo.id, plo.code;
