import { codeNumber, esc, semesterName } from './typst.util';
import { GRADE_SCALE, type SyllabusData } from './syllabus.types';

// Builds the syllabus as Typst markup, following the department template
// (bscs/syllabus_format/main.typ): same page setup, header and section order.
// Only the data-driven parts are generated.

const PAGE_AND_HEADER = `#set page(
  width: 8.5in,
  height: 13in,
  flipped: true,
  margin: (top: 2in, bottom: 0.75in, left: 1in, right: 1in),
  header: context {
    grid(
      columns: (auto, 1fr, auto),
      align: (left + horizon, left + horizon, right + horizon),
      gutter: 15pt,
      image("iitlogo.png", width: 60pt),
      [
        #text(size: 8pt)[Mindanao State University] \\
        #text(size: 12pt, weight: "bold")[ILIGAN INSTITUTE OF TECHNOLOGY]
        #v(0.2mm)
        #text(size: 8pt)[College of Computer Studies] \\
        *Department of Computer Science*
      ],
      block({
        show table.cell: c => {
          if c.y == 1 {
            set text(size: 12pt, weight: "bold")
            c
          } else {
            set text(size: 6pt, weight: "bold")
            c
          }
        }

        table(
          columns: (2.25cm, 2.25cm, 2.15cm),
          align: (center, center, center),
          stroke: 0.5pt,
          table.cell(colspan: 3, fill: red)[#text(fill: white)[Document Code No.]],
          table.cell(colspan: 3)[FM - MSU-IIT - ACAD - 016],
          table.cell(fill: red)[#text(fill: white)[Revision No.]],
          table.cell(fill: red)[#text(fill: white)[Effective Date]],
          table.cell(fill: red)[#text(fill: white)[Page No.]],
          [00], [08.2026], [#counter(page).get().first() / #counter(page).final().first()]
        )
      })
    )
    v(1pt)
    line(length: 100%, stroke: 0.5pt + gray)
  }
)

#set text(font: "Source Sans Pro", size: 10pt, lang: "en")
#set document(title: [Syllabus])
#set list(spacing: 1em, indent: 1.25em)
#set heading(numbering: "1.")
#show heading: set block(above: 2em, below: 1.5em)
#show link: it => underline(text(fill: blue, it))

#align(center)[
  #title()
]
`;

const cell = (s: string) => `[${s}]`;
const center = (s: string) => `[#align(center + horizon)[${s}]]`;
const pct = (n: number) => `${n}%`;

