-- Assessment tasks can hang off a learning plan week, may be left without a
-- CLO, and carry a flag for whether they count toward CLO computation.
ALTER TABLE "assessment_tasks" ALTER COLUMN "clo_id" DROP NOT NULL;
ALTER TABLE "assessment_tasks" ADD COLUMN "included" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "assessment_tasks" ADD COLUMN "learning_plan_entry_id" TEXT;
ALTER TABLE "assessment_tasks" ADD CONSTRAINT "assessment_tasks_learning_plan_entry_id_fkey" FOREIGN KEY ("learning_plan_entry_id") REFERENCES "learning_plan_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
