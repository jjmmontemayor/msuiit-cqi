import type { Clo } from "@/lib/api";
import { createLearningPlanEntry } from "../../../../../actions";
import { EntryForm } from "./entry-form";

export function AddEntryForm({
  programId,
  courseId,
  offeringId,
  clos,
  weeks,
}: {
  programId: string;
  courseId: string;
  offeringId: string;
  clos: Clo[];
  weeks?: number | null;
}) {
  return (
    <div>
      <EntryForm
        className="mt-3"
        action={createLearningPlanEntry.bind(
          null,
          programId,
          courseId,
          offeringId,
        )}
        clos={clos}
        weeks={weeks}
        title="Add week entry"
        submitLabel="Add Entry"
      />
      <p className="mt-1 text-xs text-neutral-500">
        Assessments are added per week from the table once the entry exists.
      </p>
    </div>
  );
}
