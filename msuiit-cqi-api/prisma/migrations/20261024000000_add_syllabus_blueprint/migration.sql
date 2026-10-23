-- AlterTable
ALTER TABLE "course_offerings"
ADD COLUMN "modality" TEXT,
ADD COLUMN "population" INTEGER,
ADD COLUMN "references" TEXT,
ADD COLUMN "classroom_policies" TEXT,
ADD COLUMN "prepared_by" TEXT,
ADD COLUMN "reviewed_by" TEXT,
ADD COLUMN "approved_by" TEXT,
ADD COLUMN "coursework_weight" INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE "offering_clos" (
    "id" TEXT NOT NULL,
    "course_offering_id" TEXT NOT NULL,
    "clo_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "taxonomy" TEXT,
    "evidence_reference" TEXT,

    CONSTRAINT "offering_clos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_tasks" (
    "id" TEXT NOT NULL,
    "course_offering_id" TEXT NOT NULL,
    "clo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "assessment_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offering_clos_course_offering_id_clo_id_key" ON "offering_clos"("course_offering_id", "clo_id");

-- AddForeignKey
ALTER TABLE "offering_clos" ADD CONSTRAINT "offering_clos_course_offering_id_fkey" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offering_clos" ADD CONSTRAINT "offering_clos_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_tasks" ADD CONSTRAINT "assessment_tasks_course_offering_id_fkey" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_tasks" ADD CONSTRAINT "assessment_tasks_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
