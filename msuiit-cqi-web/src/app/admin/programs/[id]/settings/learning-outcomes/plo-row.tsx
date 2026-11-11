'use client';

import { useState, useTransition } from 'react';
import {
  createPerformanceIndicator,
  deletePerformanceIndicator,
  deletePlo,
  reorderPerformanceIndicators,
  updatePerformanceIndicator,
  updatePlo,
} from '../../../../actions';
import type { Plo } from '@/lib/api';
import { DeleteButton, EditButton } from '@/components/icon-buttons';

const PI_DRAG = 'application/x-pi';

type DragProps = Pick<
  React.HTMLAttributes<HTMLLIElement>,
  'onDragStart' | 'onDragOver' | 'onDrop' | 'onDragEnd'
>;

const HANDLE = (
  <span
    aria-hidden="true"
    title="Drag to reorder"
    className="shrink-0 cursor-grab select-none text-neutral-400 active:cursor-grabbing"
  >
    &#8942;&#8942;
  </span>
);

export function PloRow({
  programId,
  plo,
  code,
  dragProps,
  isDragging,
}: {
  programId: string;
  plo: Plo;
  // Generated from the list position (PLO01, ...), shown instead of plo.code
  // so it updates immediately while dragging.
  code: string;
  dragProps: DragProps;
  isDragging: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPlo, setIsEditingPlo] = useState(false);
  const pis = plo.performanceIndicators ?? [];

  return (
    <li
      // Not draggable while its form is open, so text can be selected.
      draggable={!isEditingPlo}
      {...dragProps}
      className={`px-4 py-2.5 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        {HANDLE}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-2 text-left text-sm"
        >
          <span
            className={`inline-block shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            &#9656;
          </span>
          <span>
            <span className="font-medium">{code}</span>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              {plo.description}
            </span>
            <span className="ml-2 text-xs text-neutral-400">
              ({pis.length} PI{pis.length === 1 ? '' : 's'})
            </span>
          </span>
        </button>
        <EditButton
          title={isEditingPlo ? 'Cancel editing' : 'Edit'}
          onClick={() => {
            setIsEditingPlo(!isEditingPlo);
            if (!isExpanded) setIsExpanded(true);
          }}
        />
        <form action={deletePlo.bind(null, programId, plo.id)}>
          <DeleteButton />
        </form>
      </div>

      {isExpanded && (
        <div className="ml-6 mt-2 space-y-3">
          {isEditingPlo && (
            <form
              action={async (formData) => {
                await updatePlo(programId, plo.id, formData);
                setIsEditingPlo(false);
              }}
              className="grid gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <label className="text-xs">
                Description ({code} &middot; code follows the list order)
                <input
                  name="description"
                  required
                  defaultValue={plo.description}
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <div>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Save PLO
                </button>
              </div>
            </form>
          )}

          {pis.length === 0 ? (
            <p className="text-xs text-neutral-500">No Performance Indicators yet.</p>
          ) : (
            <PiList
              // Reset the local order whenever the saved data changes.
              key={JSON.stringify(pis)}
              programId={programId}
              ploId={plo.id}
              pis={pis}
            />
          )}

          <form
            action={createPerformanceIndicator.bind(null, programId, plo.id)}
            className="grid gap-2 sm:grid-cols-4"
          >
            <label className="text-xs text-neutral-500 sm:col-span-2">
              Add PI (auto-numbered PI{pis.length + 1})
              <input
                name="description"
                required
                placeholder="Describe the performance indicator"
                className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <label className="text-xs text-neutral-500 sm:col-span-2">
              Assessment
              <div className="flex items-end gap-2">
                <input
                  name="assessment"
                  placeholder="How this PI is assessed (optional)"
                  className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="submit"
                  className="mt-0.5 shrink-0 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Add
                </button>
              </div>
            </label>
          </form>
        </div>
      )}
    </li>
  );
}

type Pi = NonNullable<Plo['performanceIndicators']>[number];

// A PLO's performance indicators: drag to reorder; PI1, PI2, ... follow the
// position and are renumbered on the server when the order is saved.
function PiList({
  programId,
  ploId,
  pis,
}: {
  programId: string;
  ploId: string;
  pis: Pi[];
}) {
  const [rows, setRows] = useState(pis);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setRows(next);
    setDragIndex(null);
    startTransition(async () => {
      await reorderPerformanceIndicators(
        programId,
        ploId,
        next.map((p) => p.id),
      );
    });
  }

  return (
    <ul
      className={`divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      {rows.map((pi, i) => (
        <PiRow
          key={pi.id}
          programId={programId}
          piId={pi.id}
          pi={pi}
          code={`PI${i + 1}`}
          isDragging={dragIndex === i}
          dragProps={{
            onDragStart: (e) => {
              // Keep the parent PLO row from treating this as its own drag.
              e.stopPropagation();
              e.dataTransfer.setData(PI_DRAG, pi.id);
              e.dataTransfer.effectAllowed = 'move';
              setDragIndex(i);
            },
            onDragOver: (e) => {
              if (dragIndex !== null && e.dataTransfer.types.includes(PI_DRAG)) {
                e.preventDefault();
                e.stopPropagation();
              }
            },
            onDrop: (e) => {
              // dragIndex is only set in the list the drag started from.
              if (dragIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
              handleDrop(i);
            },
            onDragEnd: () => setDragIndex(null),
          }}
        />
      ))}
    </ul>
  );
}

function PiRow({
  programId,
  piId,
  pi,
  code,
  dragProps,
  isDragging,
}: {
  programId: string;
  piId: string;
  pi: Pi;
  code: string;
  dragProps: DragProps;
  isDragging: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="px-3 py-2">
        <form
          action={async (formData) => {
            await updatePerformanceIndicator(programId, piId, formData);
            setIsEditing(false);
          }}
          className="grid gap-2 sm:grid-cols-4"
        >
          <div className="text-xs font-medium sm:col-span-4">{code}</div>
          <label className="text-xs text-neutral-500 sm:col-span-2">
            Description
            <input
              name="description"
              required
              defaultValue={pi.description}
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500 sm:col-span-2">
            Assessment
            <input
              name="assessment"
              defaultValue={pi.assessment ?? ''}
              placeholder="How this PI is assessed (optional)"
              className="mt-0.5 w-full rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="flex gap-3 sm:col-span-4">
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-600 hover:underline dark:text-neutral-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      draggable
      {...dragProps}
      className={`flex items-center justify-between gap-3 px-3 py-1.5 text-sm ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {HANDLE}
      <div className="min-w-0 flex-1">
        <span className="font-medium">{code}</span>
        <span className="ml-2 text-neutral-600 dark:text-neutral-400">{pi.description}</span>
        {pi.assessment && (
          <span className="ml-2 text-xs text-neutral-400">— Assessed via: {pi.assessment}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <EditButton onClick={() => setIsEditing(true)} />
        <form action={deletePerformanceIndicator.bind(null, programId, piId)}>
          <DeleteButton />
        </form>
      </div>
    </li>
  );
}
