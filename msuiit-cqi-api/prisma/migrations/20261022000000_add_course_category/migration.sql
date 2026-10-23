-- curriculum_courses: classify a course as major / minor / elective for
-- per-program unit totals. Nullable: existing rows stay uncategorized.
CREATE TYPE "course_category" AS ENUM ('MAJOR', 'MINOR', 'ELECTIVE');
ALTER TABLE "curriculum_courses" ADD COLUMN "category" "course_category";