export function buildSyllabusTyp(d: SyllabusData): string {
  const out: string[] = [PAGE_AND_HEADER];

  // 1. Course information
  const termText = `${d.term.schoolYearStart} - ${d.term.schoolYearEnd}, ${semesterName(d.term.semester)}`;
  out.push(`= Course Information

#table(
  columns: (6cm, 1fr),
  stroke: gray,
  [Course Code], [*${esc(d.course.code)}*],
  [Course Title], [*${esc(d.course.title)}*],
  [Course Description], ${cell(esc(d.course.description) || '—')},
  [Credits], ${cell(d.course.credits != null ? `${d.course.credits} unit${d.course.credits === 1 ? '' : 's'}` : '—')},
  [Modality], ${cell(esc(d.offering.modality) || '—')},
  [Pre-requisite / Co-requisite], ${cell(esc(d.course.prerequisites) || 'None')},
  [A.Y. and Semester], ${cell(esc(termText))},
  [Population], ${cell(d.offering.population != null ? `${d.offering.population} students` : '—')}
)
`);

  // 2. Course learning outcomes
  out.push(`= Course Learning Outcomes

At the end of the semester, students should be able to:
${
  d.clos.length === 0
    ? '- _No course learning outcomes defined yet._'
    : d.clos.map((c) => `- (*${esc(c.code)}*) ${esc(c.description)}`).join('\n')
}
`);

  // 3. CLO -> PLO alignment
  if (d.clos.length > 0 && d.plos.length > 0) {
    const cols = ['1fr', ...d.clos.map(() => '1fr')].join(', ');
    const header = [
      center('*Program Learning Outcome*'),
      ...d.clos.map((c) => cell(`*${esc(c.code)}*: ${esc(c.description)}`)),
    ].join(', ');
    const rows = d.plos
      .map((p) =>
        [
          cell(`*${esc(p.code)}:* ${esc(p.description)}`),
          ...d.clos.map((c) => {
            const level = d.mappings[`${c.id}::${p.id}`];
            return level ? center(`*${esc(level)}*`) : '[]';
          }),
        ].join(', '),
      )
      .join(',\n  ');
    out.push(`= Alignment of Course Learning Outcomes (CLOs) to Program Learning Outcomes (PLOs)

#table(
  columns: (${cols}),
  stroke: gray,
  ${header},
  ${rows}
)
`);
  }

  // 4. Assessment blueprint
  const tasksByClo = (cloId: string) => d.tasks.filter((t) => t.cloId === cloId);
  const bpRows = d.clos
    .map((c) => {
      const tasks = tasksByClo(c.id);
      const names = tasks.length ? tasks.map((t) => esc(t.name)).join('; ') : '—';
      const taskWeights = tasks.length
        ? tasks.map((t) => `${esc(t.name)} (${pct(t.weight)})`).join(' \\ ')
        : '—';
      return `[${esc(c.code)}], ${cell(esc(c.description))}, ${cell(esc(c.taxonomy) || '—')}, ${cell(names)}, ${cell(esc(c.evidenceReference) || '—')}, ${cell(taskWeights)}, ${center(pct(c.weight))}`;
    })
    .join(',\n  ');
  out.push(`= Assessment Blueprint and Grading System

${
  d.clos.length === 0
    ? '_No course learning outcomes defined yet._'
    : `#table(
  columns: (2cm, 1fr, 2.5cm, 5cm, 5cm, 4.5cm, 2cm),
  stroke: gray,
  table.header(
    table.cell(rowspan: 2, align: center+horizon)[*CLO*],
    table.cell(rowspan: 2, align: center+horizon)[*Learning Outcome Description*],
    table.cell(rowspan: 2, align: center+horizon)[*Learning Taxonomy*],
    table.cell(rowspan: 2, align: center+horizon)[*Primary Assessment Tool/Task*],
    table.cell(rowspan: 2, align: center+horizon)[*Rubric / Evidence Reference*],
    table.cell(colspan: 2, align: center)[*Weight*],
    table.cell(align: center+horizon)[*Assessment Task*],
    table.cell(align: center+horizon)[*CLO*]
  ),
  align: (horizon, left, left, left, left, left, center+horizon),
  ${bpRows}
)`
}

The weight of all assessment tasks that will contribute to the achievement of a CLO will have a total of 100%. The CLO weights are used to compute the overall score of CLO attainment.
`);

  // 5. Learning plan
  const cloCols = d.clos.length;
  const planCols = [
    '3.25cm',
    '1fr',
    '1fr',
    ...d.clos.map(() => '1.25cm'),
    '1fr',
    '2.75cm',
    '3.5cm',
  ].join(', ');
  const planAlign = [
    'left',
    'left',
    'left',
    ...d.clos.map(() => 'center+horizon'),
    'left',
    'left',
    'left',
  ].join(', ');
  const planHeader = `    table.cell(rowspan: 2, align: center+horizon)[*Week*],
    table.cell(rowspan: 2, align: center+horizon)[*Topics*],
    table.cell(rowspan: 2, align: center+horizon)[*Lesson Learning Outcome*],
    ${cloCols > 0 ? `table.cell(colspan: ${cloCols}, align: center+horizon)[*Course Learning Outcome*],` : ''}
    table.cell(rowspan: 2, align: center+horizon)[*Teaching / Learning Activities*],
    table.cell(rowspan: 2, align: center+horizon)[*Learning Resources*],
    table.cell(rowspan: 2, align: center+horizon)[*Assessment*],
${d.clos.map((c) => `    table.cell(align: center+horizon)[*${esc(c.code)}*]`).join(',\n')}`;
  const planRows = d.plan
    .map((e) => {
      const labelled = new Set(
        (e.coLabels ?? '').match(/\d+/g)?.map((n) => Number(n)) ?? [],
      );
      const ticks = d.clos.map((c) => {
        const n = codeNumber(c.code);
        return n != null && labelled.has(n) ? '[#sym.checkmark]' : '[]';
      });
      return [
        cell(esc(e.weekLabel)),
        cell(esc(e.topics)),
        cell(esc(e.lessonOutcome)),
        ...ticks,
        cell(esc(e.methodology)),
        cell(esc(e.learningResources)),
        cell(esc(e.assessment)),
      ].join(', ');
    })
    .join(',\n  ');
  out.push(`= Learning Plan

${
  d.plan.length === 0
    ? '_No learning plan entries yet._'
    : `#table(
  columns: (${planCols}),
  stroke: gray,
  table.header(
${planHeader}
  ),
  align: (${planAlign}),
  ${planRows}
)`
}
`);

  // 6. Grading
  const finalWeight = 100 - d.offering.courseworkWeight;
  const scaleRows = GRADE_SCALE.map(
    (r) =>
      `[${r.min === 0 ? `below – ${r.max}` : `${r.min.toFixed(2)} - ${r.max}`}], [${r.grade}]`,
  ).join(',\n    ');
  out.push(`= Grading

#columns(2, gutter: 12pt)[

== Grading Scheme

The overall score will be determined based on the following scheme:

#align(center)[
  #table(
    columns: (3in, auto),
    stroke: gray,
    align: left,
    [*Measurement*], [*Weight*],
    [*Coursework*: \\
    - combination of several direct assessments such as exams or quizzes, assignments, oral discussion, essays/reflections, etc. ], [#align(center+horizon)[*${d.offering.courseworkWeight}%*]],
    [*Final Assessment* \\
    - Final Exam and/or final project
    ], [#align(center+horizon)[*${finalWeight}%*]]
  )
]

The number of exams or quizzes, homeworks or assignments, laboratory activities, and other deliverables will vary for the whole semester. The student is expected to get at least 60% of the total marks of every measurement. The total weight of all these measurements is *100%*.

#colbreak()

== Grading Scale

The student should be able to get the *minimum rate of 60% to pass the course*. The rate is mapped to the actual grade based on the following scale:

#align(center)[
  #table(
    columns: (1.5in, auto),
    stroke: gray,
    align: (left, center),
    [*Scale*], [*Equivalent Grade*],
    ${scaleRows}
  )
]

]
`);

  // 7. References
  const refs = (d.offering.references ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  out.push(`= References

== Textbooks

${refs.length ? refs.map((r) => `+ ${esc(r)}`).join('\n') : '_None listed._'}
`);

  // 8. Policies
  out.push(`= Classroom Policies

${esc(d.offering.classroomPolicies) || '(Refer to Student’s Handbook for the details.)'}
`);

  // 9. Approval
  const prepared = d.offering.preparedBy || d.offering.instructorName || '';
  out.push(`= Approval

#table(
  columns: (1fr, 1fr, 1fr),
  rows: (auto, 1.5cm, auto),
  stroke: gray,
  align: (col, row) => if row == 0 {
    left
  } else {
    center
  },
  [*Prepared by:*], [*Reviewed by:*], [*Approved by:*],
  [], [], [],
  [*${esc(prepared)}*], ${d.offering.reviewedBy ? `[*${esc(d.offering.reviewedBy)}*]` : '[#underline(box(width: 7cm, repeat(sym.space)))]'}, [*${esc(d.offering.approvedBy)}*],
  [Faculty Member], [Academic Program Coordinator], [Department Chairperson]
)
`);

  return out.join('\n');
}
