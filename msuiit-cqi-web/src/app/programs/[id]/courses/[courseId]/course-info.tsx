import Link from "next/link";
import type { Clo, Course, CurriculumVersion } from "@/lib/api";
import {
  createClo,
  deleteClo,
  setCloLock,
  updateCourseDetails,
} from "@/app/admin/actions";
import { CloTextCell } from "../../(tabs)/mappings/clo-text-cell";
import { DeleteButton } from "@/components/icon-buttons";

const field =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const primaryButton =
  "rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300";

// Course details and course learning outcomes, editable from the public page
// (prototype: no admin area needed).
export function CourseInfo({
  programId,
  course,
  otherCourses,
  curriculumVersions,
  selectedVersionId,
  clos,
  editing,
  doneHref,
}: {
  programId: string;
  course: Course;
  otherCourses: { id: string; code: string; title: string }[];
  curriculumVersions: CurriculumVersion[];
  selectedVersionId: string | undefined;
  clos: Clo[];
  editing: boolean;
  doneHref: string;
}) {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Course Details</h2>
        </div>

        {!editing ? (
        <dl className="mt-3 grid grid-cols-2 gap-4 rounded-md border border-neutral-200 bg-white p-4 text-sm sm:grid-cols-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div>
            <dt className="text-neutral-500">Credits</dt>
            <dd className="mt-0.5">{course.credits ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lecture hours / week</dt>
            <dd className="mt-0.5">{course.lectureHours ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Lab hours / week</dt>
            <dd className="mt-0.5">{course.labHours ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Weeks</dt>
            <dd className="mt-0.5">{course.weeks ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Prerequisites</dt>
            <dd className="mt-0.5">{course.prerequisites ?? "—"}</dd>
          </div>
        </dl>
        ) : (

          <form
            action={updateCourseDetails.bind(null, programId, course.id)}
            className="mt-3 grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <label className="text-sm">
              Code
              <input
                name="code"
                required
                maxLength={20}
                defaultValue={course.code}
                className={field}
              />
            </label>
            <label className="text-sm sm:col-span-3">
              Title
              <input
                name="title"
                required
                maxLength={255}
                defaultValue={course.title}
                className={field}
              />
            </label>
            <label className="text-sm sm:col-span-4">
              Description
              <textarea
                name="description"
                rows={3}
                defaultValue={course.description ?? ""}
                className={field}
              />
            </label>
            <label className="text-sm">
              Credits (units)
              <input
                name="credits"
                type="number"
                min={0}
                defaultValue={course.credits ?? ""}
                className={field}
              />
            </label>
            <label className="text-sm">
              Lecture hours / week
              <input
                name="lectureHours"
                type="number"
                min={0}
                defaultValue={course.lectureHours ?? ""}
                className={field}
              />
            </label>
            <label className="text-sm">
              Lab hours / week
              <input
                name="labHours"
                type="number"
                min={0}
                defaultValue={course.labHours ?? ""}
                className={field}
              />
            </label>
            <label className="text-sm">
              Number of weeks
              <input
                name="weeks"
                type="number"
                min={1}
                max={52}
                defaultValue={course.weeks ?? ""}
                className={field}
              />
            </label>
            <label className="text-sm">
              Prerequisites
              <select
                name="prerequisites"
                defaultValue={course.prerequisites ?? ""}
                className={field}
              >
                <option value="">None</option>
                {otherCourses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-4">
              <button type="submit" className={primaryButton}>
                Save details
              </button>
              <Link
                href={doneHref}
                className="ml-2 rounded-md border border-neutral-300 px-4 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Course Learning Outcomes</h2>
          {curriculumVersions.length > 0 && (
            <form method="get" className="flex items-end gap-2">
              {editing && <input type="hidden" name="editCourse" value="1" />}
              <label className="text-sm">
                Curriculum Version
                <select
                  name="curriculumVersionId"
                  defaultValue={selectedVersionId}
                  className="mt-1 block w-48 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {curriculumVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                Switch
              </button>
            </form>
          )}
        </div>

        {curriculumVersions.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No curriculum version set up for this program yet &mdash; CLOs are
            scoped per version.
          </p>
        ) : clos.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No CLOs yet for this curriculum version.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {clos.map((clo) => (
              <li
                key={clo.id}
                className="flex items-start justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <CloTextCell
                      programId={programId}
                      courseId={course.id}
                      clo={clo}
                    />
                  ) : (
                    <div className="text-sm">
                      <span className="font-medium">{clo.code}</span>
                      {clo.isLocked && (
                        <span className="ml-2 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          Locked
                        </span>
                      )}
                      <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                        {clo.description}
                      </span>
                    </div>
                  )}
                </div>
                {editing && (
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  <form
                    action={setCloLock.bind(
                      null,
                      programId,
                      course.id,
                      clo.id,
                      !clo.isLocked,
                    )}
                  >
                    <button
                      type="submit"
                      className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
                    >
                      {clo.isLocked ? "Unlock" : "Lock"}
                    </button>
                  </form>
                  {!clo.isLocked && (
                    <form
                      action={deleteClo.bind(null, programId, course.id, clo.id)}
                    >
                      <DeleteButton title="Delete CLO" />
                    </form>
                  )}
                </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {editing && selectedVersionId && (
          <form
            action={createClo.bind(
              null,
              programId,
              course.id,
              selectedVersionId,
            )}
            className="mt-3 grid gap-3 rounded-md border border-neutral-200 bg-white p-4 sm:grid-cols-4 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <p className="text-xs text-neutral-500 sm:col-span-4">
              Code is assigned automatically (CLO{clos.length + 1}) for the
              selected curriculum version.
            </p>
            <label className="text-sm sm:col-span-3">
              Description
              <input name="description" required className={field} />
            </label>
            <label className="text-sm">
              Display order
              <input
                name="displayOrder"
                type="number"
                placeholder={String(clos.length + 1)}
                className={field}
              />
            </label>
            <div className="sm:col-span-4">
              <button type="submit" className={primaryButton}>
                Add CLO
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
