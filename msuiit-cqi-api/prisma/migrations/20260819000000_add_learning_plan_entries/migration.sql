-- CreateTable
CREATE TABLE "learning_plan_entries" (
    "id" TEXT NOT NULL,
    "course_offering_id" TEXT NOT NULL,
    "week_label" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT NOT NULL,
    "lesson_outcome" TEXT,
    "co_labels" TEXT,
    "methodology" TEXT,
    "learning_resources" TEXT,
    "assessment" TEXT,

    CONSTRAINT "learning_plan_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "learning_plan_entries" ADD CONSTRAINT "learning_plan_entries_course_offering_id_fkey" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
