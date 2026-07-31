import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.mappingLevel.upsert({
    where: { code: 'I' },
    update: {},
    create: { code: 'I', label: 'Introduced', weight: 1 },
  });
  await prisma.mappingLevel.upsert({
    where: { code: 'P' },
    update: {},
    create: { code: 'P', label: 'Practiced', weight: 2 },
  });
  await prisma.mappingLevel.upsert({
    where: { code: 'D' },
    update: {},
    create: { code: 'D', label: 'Demonstrated', weight: 3 },
  });

  console.log('Seeded mapping_levels (I/P/D).');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
