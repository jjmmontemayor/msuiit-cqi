import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdtemp, copyFile, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssessmentTaskDto,
  UpdateAssessmentTaskDto,
  UpsertOfferingCloDto,
} from './dto/blueprint.dto';
import {
  buildGradingSheetCsv,
  buildGradingSheetXlsx,
} from './grading-sheet';
import { buildSyllabusTyp } from './syllabus.typ';
import type { SyllabusData } from './syllabus.types';

export interface ExportFile {
  filename: string;
  contentType: string;
  body: Buffer | string;
}

@Injectable()
export class SyllabusService {
  constructor(private readonly prisma: PrismaService) {}

  private async findOffering(id: string) {
    const offering = await this.prisma.courseOffering.findUnique({
      where: { id },
      include: { course: true, academicTerm: true },
    });
    if (!offering) {
      throw new NotFoundException(`Course offering ${id} not found`);
    }
    return offering;
  }

  // CLOs are curriculum-version scoped; the syllabus uses the course's CLOs
  // from the most recently created version that has any.
  private async currentClos(courseId: string) {
    const clos = await this.prisma.clo.findMany({
      where: { courseId },
      orderBy: [
        { curriculumVersion: { createdAt: 'desc' } },
        { displayOrder: 'asc' },
      ],
    });
    if (clos.length === 0) return [];
    const versionId = clos[0].curriculumVersionId;
    return clos.filter((c) => c.curriculumVersionId === versionId);
  }

