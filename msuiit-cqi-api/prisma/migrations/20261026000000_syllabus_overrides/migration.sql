ALTER TABLE "course_offerings"
  ADD COLUMN "syllabus_code" TEXT,
  ADD COLUMN "syllabus_title" TEXT,
  ADD COLUMN "syllabus_description" TEXT,
  ADD COLUMN "syllabus_credits" INTEGER,
  ADD COLUMN "syllabus_prerequisites" TEXT,
  ADD COLUMN "syllabus_term" TEXT,
  ADD COLUMN "blueprint_note" TEXT,
  ADD COLUMN "grading_note" TEXT,
  ADD COLUMN "grade_scale" JSONB;

ALTER TABLE "offering_clos" ADD COLUMN "description" TEXT;

CREATE TABLE "offering_clo_plos" (
  "id" TEXT NOT NULL,
  "course_offering_id" TEXT NOT NULL,
  "clo_id" TEXT NOT NULL,
  "plo_id" TEXT NOT NULL,
  "level_code" TEXT NOT NULL,
  CONSTRAINT "offering_clo_plos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "offering_clo_plos_course_offering_id_clo_id_plo_id_key" ON "offering_clo_plos"("course_offering_id", "clo_id", "plo_id");
ALTER TABLE "offering_clo_plos" ADD CONSTRAINT "offering_clo_plos_course_offering_id_fkey" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offering_clo_plos" ADD CONSTRAINT "offering_clo_plos_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offering_clo_plos" ADD CONSTRAINT "offering_clo_plos_plo_id_fkey" FOREIGN KEY ("plo_id") REFERENCES "plos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
