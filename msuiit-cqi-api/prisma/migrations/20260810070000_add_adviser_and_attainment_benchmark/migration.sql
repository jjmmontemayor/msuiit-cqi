-- Add a faculty catalog and a faculty<->cohort adviser mapping (in
-- preparation for an advising module -- an adviser is assigned per batch,
-- not per student), and a singleton attainment_benchmarks table for the
-- score threshold used to flag attainment below target (the source
-- workbook's "Performance Criteria: Benchmark/Target 70%").

CREATE TABLE "faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cohort_advisers" (
    "id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,

    CONSTRAINT "cohort_advisers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cohort_advisers_cohort_id_faculty_id_key" ON "cohort_advisers"("cohort_id", "faculty_id");

ALTER TABLE "cohort_advisers" ADD CONSTRAINT "cohort_advisers_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cohort_advisers" ADD CONSTRAINT "cohort_advisers_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "attainment_benchmarks" (
    "id" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "attainment_benchmarks_pkey" PRIMARY KEY ("id")
);

INSERT INTO "attainment_benchmarks" ("id", "percentage")
VALUES (gen_random_uuid()::text, 70);

-- Clean up rows that aren't real students: the source workbook's
-- CLO_Attainments / PLO Attainment by Students sheets have a legend
-- ("Nota Bene:", "1. Performance Criteria is set to:", etc.) directly below
-- the student roster, in the same column as student ID numbers, which the
-- original import mistook for additional student rows (first/last name
-- both landed on the literal string "null" since those columns were blank
-- for a legend line). The legend content itself is preserved in the
-- attainment_benchmarks config and the app's UI, not lost -- just no longer
-- masquerading as students.
DELETE FROM "students" WHERE "first_name" = 'null' AND "last_name" = 'null';