  async getBlueprint(offeringId: string) {
    const offering = await this.findOffering(offeringId);
    const clos = await this.currentClos(offering.courseId);
    const [settings, tasks] = await Promise.all([
      this.prisma.offeringClo.findMany({
        where: { courseOfferingId: offeringId },
      }),
      this.prisma.assessmentTask.findMany({
        where: { courseOfferingId: offeringId },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return {
      clos: clos.map((clo) => ({
        clo,
        setting: settings.find((s) => s.cloId === clo.id) ?? null,
      })),
      tasks,
    };
  }

  async upsertOfferingClo(
    offeringId: string,
    cloId: string,
    dto: UpsertOfferingCloDto,
  ) {
    await this.findOffering(offeringId);
    return this.prisma.offeringClo.upsert({
      where: {
        courseOfferingId_cloId: { courseOfferingId: offeringId, cloId },
      },
      create: { courseOfferingId: offeringId, cloId, ...dto },
      update: dto,
    });
  }

  async createTask(offeringId: string, dto: CreateAssessmentTaskDto) {
    await this.findOffering(offeringId);
    const count = await this.prisma.assessmentTask.count({
      where: { courseOfferingId: offeringId },
    });
    return this.prisma.assessmentTask.create({
      data: { courseOfferingId: offeringId, displayOrder: count, ...dto },
    });
  }

  async updateTask(taskId: string, dto: UpdateAssessmentTaskDto) {
    const task = await this.prisma.assessmentTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException(`Assessment task ${taskId} not found`);
    return this.prisma.assessmentTask.update({ where: { id: taskId }, data: dto });
  }

  async removeTask(taskId: string) {
    const task = await this.prisma.assessmentTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException(`Assessment task ${taskId} not found`);
    return this.prisma.assessmentTask.delete({ where: { id: taskId } });
  }

  private async loadData(offeringId: string): Promise<SyllabusData> {
    const offering = await this.findOffering(offeringId);
    const clos = await this.currentClos(offering.courseId);
    const cloIds = clos.map((c) => c.id);
    const versionId = clos[0]?.curriculumVersionId;

    const [settings, tasks, mappings, plan, version] = await Promise.all([
      this.prisma.offeringClo.findMany({
        where: { courseOfferingId: offeringId },
      }),
      this.prisma.assessmentTask.findMany({
        where: { courseOfferingId: offeringId },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.cloPloMapping.findMany({
        where: { cloId: { in: cloIds } },
        include: { mappingLevel: true },
      }),
      this.prisma.learningPlanEntry.findMany({
        where: { courseOfferingId: offeringId },
        orderBy: { displayOrder: 'asc' },
      }),
      versionId
        ? this.prisma.curriculumVersion.findUnique({ where: { id: versionId } })
        : Promise.resolve(null),
    ]);

    const plos = version
      ? await this.prisma.plo.findMany({
          where: { programId: version.programId },
          orderBy: { displayOrder: 'asc' },
        })
      : [];

    const mapped: Record<string, string> = {};
    for (const m of mappings) {
      mapped[`${m.cloId}::${m.ploId}`] = m.mappingLevel.displayCode;
    }

    return {
      course: {
        code: offering.course.code,
        title: offering.course.title,
        description: offering.course.description,
        credits: offering.course.credits,
        prerequisites: offering.course.prerequisites,
      },
      term: {
        schoolYearStart: offering.academicTerm.schoolYearStart,
        schoolYearEnd: offering.academicTerm.schoolYearEnd,
        semester: offering.academicTerm.semester,
      },
      offering: {
        section: offering.section,
        instructorName: offering.instructorName,
        modality: offering.modality,
        population: offering.population,
        references: offering.references,
        classroomPolicies: offering.classroomPolicies,
        preparedBy: offering.preparedBy,
        reviewedBy: offering.reviewedBy,
        approvedBy: offering.approvedBy,
        courseworkWeight: offering.courseworkWeight,
      },
      clos: clos.map((clo) => {
        const s = settings.find((x) => x.cloId === clo.id);
        return {
          id: clo.id,
          code: clo.code,
          description: clo.description,
          weight: s?.weight ?? 0,
          taxonomy: s?.taxonomy ?? null,
          evidenceReference: s?.evidenceReference ?? null,
        };
      }),
      tasks: tasks.map((t) => ({
        id: t.id,
        cloId: t.cloId,
        name: t.name,
        weight: t.weight,
        maxScore: t.maxScore,
      })),
      plos: plos.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
      })),
      mappings: mapped,
      plan: plan.map((e) => ({
        weekLabel: e.weekLabel,
        topics: e.topics,
        lessonOutcome: e.lessonOutcome,
        coLabels: e.coLabels,
        methodology: e.methodology,
        learningResources: e.learningResources,
        assessment: e.assessment,
      })),
    };
  }

  private fileStem(d: SyllabusData, suffix: string): string {
    return `${d.course.code}-${d.term.schoolYearStart}-${d.term.schoolYearEnd}-${suffix}`;
  }

  async exportSyllabus(
    offeringId: string,
    format: 'pdf' | 'typ',
  ): Promise<ExportFile> {
    const data = await this.loadData(offeringId);
    const typ = buildSyllabusTyp(data);
    const stem = this.fileStem(data, 'syllabus');
    if (format === 'typ') {
      return {
        filename: `${stem}.typ`,
        contentType: 'text/plain; charset=utf-8',
        body: typ,
      };
    }

    const dir = await mkdtemp(join(tmpdir(), 'syllabus-'));
    try {
      await copyFile(
        join(process.cwd(), 'assets', 'iitlogo.png'),
        join(dir, 'iitlogo.png'),
      );
      const mainFilePath = join(dir, 'main.typ');
      await writeFile(mainFilePath, typ, 'utf8');
      const compiler = NodeCompiler.create({ workspace: dir });
      const pdf = compiler.pdf({ mainFilePath });
      return {
        filename: `${stem}.pdf`,
        contentType: 'application/pdf',
        body: Buffer.from(pdf),
      };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  async exportGradingSheet(
    offeringId: string,
    format: 'xlsx' | 'csv',
  ): Promise<ExportFile> {
    const data = await this.loadData(offeringId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseOfferingId: offeringId },
      include: { student: true },
    });
    const students = enrollments
      .map((e) => ({
        studentNumber: e.student.studentNumber,
        name: `${e.student.lastName}, ${e.student.firstName}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const stem = this.fileStem(data, 'grading-sheet');
    if (format === 'csv') {
      return {
        filename: `${stem}.csv`,
        contentType: 'text/csv; charset=utf-8',
        body: buildGradingSheetCsv(data, students),
      };
    }
    return {
      filename: `${stem}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: buildGradingSheetXlsx(data, students),
    };
  }
}
