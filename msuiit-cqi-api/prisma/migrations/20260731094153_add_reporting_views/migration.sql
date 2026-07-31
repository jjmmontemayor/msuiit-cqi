-- Reporting views for CQI attainment rollups. Kept in sync with
-- prisma/views.sql (the human-readable copy with full comments) — this
-- migration is what actually runs in every environment via
-- `prisma migrate deploy`, so the views never require a manual psql step.
-- See ../../docs/schema.md and views.sql for the full rationale.

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

CREATE OR REPLACE VIEW v_program_plo_performance AS
SELECT
    plo.program_id                    AS program_id,
    plo.id                            AS plo_id,
    plo.code                          AS plo_code,
    AVG(vpac.weighted_attainment)     AS program_avg_attainment
FROM v_plo_attainment_by_course vpac
JOIN plos plo ON plo.id = vpac.plo_id
GROUP BY plo.program_id, plo.id, plo.code;
