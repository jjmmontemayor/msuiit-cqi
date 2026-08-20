-- mapping_levels: add a program-configurable display code (I/P/D by
-- default), independent of the stable `code` enum that clo_plo_mappings
-- actually stores against.
ALTER TABLE "mapping_levels" ADD COLUMN "display_code" TEXT;
UPDATE "mapping_levels" SET "display_code" = "code"::text;
ALTER TABLE "mapping_levels" ALTER COLUMN "display_code" SET NOT NULL;

-- curriculum_courses: mark a course as designated for formal PLO assessment
-- within a program's curriculum.
ALTER TABLE "curriculum_courses" ADD COLUMN "is_plo_assessment_target" BOOLEAN NOT NULL DEFAULT false;
