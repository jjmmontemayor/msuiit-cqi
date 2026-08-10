-- Mapping level weights, the attainment benchmark, and the faculty roster
-- are all program-specific settings, not institution-wide -- each program
-- can tune its own I/P/D weights, its own benchmark, and has its own
-- faculty. Move all three from a single global/singleton shape to one row
-- per program.

-- 1. clo_plo_mappings.level_code can no longer reference mapping_levels by
-- code alone once code stops being globally unique, so drop that FK first.
-- The relationship isn't replaced: the applicable weight for a mapping is
-- now looked up by (its cohort's program, level_code) in application code
-- and the reporting views, not via a direct foreign key.
ALTER TABLE "clo_plo_mappings" DROP CONSTRAINT "clo_plo_mappings_level_code_fkey";

-- 2. mapping_levels: expand the single global row per code into one row per
-- (program, code), seeded from the current global weight/label so every
-- existing program keeps the same I=1/P=2/D=3 (or whatever was set) it had.
-- The old PK on "code" alone must be dropped before inserting per-program
-- duplicates of the same code, or the insert violates it.
ALTER TABLE "mapping_levels" ADD COLUMN "id" TEXT;
ALTER TABLE "mapping_levels" ADD COLUMN "program_id" TEXT;
ALTER TABLE "mapping_levels" DROP CONSTRAINT "mapping_levels_pkey";

INSERT INTO "mapping_levels" ("id", "program_id", "code", "label", "weight")
SELECT gen_random_uuid()::text, p."id", ml."code", ml."label", ml."weight"
FROM "programs" p
CROSS JOIN (
    SELECT "code", "label", "weight" FROM "mapping_levels" WHERE "program_id" IS NULL
) ml;

DELETE FROM "mapping_levels" WHERE "program_id" IS NULL;

ALTER TABLE "mapping_levels" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "mapping_levels" ALTER COLUMN "program_id" SET NOT NULL;
ALTER TABLE "mapping_levels" ADD CONSTRAINT "mapping_levels_pkey" PRIMARY KEY ("id");
ALTER TABLE "mapping_levels" ADD CONSTRAINT "mapping_levels_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "mapping_levels_program_id_code_key" ON "mapping_levels"("program_id", "code");

-- 3. attainment_benchmarks: same expansion, one row per program.
ALTER TABLE "attainment_benchmarks" ADD COLUMN "program_id" TEXT;

INSERT INTO "attainment_benchmarks" ("id", "program_id", "percentage")
SELECT gen_random_uuid()::text, p."id", ab."percentage"
FROM "programs" p
CROSS JOIN (
    SELECT "percentage" FROM "attainment_benchmarks" WHERE "program_id" IS NULL LIMIT 1
) ab;

DELETE FROM "attainment_benchmarks" WHERE "program_id" IS NULL;

ALTER TABLE "attainment_benchmarks" ALTER COLUMN "program_id" SET NOT NULL;
ALTER TABLE "attainment_benchmarks" ADD CONSTRAINT "attainment_benchmarks_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "attainment_benchmarks_program_id_key" ON "attainment_benchmarks"("program_id");

-- 4. faculty: scope to program. No real rows are expected to exist yet
-- (faculty was only just introduced), so any orphaned row without a program
-- to attribute it to is dropped rather than guessed at.
ALTER TABLE "faculty" ADD COLUMN "program_id" TEXT;
DELETE FROM "faculty" WHERE "program_id" IS NULL;
ALTER TABLE "faculty" ALTER COLUMN "program_id" SET NOT NULL;
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Reporting views: mapping_levels is no longer uniquely keyed by code
-- alone, so the join must also match on program (mapping_levels.weight can
-- now differ per program even for the same I/P/D code).
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
JOIN mapping_levels ml        ON ml.code = cpm.level_code AND ml.program_id = coh.program_id
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
JOIN mapping_levels ml           ON ml.code = cpm.level_code AND ml.program_id = s.program_id
GROUP BY s.id, s.student_number, plo.id, plo.code, s.cohort_id;
