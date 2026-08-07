-- Scope clos to a cohort, and add a lock flag: curricula get revised
-- between batches, and a course's CLOs can be rewritten outright (not just
-- re-mapped) for a later cohort. Each cohort now owns its own CLO set,
-- mirroring how clo_plo_mappings was scoped to cohort earlier. `is_locked`
-- marks a CLO (and its mappings) as finalized for reporting; editing a
-- locked CLO in place is blocked at the API layer -- a new CLO row under
-- the next cohort is the supported way to make a change.

-- 1. Add the column nullable first so we can backfill existing rows.
ALTER TABLE "clos" ADD COLUMN "cohort_id" TEXT;
ALTER TABLE "clos" ADD COLUMN "is_locked" BOOLEAN NOT NULL DEFAULT false;

-- 2. Backfill, preferring the cohort a CLO is already mapped under (most
-- precise, since clo_plo_mappings is already cohort-scoped).
UPDATE "clos" c
SET "cohort_id" = (
    SELECT m."cohort_id"
    FROM "clo_plo_mappings" m
    WHERE m."clo_id" = c."id"
    ORDER BY m."cohort_id"
    LIMIT 1
);

-- 3. Any CLO with no mapping yet falls back to the earliest cohort of any
-- program whose curriculum includes the CLO's course. At migration time
-- there is exactly one cohort per program, so this is unambiguous; if a
-- program somehow has more than one, the oldest by start_year is used as a
-- best-effort default and can be reassigned afterwards via the admin UI.
UPDATE "clos" c
SET "cohort_id" = (
    SELECT ch.id
    FROM "curriculum_courses" cc
    JOIN "cohorts" ch ON ch."program_id" = cc."program_id"
    WHERE cc."course_id" = c."course_id"
    ORDER BY ch."start_year" ASC
    LIMIT 1
)
WHERE c."cohort_id" IS NULL;

-- 4. Any CLO that still has no attributable cohort (course isn't on any
-- program's curriculum) has nothing to attribute it to; drop it rather than
-- leave an unattributable row behind.
DELETE FROM "clos" WHERE "cohort_id" IS NULL;

-- 5. Now that every remaining row has a cohort, enforce it going forward.
ALTER TABLE "clos" ALTER COLUMN "cohort_id" SET NOT NULL;

-- 6. Replace the old (course_id, code) uniqueness with (course_id, code, cohort_id).
DROP INDEX "clos_course_id_code_key";
CREATE UNIQUE INDEX "clos_course_id_code_cohort_id_key" ON "clos"("course_id", "code", "cohort_id");

-- 7. Foreign key to cohorts.
ALTER TABLE "clos" ADD CONSTRAINT "clos_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
