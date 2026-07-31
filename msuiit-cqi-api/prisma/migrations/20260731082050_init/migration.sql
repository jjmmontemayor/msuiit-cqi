-- CreateEnum
CREATE TYPE "MappingLevelCode" AS ENUM ('I', 'P', 'D');

-- CreateEnum
CREATE TYPE "semester" AS ENUM ('FIRST', 'SECOND', 'SUMMER');

-- CreateEnum
CREATE TYPE "student_status" AS ENUM ('ACTIVE', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "evaluation_status" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "program_role" AS ENUM ('ADMIN', 'PROGRAM_CHAIR', 'FACULTY', 'VIEWER');

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mapping_levels" (
    "code" "MappingLevelCode" NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "mapping_levels_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" TEXT NOT NULL,
    "school_year_start" INTEGER NOT NULL,
    "school_year_end" INTEGER NOT NULL,
    "semester" "semester" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "elective_group" TEXT,
    "year_level" INTEGER,
    "term" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plos" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_indicators" (
    "id" TEXT NOT NULL,
    "plo_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "performance_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clos" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "clos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clo_plo_mappings" (
    "id" TEXT NOT NULL,
    "clo_id" TEXT NOT NULL,
    "plo_id" TEXT NOT NULL,
    "level_code" "MappingLevelCode" NOT NULL,
    "pi_id" TEXT,
    "assessment_method" TEXT,

    CONSTRAINT "clo_plo_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "status" "student_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_offerings" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "academic_term_id" TEXT NOT NULL,
    "section" TEXT,
    "instructor_name" TEXT,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_offering_id" TEXT NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clo_attainments" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "clo_id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "clo_attainments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pi_evaluations" (
    "id" TEXT NOT NULL,
    "pi_id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "benchmark_description" TEXT,
    "target_percentage" DECIMAL(5,2),
    "results_narrative" TEXT,
    "status" "evaluation_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pi_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_program_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "role" "program_role" NOT NULL,

    CONSTRAINT "user_program_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_school_year_start_school_year_end_semester_key" ON "academic_terms"("school_year_start", "school_year_end", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_courses_program_id_course_id_key" ON "curriculum_courses"("program_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "plos_program_id_code_key" ON "plos"("program_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "performance_indicators_plo_id_code_key" ON "performance_indicators"("plo_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "clos_course_id_code_key" ON "clos"("course_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "clo_plo_mappings_clo_id_plo_id_key" ON "clo_plo_mappings"("clo_id", "plo_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_program_id_code_key" ON "cohorts"("program_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_course_id_academic_term_id_section_key" ON "course_offerings"("course_id", "academic_term_id", "section");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_course_offering_id_key" ON "enrollments"("student_id", "course_offering_id");

-- CreateIndex
CREATE UNIQUE INDEX "clo_attainments_enrollment_id_clo_id_key" ON "clo_attainments"("enrollment_id", "clo_id");

-- CreateIndex
CREATE UNIQUE INDEX "pi_evaluations_pi_id_cohort_id_key" ON "pi_evaluations"("pi_id", "cohort_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_program_roles_user_id_program_id_key" ON "user_program_roles"("user_id", "program_id");

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plos" ADD CONSTRAINT "plos_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_indicators" ADD CONSTRAINT "performance_indicators_plo_id_fkey" FOREIGN KEY ("plo_id") REFERENCES "plos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clos" ADD CONSTRAINT "clos_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_plo_id_fkey" FOREIGN KEY ("plo_id") REFERENCES "plos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "performance_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_level_code_fkey" FOREIGN KEY ("level_code") REFERENCES "mapping_levels"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_offering_id_fkey" FOREIGN KEY ("course_offering_id") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_attainments" ADD CONSTRAINT "clo_attainments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clo_attainments" ADD CONSTRAINT "clo_attainments_clo_id_fkey" FOREIGN KEY ("clo_id") REFERENCES "clos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pi_evaluations" ADD CONSTRAINT "pi_evaluations_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "performance_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pi_evaluations" ADD CONSTRAINT "pi_evaluations_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pi_evaluations" ADD CONSTRAINT "pi_evaluations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_roles" ADD CONSTRAINT "user_program_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_program_roles" ADD CONSTRAINT "user_program_roles_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
