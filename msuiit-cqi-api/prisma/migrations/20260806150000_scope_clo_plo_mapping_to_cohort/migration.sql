-- Scope clo_plo_mappings to a cohort: curricula get revised between
-- batches, so the same CLO->PLO pair can carry a different I/P/D level (or
-- no mapping at all) for a later cohort. Each cohort now owns its own
-- complete mapping set instead of sharing one global table.

-- 1. Add the column nullable first so we can backfill existing rows.
ALTER TABLE "clo_plo_mappings" ADD COLUMN "cohort_id" TEXT;

-- 2. Backfill: every existing mapping row is attributed to the cohort that
-- belongs to its PLO's program. At migration time there is exactly one
-- cohort per program, so this is unambiguous; if a program somehow has more
-- than one, the oldest cohort (by start_year) is used as a best-effort
-- default and can be reassigned afterwards via the mapping admin UI.
UPDATE "clo_plo_mappings" m
SET "cohort_id" = (
    SELECT c.id
    FROM "cohorts" c
    JOIN "plos" p ON p.program_id = c.program_id
    WHERE p.id = m.plo_id
    ORDER BY c.start_year ASC
    LIMIT 1
);

-- 3. Any mapping row whose program ended up with no cohort at all (no
-- students/cohorts ever set up for it) has nothing to attribute the mapping
-- to, so drop it rather than leave an unattributable row behind.
DELETE FROM "clo_plo_mappings" WHERE "cohort_id" IS NULL;

-- 4. Now that every remaining row has a cohort, enforce it going forward.
ALTER TABLE "clo_plo_mappings" ALTER COLUMN "cohort_id" SET NOT NULL;

-- 5. Replace the old (clo_id, plo_id) uniqueness with (clo_id, plo_id, cohort_id).
DROP INDEX "clo_plo_mappings_clo_id_plo_id_key";
CREATE UNIQUE INDEX "clo_plo_mappings_clo_id_plo_id_cohort_id_key" ON "clo_plo_mappings"("clo_id", "plo_id", "cohort_id");

-- 6. Foreign key to cohorts.
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
