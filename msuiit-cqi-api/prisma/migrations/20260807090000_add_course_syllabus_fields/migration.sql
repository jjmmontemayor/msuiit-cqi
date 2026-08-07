-- Catalog-level fields commonly found in a course syllabus header
-- (credit units, lecture/lab contact hours, prerequisites), separate from
-- description which already existed.
ALTER TABLE "courses" ADD COLUMN "credits" INTEGER;
ALTER TABLE "courses" ADD COLUMN "lecture_hours" INTEGER;
ALTER TABLE "courses" ADD COLUMN "lab_hours" INTEGER;
ALTER TABLE "courses" ADD COLUMN "prerequisites" TEXT;
