import { useQuery, useMutation } from '@tanstack/react-query'
import { getExportMeta, downloadExport } from '@/lib/api'
import { ApiError } from '@/lib/queryClient'
import { Card, CardBody } from '@/components/ui/Card'

function DownloadButton({ name }: { name: string }) {
  const mutation = useMutation({ mutationFn: () => downloadExport(name) })

  const errorMessage =
    mutation.error instanceof ApiError && mutation.error.status === 401
      ? 'Session expired · sign out and sign in again.'
      : mutation.isError
      ? 'Download failed. Please try again.'
      : null

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1 shrink-0">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={[
          'inline-flex items-center justify-center gap-2',
          'min-h-[44px] min-w-[44px] px-4 py-2',
          'rounded-input border border-border-subtle',
          'text-sm font-medium text-text-secondary bg-surface-card',
          'hover:bg-surface-hover hover:text-text-primary',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        {mutation.isPending ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Preparing…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </>
        )}
      </button>
      {errorMessage && (
        <p role="alert" className="text-xs text-error sm:text-right">{errorMessage}</p>
      )}
    </div>
  )
}

const EXPORT_LABELS: Record<string, string> = {
  participants: 'Participants',
  task_responses: 'Task responses',
  telemetry_events: 'Telemetry events',
  hint_events: 'Hint events',
  scale_responses: 'Scale responses',
  rater_scores: 'Rater scores',
  session_meta: 'Session metadata',
  deviation_logs: 'Deviation logs',
  layer2_logs: 'Layer 2 logs',
  data_dictionary: 'Data dictionary',
}

const EXPORT_DESCRIPTIONS: Record<string, string> = {
  participants: 'Demographics, group assignment, warm-up scores',
  task_responses: 'All task answers, justifications, timers, AI metrics',
  telemetry_events: 'Raw behavioral events stream',
  hint_events: 'Hint unlock/copy events with timing',
  scale_responses: 'Post-block Likert scale ratings',
  rater_scores: 'Blinded rater correctness/quality/independence scores',
  session_meta: 'Session start/end times and transfer prompt',
  deviation_logs: 'Proctor-noted protocol deviations',
  layer2_logs: 'Layer 2 calibration AI tool entries',
  data_dictionary: 'Schema documentation for all exports',
}

export default function ExportsPage() {
  const { data: meta, isLoading } = useQuery({
    queryKey: ['export-meta'],
    queryFn: getExportMeta,
  })

  const EXPORT_NAMES = Object.keys(EXPORT_LABELS)

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-text-primary">Exports</h1>
        <p className="text-xs text-text-disabled">
          All CSVs include <code className="font-mono">participant_code</code> as the merge key.
        </p>
      </div>

      {isLoading && <p className="text-sm text-text-disabled">Loading export info…</p>}

      <div className="grid grid-cols-1 gap-3">
        {EXPORT_NAMES.map((name) => {
          const info = meta?.find((m) => m.name === name)
          return (
            <Card key={name}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {EXPORT_LABELS[name] ?? name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {EXPORT_DESCRIPTIONS[name] ?? ''}
                  </p>
                  {info && (
                    <p className="text-xs text-text-disabled mt-0.5">
                      {info.row_count.toLocaleString()} rows
                    </p>
                  )}
                </div>
                <DownloadButton name={name} />
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
