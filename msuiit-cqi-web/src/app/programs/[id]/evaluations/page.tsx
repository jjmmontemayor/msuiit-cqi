import Link from 'next/link';
import {
  apiFetch,
  type PerformanceIndicator,
  type PiEvaluation,
  type Plo,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

type PloWithPis = Plo & { performanceIndicators: PerformanceIndicator[] };

export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [plos, evaluations] = await Promise.all([
    apiFetch<PloWithPis[]>(`/plos?programId=${id}`),
    apiFetch<PiEvaluation[]>('/evaluations'),
  ]);

  const evaluationByPi = new Map(evaluations.map((e) => [e.piId, e]));

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Performance indicator benchmarks, targets, and narrative results per
        cohort.
      </p>

      {plos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No PLOs set up for this program yet —{' '}
          <Link href={`/admin/programs/${id}`} className="underline">
            add some in Admin
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-6">
          {plos.map((plo) => (
            <section
              key={plo.id}
              className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <h2 className="font-medium">
                {plo.code}: <span className="font-normal">{plo.description}</span>
              </h2>

              {plo.performanceIndicators.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">
                  No Performance Indicators defined yet for this PLO.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {plo.performanceIndicators.map((pi) => {
                    const evaluation = evaluationByPi.get(pi.id);
                    return (
                      <div
                        key={pi.id}
                        className="rounded-md bg-neutral-50 p-3 text-sm dark:bg-neutral-900"
                      >
                        <p className="font-medium">
                          {pi.code}: <span className="font-normal">{pi.description}</span>
                        </p>
                        <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div>
                            <dt className="text-neutral-500">Benchmark</dt>
                            <dd>{evaluation?.benchmarkDescription ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-neutral-500">Target %</dt>
                            <dd>{evaluation?.targetPercentage ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-neutral-500">Status</dt>
                            <dd>{evaluation?.status ?? 'Not yet evaluated'}</dd>
                          </div>
                        </dl>
                        {evaluation?.resultsNarrative && (
                          <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                            {evaluation.resultsNarrative}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
