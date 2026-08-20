import { MappingLevelCode, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MAPPING_LEVELS = [
  { code: MappingLevelCode.I, displayCode: 'I', label: 'Introduced', weight: 1 },
  { code: MappingLevelCode.P, displayCode: 'P', label: 'Practiced', weight: 2 },
  { code: MappingLevelCode.D, displayCode: 'D', label: 'Demonstrated', weight: 3 },
] as const;

// Backfill: mapping level weights and the attainment benchmark are
// per-program settings (ProgramsService.create seeds these for programs
// created through the API). This ensures every existing program has them,
// for programs that predate these settings or were created directly via
// Prisma (e.g. the xlsx import script, which seeds its own program too).
async function main() {
  const programs = await prisma.program.findMany();

  for (const program of programs) {
    for (const level of DEFAULT_MAPPING_LEVELS) {
      await prisma.mappingLevel.upsert({
        where: { programId_code: { programId: program.id, code: level.code } },
        update: {},
        create: { programId: program.id, ...level },
      });
    }
    await prisma.attainmentBenchmark.upsert({
      where: { programId: program.id },
      update: {},
      create: { programId: program.id, percentage: 70 },
    });
  }

  console.log(`Seeded mapping_levels and attainment_benchmarks for ${programs.length} program(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
