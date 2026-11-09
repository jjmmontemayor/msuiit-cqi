import Link from "next/link";
import {
  CopyIcon,
  EyeIcon,
  iconLinkClass,
  PencilIcon,
} from "@/components/icon-buttons";
import type { AcademicTerm, CourseOffering } from "@/lib/api";
import {
  addSyllabus,
  copySyllabus,
  updateSyllabusInfo,
} from "@/app/admin/actions";

const SEMESTER_RANK = { FIRST: 1, SECOND: 2, SUMMER: 3 } as const;

const field =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const smallButton =
  "cursor-pointer list-none rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const cellField =
  "w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const popover =
  "absolute right-0 z-20 mt-1 w-72 space-y-2 rounded-md border border-neutral-200 bg-white p-3 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-950";
const primaryButton =
  "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300";

// Newest term first.
export function sortNewestFirst(offerings: CourseOffering[]): CourseOffering[] {
  return [...offerings].sort(
    (a, b) =>
      b.academicTerm.schoolYearStart - a.academicTerm.schoolYearStart ||
      SEMESTER_RANK[b.academicTerm.semester] -
        SEMESTER_RANK[a.academicTerm.semester],
  );
}

function TermSelect({
  academicTerms,
  defaultValue = "",
}: {
  academicTerms: AcademicTerm[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      Academic term
      <select
        name="academicTermId"
        required
        defaultValue={defaultValue}
        className={field}
      >
        <option value="" disabled>
          Select&hellip;
        </option>
        {academicTerms.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// "Add syllabus": a new, blank syllabus for a term and instructor.
export function AddSyllabus({
  programId,
  courseId,
  academicTerms,
}: {
  programId: string;
  courseId: string;
  academicTerms: AcademicTerm[];
}) {
  return (
    <details className="relative">
      <summary className={`${smallButton} text-sm`}>+ Add syllabus</summary>
      <form
        action={addSyllabus.bind(null, programId, courseId)}
        className={popover}
      >
        <p className="text-xs text-neutral-500">
          Start a blank syllabus. To start from an existing one, use Copy.
        </p>
        <TermSelect academicTerms={academicTerms} />
        <label className="block text-sm">
          Section
          <input name="section" maxLength={20} className={field} />
        </label>
        <label className="block text-sm">
          Instructor
          <input name="instructorName" maxLength={255} className={field} />
        </label>
        <button type="submit" className={primaryButton}>
          Add syllabus
        </button>
      </form>
    </details>
  );
}

// Every syllabus for the course, current and previous. Each one carries its
// own learning plan; Copy starts a new syllabus from it for the next instructor.
export function PlanLibrary({
  programId,
  courseId,
  offerings,
  entryCounts,
  currentId,
  editingId,
  academicTerms,
}: {
  programId: string;
  courseId: string;
  offerings: CourseOffering[];
  entryCounts: Record<string, number>;
  currentId: string | undefined;
  editingId: string | undefined;
  academicTerms: AcademicTerm[];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2 text-left">Academic term</th>
            <th className="px-3 py-2 text-left">Section</th>
            <th className="px-3 py-2 text-left">Instructor</th>
            <th className="px-3 py-2 text-right">Weeks</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {offerings.map((o) => {
            const status = o.archivedAt
              ? "Archived"
              : o.id === currentId
                ? "Current"
                : "Previous";
            const editing = o.id === editingId;
            const listUrl = `/programs/${programId}/courses/${courseId}`;
            const formId = `edit-syllabus-${o.id}`;
            return (
              <tr
                key={o.id}
                className={`border-t border-neutral-200 align-top dark:border-neutral-800 ${
                  editing ? "bg-amber-50 dark:bg-amber-950/20" : ""
                }`}
              >
                {editing ? (
                  <>
                    <td className="px-3 py-2">
                      <select
                        form={formId}
                        name="academicTermId"
                        required
                        defaultValue={o.academicTermId}
                        className={cellField}
                      >
                        {academicTerms.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        form={formId}
                        name="section"
                        maxLength={20}
                        defaultValue={o.section ?? ""}
                        className={cellField}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        form={formId}
                        name="instructorName"
                        maxLength={255}
                        defaultValue={o.instructorName ?? ""}
                        placeholder="Instructor"
                        autoFocus
                        className={cellField}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {o.academicTerm.label}
                    </td>
                    <td className="px-3 py-2">{o.section ?? "—"}</td>
                    <td className="px-3 py-2">{o.instructorName ?? "—"}</td>
                  </>
                )}
                <td className="px-3 py-2 text-right">
                  {entryCounts[o.id] ?? 0}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      status === "Current"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {editing ? (
                    <form
                      id={formId}
                      action={updateSyllabusInfo.bind(
                        null,
                        programId,
                        courseId,
                        o.id,
                      )}
                      className="flex items-start justify-end gap-2"
                    >
                      <input type="hidden" name="redirectTo" value={listUrl} />
                      <button type="submit" className={primaryButton}>
                        Save
                      </button>
                      <Link href={listUrl} className={smallButton}>
                        Cancel
                      </Link>
                    </form>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`${listUrl}?offeringId=${o.id}`}
                        title="View"
                        aria-label="View syllabus"
                        className={iconLinkClass}
                      >
                        <EyeIcon />
                      </Link>
                      <form
                        action={copySyllabus.bind(
                          null,
                          programId,
                          courseId,
                          o.id,
                        )}
                      >
                        <button
                          type="submit"
                          title="Copy as a new syllabus"
                          aria-label="Copy syllabus"
                          className={iconLinkClass}
                        >
                          <CopyIcon />
                        </button>
                      </form>
                      <Link
                        href={`${listUrl}?offeringId=${o.id}&edit=1`}
                        title="Edit"
                        aria-label="Edit syllabus"
                        className={iconLinkClass}
                      >
                        <PencilIcon />
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Term, section and instructor of the syllabus that is open for editing.
export function SyllabusInfoForm({
  programId,
  courseId,
  offering,
  academicTerms,
}: {
  programId: string;
  courseId: string;
  offering: CourseOffering;
  academicTerms: AcademicTerm[];
}) {
  return (
    <form
      action={updateSyllabusInfo.bind(null, programId, courseId, offering.id)}
      className="grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-4 dark:border-neutral-800"
    >
      <input
        type="hidden"
        name="redirectTo"
        value={`/programs/${programId}/courses/${courseId}?offeringId=${offering.id}`}
      />
      <h3 className="text-sm font-medium sm:col-span-4">Syllabus info</h3>
      <div className="sm:col-span-2">
        <TermSelect
          academicTerms={academicTerms}
          defaultValue={offering.academicTermId}
        />
      </div>
      <label className="block text-sm">
        Section
        <input
          name="section"
          maxLength={20}
          defaultValue={offering.section ?? ""}
          className={field}
        />
      </label>
      <label className="block text-sm">
        Instructor
        <input
          name="instructorName"
          maxLength={255}
          defaultValue={offering.instructorName ?? ""}
          className={field}
        />
      </label>
      <div className="sm:col-span-4">
        <button type="submit" className={primaryButton}>
          Save
        </button>
      </div>
    </form>
  );
}
