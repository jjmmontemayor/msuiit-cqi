'use client';

import { useState, useTransition } from 'react';
import { reorderPlos } from '../../../../actions';
import type { Plo } from '@/lib/api';
import { PloRow } from './plo-row';

const PLO_DRAG = 'application/x-plo';

// PLO01, PLO02, ... follow the position in the list; the server applies the
// same numbering when the new order is saved.
export const ploCode = (index: number) =>
  `PLO${String(index + 1).padStart(2, '0')}`;

export function PloList({ programId, plos }: { programId: string; plos: Plo[] }) {
  const [rows, setRows] = useState(plos);
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
      await reorderPlos(
        programId,
        next.map((p) => p.id),
      );
    });
  }

  return (
    <ul
      className={`mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      {rows.map((plo, i) => (
        <PloRow
          key={plo.id}
          programId={programId}
          plo={plo}
          code={ploCode(i)}
          isDragging={dragIndex === i}
          dragProps={{
            onDragStart: (e) => {
              // Ignore drags that start on a nested performance indicator.
              if (e.target !== e.currentTarget) return;
              e.dataTransfer.setData(PLO_DRAG, plo.id);
              e.dataTransfer.effectAllowed = 'move';
              setDragIndex(i);
            },
            onDragOver: (e) => {
              if (e.dataTransfer.types.includes(PLO_DRAG)) e.preventDefault();
            },
            onDrop: (e) => {
              if (!e.dataTransfer.types.includes(PLO_DRAG)) return;
              e.preventDefault();
              handleDrop(i);
            },
            onDragEnd: () => setDragIndex(null),
          }}
        />
      ))}
    </ul>
  );
}
