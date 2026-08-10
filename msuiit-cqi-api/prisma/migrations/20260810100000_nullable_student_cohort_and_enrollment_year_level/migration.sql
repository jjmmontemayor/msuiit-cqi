-- A student who shows up in an uploaded CLO attainment sheet but isn't
-- part of a program's tracked roster still needs a Student row to hang
-- enrollments/attainments off of, but no cohort to place them in -- so
-- cohort_id becomes optional. A null cohort_id is what excludes them from
-- every cohort-scoped report without a separate flag.
ALTER TABLE "students" ALTER COLUMN "cohort_id" DROP NOT NULL;

-- Track what year level a student was in when they took a specific course
-- (distinct from the course offering's academic term/calendar period).
ALTER TABLE "enrollments" ADD COLUMN "year_level" INTEGER;
