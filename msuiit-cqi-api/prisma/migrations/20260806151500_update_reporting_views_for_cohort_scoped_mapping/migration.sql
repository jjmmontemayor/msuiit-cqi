-- clo_plo_mappings is now scoped per cohort (see the previous migration).
-- The PLO rollup views joined to clo_plo_mappings on clo_id alone, which
-- would now fan out across every cohort's mapping for that CLO instead of
-- just the one in effect for the attainment's own student. Re-point each
-- join at the student's cohort, and add cohort_id to the by-course and
-- program-performance rollups (a course/program can span multiple cohorts
-- whose mappings differ, so those need a cohort dimension in their output).
--
-- New columns are appended at the end of each SELECT list rather than
-- inserted among the existing ones: CREATE OR REPLACE VIEW requires the
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
JOIN clo_plo_mappings cpm    ON cpm.clo_id = clo.id AND cpm.cohort_id = s.cohort_id
JOIN plos plo                 ON plo.id = cpm.plo_id
JOIN mapping_levels ml        ON ml.code = cpm.level_code
GROUP BY c.id, c.code, plo.id, plo.code, coh.id, coh.code;

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
JOIN clo_plo_mappings cpm       ON cpm.clo_id = ca.clo_id AND cpm.cohort_id = s.cohort_id
JOIN plos plo                    ON plo.id = cpm.plo_id
JOIN mapping_levels ml           ON ml.code = cpm.level_code
GROUP BY s.id, s.student_number, plo.id, plo.code, s.cohort_id;

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
