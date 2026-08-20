/**
 * Seeds Performance Indicators for all 11 BSCS PLOs from the official
 * curriculum document (BSCS 2018 revision 3, with corrections, BOR
 * resolution -- see docs/source-data or bscs/ in the repo root), section
 * 6.4 "Assessment of Program Outcomes Specific to the Program" (CS01-CS11).
 *
 * PLO1 already had 3 PI rows from the earlier xlsx import, but that source
 * workbook's PI text was an unedited engineering-program template (see
 * prisma/seed/import-from-xlsx.ts's PLO1_DESCRIPTION comment) -- this
 * upserts by (ploId, code), so it corrects PLO1's PI1-3 text in place and
 * adds PLO2-11's PIs, which the workbook never had.
 *
 * Usage: npx ts-node prisma/seed/seed-performance-indicators.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Index = PLO number (1-11) - 1. Order matches the curriculum doc's CS01-CS11
// sequence, which lines up 1:1 with this program's PLO1-11 (same ABET a-k
// wording -- see the ordinal correspondence noted in the analysis).
const PI_BY_PLO: string[][] = [
  // PLO1 / CS01 - Knowledge for Solving Computing Problems
  [
    'Use mathematics and statistics to model situations in computer science',
    'Use discrete mathematics techniques and algorithms',
    'Solve a problem using knowledge of computer systems or programming',
  ],
  // PLO2 / CS02 - Problem Analysis
  [
    'Identify key components and algorithms necessary for a solution',
    'Produce a solution with specifications',
    'Analyze at least two possible solutions to a given problem and select the best solution for the given problem',
  ],
  // PLO3 / CS03 - Design / Development of Solutions (part 1)
  [
    'Understand performance and cost as these are related to software/firmware-based and hardware-based implementations',
    'Produce a reasonable design strategy, including tasks and subtasks, timelines, and evaluation of progress',
    'Define a clear specification and objective with consideration for realistic constraints',
  ],
  // PLO4 / CS04 - Design / Development of Solutions (part 2)
  [
    'Identify constraints on the design problem and establish criteria for acceptability of solutions',
    'Carry the solution through to the most economic/desirable solution and justify the approach',
    'Design and implement the selected solution for a given problem',
  ],
  // PLO5 / CS05 - Design / Development of Solutions (part 3)
  [
    'Produce an appropriate software design based on specified user requirements',
    'Demonstrate principles of software engineering and testing',
    'Implement software requirement appropriate to the project scope and complexity',
    'Judge the impact of the implemented solution to society and environment',
  ],
  // PLO6 / CS06 - Modern Tool Usage
  [
    'Demonstrate ability to use appropriate software development or hardware tools',
    'Demonstrate ability to use the appropriate software development or hardware techniques',
    'Utilize problem-solving skills and techniques to complete the task',
  ],
  // PLO7 / CS07 - Individual and Teamwork
  [
    'Understand and fulfill roles and responsibilities',
    'Listen and work with others',
    'Communicate effectively with the group',
  ],
  // PLO8 / CS08 - Communication
  [
    'Effectively organize and structure a presentation or document',
    'Provide appropriate content to demonstrate detailed knowledge of subject area',
    'Effectively communicate details appropriate to the audience, including questions',
    'Provide effective and appropriate visual aids and graphics',
    'Write using proper spelling and grammar',
    'Deliver oral presentation effectively',
  ],
  // PLO9 / CS09 - Computing Professionalism and Ethics (part 1)
  [
    'Identify issues of economic, environmental, and societal importance',
    'Understand the impact of computing solutions on society and the environment',
    'Consider a variety of available options in computing design and make a proper choice based on their impact',
  ],
  // PLO10 / CS10 - Computing Professionalism and Ethics (part 2)
  [
    'Recognize ethical issues involved in a professional setting',
    'Recognize and describe current issues on security',
    'Respect and honor ethics in writing assignments',
  ],
  // PLO11 / CS11 - Life-long Learning
  [
    'Read and report on papers in the technical literature',
    'Involve oneself in professional activities (e.g., meetings, presentations, workshops)',
    'Handle problems for which the required knowledge is not complete',
  ],
];

async function main() {
  const program = await prisma.program.findUnique({ where: { code: 'BSCS' } });
  if (!program) {
    throw new Error('BSCS program not found -- run the xlsx import first.');
  }

  const plos = await prisma.plo.findMany({
    where: { programId: program.id },
    orderBy: { displayOrder: 'asc' },
  });

  let upserted = 0;
  for (const plo of plos) {
    const index = plo.displayOrder - 1;
    const definitions = PI_BY_PLO[index];
    if (!definitions) continue;

    for (let i = 0; i < definitions.length; i++) {
      const code = `PI${i + 1}`;
      await prisma.performanceIndicator.upsert({
        where: { ploId_code: { ploId: plo.id, code } },
        update: { description: definitions[i], displayOrder: i + 1 },
        create: {
          ploId: plo.id,
          code,
          description: definitions[i],
          displayOrder: i + 1,
        },
      });
      upserted += 1;
    }
  }

  console.log(
    `Upserted ${upserted} performance indicators across ${plos.length} PLOs.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
