import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProgramsModule } from './programs/programs.module';
import { CoursesModule } from './courses/courses.module';
import { CurriculumCoursesModule } from './curriculum-courses/curriculum-courses.module';
import { ClosModule } from './clos/clos.module';
import { PlosModule } from './plos/plos.module';
import { PerformanceIndicatorsModule } from './performance-indicators/performance-indicators.module';
import { MappingsModule } from './mappings/mappings.module';
import { MappingLevelsModule } from './mapping-levels/mapping-levels.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { AcademicTermsModule } from './academic-terms/academic-terms.module';
import { CourseOfferingsModule } from './course-offerings/course-offerings.module';
import { StudentsModule } from './students/students.module';
import { FacultyModule } from './faculty/faculty.module';
import { CohortAdvisersModule } from './cohort-advisers/cohort-advisers.module';
import { AttainmentBenchmarkModule } from './attainment-benchmark/attainment-benchmark.module';
import { AttainmentUploadsModule } from './attainment-uploads/attainment-uploads.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { AttainmentsModule } from './attainments/attainments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProgramsModule,
    CoursesModule,
    CurriculumCoursesModule,
    ClosModule,
    PlosModule,
    PerformanceIndicatorsModule,
    MappingsModule,
    MappingLevelsModule,
    CohortsModule,
    AcademicTermsModule,
    CourseOfferingsModule,
    StudentsModule,
    FacultyModule,
    CohortAdvisersModule,
    AttainmentBenchmarkModule,
    AttainmentUploadsModule,
    EnrollmentsModule,
    AttainmentsModule,
    EvaluationsModule,
    ReportsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
