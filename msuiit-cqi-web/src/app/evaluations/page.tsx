import { apiFetch, type PerformanceIndicator, type PiEvaluation, type Plo, type Program } from '@/lib/api';

export const dynamic = 'force-dynamic';

type PloWithPis = Plo & { performanceIndicators: PerformanceIndicator[] };

export default async function EvaluationsPage() {
  const programs = await apiFetch<Program[]>('/programs');
  const program = programs[0];

  if (!program) {
    return (
      <p className="text-sm text-neutral-500">
        No program found yet — run the xlsx import seed script in msuiit-cqi-api.
      </p>
    );
  }

  const [plos, evaluations] = await Promise.all([
    apiFetch<PloWithPis[]>(`/plos?programId=${program.id}`),
    apiFetch<PiEvaluation[]>('/evaluations'),
  ]);

  const evaluationByPi = new Map(evaluations.map((e) => [e.piId, e]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">PLO Evaluation — {program.code}</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Performance indicator benchmarks, targets, and narrative results per
          cohort.
        </p>
      </div>

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
  );
}
