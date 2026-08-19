-- Decouples CLO/CLO-PLO-mapping definition from cohorts: introduces
-- curriculum_versions (program-scoped curriculum revisions) as the owner of
-- clos and clo_plo_mappings, so that work can happen before any cohort
-- exists or is assigned to it. cohorts.curriculum_version_id links a batch
-- to the version it was admitted under (nullable -- the two can be set up
-- independently and converge later).

-- CreateTable
CREATE TABLE "curriculum_versions" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_versions_program_id_code_key" ON "curriculum_versions"("program_id", "code");

-- AddForeignKey
ALTER TABLE "curriculum_versions" ADD CONSTRAINT "curriculum_versions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one curriculum_version per existing cohort that owns CLOs or
-- mappings, reusing the cohort's own id as the version's id. This makes the
-- column backfills below trivial 1:1 copies with no join/mapping table
-- needed for this one-time cutover.
INSERT INTO "curriculum_versions" ("id", "program_id", "code", "description", "updated_at")
SELECT c.id, c.program_id, c.code, 'Migrated from batch ' || c.code, CURRENT_TIMESTAMP
FROM "cohorts" c
WHERE EXISTS (SELECT 1 FROM "clos" WHERE "clos"."cohort_id" = c.id)
   OR EXISTS (SELECT 1 FROM "clo_plo_mappings" WHERE "clo_plo_mappings"."cohort_id" = c.id);

-- AlterTable: cohorts -- add nullable curriculum_version_id, point it at the
-- version backfilled above for cohorts that had one.
ALTER TABLE "cohorts" ADD COLUMN "curriculum_version_id" TEXT;
UPDATE "cohorts" SET "curriculum_version_id" = "id" WHERE "id" IN (SELECT "id" FROM "curriculum_versions");
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_curriculum_version_id_fkey" FOREIGN KEY ("curriculum_version_id") REFERENCES "curriculum_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: clos -- swap cohort_id for curriculum_version_id. No view
-- reads clos.cohort_id directly, so this can drop it immediately.
ALTER TABLE "clos" ADD COLUMN "curriculum_version_id" TEXT;
UPDATE "clos" SET "curriculum_version_id" = "cohort_id";
ALTER TABLE "clos" ALTER COLUMN "curriculum_version_id" SET NOT NULL;
ALTER TABLE "clos" DROP CONSTRAINT "clos_cohort_id_fkey";
DROP INDEX "clos_course_id_code_cohort_id_key";
ALTER TABLE "clos" DROP COLUMN "cohort_id";
ALTER TABLE "clos" ADD CONSTRAINT "clos_curriculum_version_id_fkey" FOREIGN KEY ("curriculum_version_id") REFERENCES "curriculum_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "clos_course_id_code_curriculum_version_id_key" ON "clos"("course_id", "code", "curriculum_version_id");

-- AlterTable: clo_plo_mappings -- add + backfill curriculum_version_id, but
-- keep cohort_id (and its constraint/index) around a little longer: the
-- reporting views below still read it until they're rewritten.
ALTER TABLE "clo_plo_mappings" ADD COLUMN "curriculum_version_id" TEXT;
UPDATE "clo_plo_mappings" SET "curriculum_version_id" = "cohort_id";
ALTER TABLE "clo_plo_mappings" ALTER COLUMN "curriculum_version_id" SET NOT NULL;
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_curriculum_version_id_fkey" FOREIGN KEY ("curriculum_version_id") REFERENCES "curriculum_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "clo_plo_mappings_clo_id_plo_id_curriculum_version_id_key" ON "clo_plo_mappings"("clo_id", "plo_id", "curriculum_version_id");

-- Reporting views: re-point the clo_plo_mappings join at the student's
-- cohort's assigned curriculum version instead of the cohort directly.
-- Output columns are unchanged (still cohort_id/cohort_code), only the join
-- key changes, so CREATE OR REPLACE VIEW is safe here. This must run before
-- clo_plo_mappings.cohort_id is dropped below, since these views are the
-- last things still reading it.
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
JOIN cohorts coh                ON coh.id = s.cohort_id
JOIN clo_plo_mappings cpm       ON cpm.clo_id = ca.clo_id AND cpm.curriculum_version_id = coh.curriculum_version_id
JOIN plos plo                    ON plo.id = cpm.plo_id
JOIN mapping_levels ml           ON ml.code = cpm.level_code AND ml.program_id = s.program_id
GROUP BY s.id, s.student_number, plo.id, plo.code, s.cohort_id;

-- Now safe to drop clo_plo_mappings.cohort_id -- no view reads it anymore.
ALTER TABLE "clo_plo_mappings" DROP CONSTRAINT "clo_plo_mappings_cohort_id_fkey";
DROP INDEX "clo_plo_mappings_clo_id_plo_id_cohort_id_key";
ALTER TABLE "clo_plo_mappings" DROP COLUMN "cohort_id";
