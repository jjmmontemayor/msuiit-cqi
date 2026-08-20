-- Mapping levels become a fully admin-managed set (add/edit/delete), not a
-- fixed I/P/D enum: mappings now reference a level by mapping_levels.id
-- instead of storing the enum value directly, so a level's code can be
-- renamed (or the whole set changed) without touching mapping data.

-- Add the new FK columns (nullable for now, backfilled below).
ALTER TABLE "clo_plo_mappings" ADD COLUMN "mapping_level_id" TEXT;
ALTER TABLE "clo_pi_mappings" ADD COLUMN "mapping_level_id" TEXT;

-- Backfill: match each mapping's old enum level_code to the mapping_levels
-- row with the same code, scoped to the mapping's own program (via its
-- curriculum version).
UPDATE "clo_plo_mappings" cpm
SET "mapping_level_id" = ml.id
FROM "mapping_levels" ml, "curriculum_versions" cv
WHERE cv.id = cpm.curriculum_version_id
  AND ml.program_id = cv.program_id
  AND ml.code::text = cpm.level_code::text;

UPDATE "clo_pi_mappings" cpim
SET "mapping_level_id" = ml.id
FROM "mapping_levels" ml, "curriculum_versions" cv
WHERE cv.id = cpim.curriculum_version_id
  AND ml.program_id = cv.program_id
  AND ml.code::text = cpim.level_code::text;

-- Rewrite the reporting views to join by mapping_level_id and drop their
-- reference to mapping_levels.code / *.level_code, BEFORE those columns'
-- types change or get dropped below (Postgres won't allow altering/dropping
-- a column a view still depends on).
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

-- Now safe to change mapping_levels.code's type (no view depends on it
-- anymore) and to require/constrain the new columns.
ALTER TABLE "mapping_levels" ALTER COLUMN "code" TYPE TEXT;

ALTER TABLE "clo_plo_mappings" ALTER COLUMN "mapping_level_id" SET NOT NULL;
ALTER TABLE "clo_pi_mappings" ALTER COLUMN "mapping_level_id" SET NOT NULL;

ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_mapping_level_id_fkey" FOREIGN KEY ("mapping_level_id") REFERENCES "mapping_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clo_pi_mappings" ADD CONSTRAINT "clo_pi_mappings_mapping_level_id_fkey" FOREIGN KEY ("mapping_level_id") REFERENCES "mapping_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "clo_plo_mappings_mapping_level_id_idx" ON "clo_plo_mappings"("mapping_level_id");
CREATE INDEX "clo_pi_mappings_mapping_level_id_idx" ON "clo_pi_mappings"("mapping_level_id");

ALTER TABLE "clo_plo_mappings" DROP COLUMN "level_code";
ALTER TABLE "clo_pi_mappings" DROP COLUMN "level_code";

DROP TYPE "MappingLevelCode";
