-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_code_key" ON "colleges"("code");

-- AlterTable
ALTER TABLE "programs" ADD COLUMN "college_id" TEXT,
ADD COLUMN "year_established" INTEGER,
ADD COLUMN "revision_cycle_years" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "curriculum_versions" ADD COLUMN "effective_year" INTEGER;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
