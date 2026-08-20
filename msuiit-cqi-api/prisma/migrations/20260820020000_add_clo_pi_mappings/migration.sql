-- CreateTable
CREATE TABLE "clo_pi_mappings" (
    "id" TEXT NOT NULL,
    "clo_id" TEXT NOT NULL,
    "pi_id" TEXT NOT NULL,
    "curriculum_version_id" TEXT NOT NULL,
    "level_code" "MappingLevelCode" NOT NULL,
    "assessment_method" TEXT,

    CONSTRAINT "clo_pi_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clo_pi_mappings_clo_id_pi_id_curriculum_version_id_key" ON "clo_pi_mappings"("clo_id", "pi_id", "curriculum_version_id");

-- AddForeignKey
ALTER TABLE "clo_pi_mappings" ADD CONSTRAINT "clo_pi_mappings_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clo_pi_mappings" ADD CONSTRAINT "clo_pi_mappings_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "performance_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clo_pi_mappings" ADD CONSTRAINT "clo_pi_mappings_curriculum_version_id_fkey" FOREIGN KEY ("curriculum_version_id") REFERENCES "curriculum_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- No CLO-PLO mapping ever had piId/assessmentMethod populated in practice (that
-- refinement now lives in clo_pi_mappings above), so this is a safe drop.
ALTER TABLE "clo_plo_mappings" DROP CONSTRAINT "clo_plo_mappings_pi_id_fkey";
ALTER TABLE "clo_plo_mappings" DROP COLUMN "pi_id";
ALTER TABLE "clo_plo_mappings" DROP COLUMN "assessment_method";
