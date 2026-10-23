import type { Course } from "@/lib/api";

const input =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900";
const card =
  "grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800";
const submit =
  "rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300";

// Year / semester / category / elective-group fields shared by both forms.
function PlacementFields() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <label className="text-sm">
        Year
        <select name="yearLevel" defaultValue="" className={input}>
          <option value="">&mdash;</option>
          {[1, 2, 3, 4, 5, 6].map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Semester
        <select name="term" defaultValue="" className={input}>
          <option value="">&mdash;</option>
          {["1st Sem", "2nd Sem", "Summer"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Category
        <select name="category" defaultValue="" className={input}>
          <option value="">Uncategorized</option>
          <option value="MAJOR">Major</option>
          <option value="MINOR">Minor</option>
          <option value="ELECTIVE">Elective</option>
        </select>
      </label>
      <label className="text-sm">
        Elective group
        <input name="electiveGroup" className={input} />
      </label>
    </div>
  );
}

export function AddCoursePanel({
  availableCourses,
  linkAction,
  createAction,
}: {
  availableCourses: Course[];
  linkAction: (formData: FormData) => void | Promise<void>;
  createAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <details className="rounded-md border border-neutral-200 dark:border-neutral-800">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
        + Add course
      </summary>
      <div className="grid gap-4 border-t border-neutral-200 p-4 dark:border-neutral-800 lg:grid-cols-2">
        <form action={createAction} className={card}>
          <h3 className="text-sm font-medium">Create new course</h3>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">
              Code
              <input
                name="code"
                required
                maxLength={20}
                placeholder="CSC101"
                className={input}
              />
            </label>
            <label className="col-span-2 text-sm">
              Title
              <input name="title" required maxLength={255} className={input} />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">
              Units
              <input
                name="credits"
                type="number"
                min={0}
                defaultValue={3}
                className={input}
              />
            </label>
            <label className="col-span-2 text-sm">
              Description
              <input name="description" className={input} />
            </label>
          </div>
          <PlacementFields />
          <button type="submit" className={submit}>
            Create &amp; Add Course
          </button>
        </form>

        <form action={linkAction} className={card}>
          <h3 className="text-sm font-medium">Add existing course</h3>
          <label className="text-sm">
            Course
            <select name="courseId" required defaultValue="" className={input}>
              <option value="" disabled>
                Select a course&hellip;
              </option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <PlacementFields />
          <button
            type="submit"
            disabled={availableCourses.length === 0}
            className={submit}
          >
            Add Course
          </button>
        </form>
      </div>
    </details>
  );
}
