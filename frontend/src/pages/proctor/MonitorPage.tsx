import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBatches, getMonitor, overrideWarmupScore } from '@/lib/api'
import { StatusBadge } from '@/components/ui/Badge'
import type { ParticipantMonitorRow } from '@/types'

function SyncAge({ seconds }: { seconds: number }) {
  const color = seconds > 60 ? 'text-warning' : seconds > 120 ? 'text-error' : 'text-text-disabled'
  if (seconds < 5) return <span className="text-xs text-success">Just now</span>
  return <span className={`text-xs ${color}`}>{Math.round(seconds)}s ago</span>
}

function WarmupCell({ row }: { row: ParticipantMonitorRow }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [scoreInput, setScoreInput] = useState(String(row.warmup_score ?? ''))

  const mutation = useMutation({
    mutationFn: (score: number) => overrideWarmupScore(row.participant_id, { score }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitor'] })
      setEditing(false)
    },
  })

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={4}
          value={scoreInput}
          onChange={(e) => setScoreInput(e.target.value)}
          className="w-12 bg-surface-card border border-accent rounded text-sm text-text-primary px-2 py-0.5 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => mutation.mutate(Number(scoreInput))}
          className="text-xs text-accent hover:underline"
        >
          Save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-text-disabled hover:text-text-secondary">Cancel</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${row.warmup_score_overridden ? 'text-warning' : 'text-text-primary'}`}>
        {row.warmup_score ?? '—'}
        {row.warmup_score_overridden && ' *'}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-text-disabled hover:text-accent transition-colors"
        title="Override score"
      >
        Edit
      </button>
    </div>
  )
}

export default function MonitorPage() {
  const [batchId, setBatchId] = useState('')
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: getBatches })

  const { data: roster, isLoading } = useQuery({
    queryKey: ['monitor', batchId],
    queryFn: () => getMonitor(batchId),
    enabled: !!batchId,
    refetchInterval: 5_000,
  })

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Monitor</h1>
        <select
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="bg-surface-card border border-border-subtle rounded-input px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <option value="">Select batch…</option>
          {batches?.map((b) => (
            <option key={b.id} value={b.id}>{b.batch_code}</option>
          ))}
        </select>
      </div>

      {!batchId && (
        <p className="text-sm text-text-disabled">Select a batch to monitor participants.</p>
      )}

      {batchId && isLoading && (
        <p className="text-sm text-text-disabled">Loading…</p>
      )}

      {roster && (
        <div className="overflow-x-auto rounded-card border border-border-subtle">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-card border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[180px]">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[140px]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[160px]">Step</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[100px]">Last sync</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[100px]">Infractions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[120px]">Warm-up</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-disabled w-[100px]">Group</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((row) => (
                <tr
                  key={row.participant_code}
                  className="border-t border-border-subtle hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-primary" title={row.participant_code}>
                      {row.participant_code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-secondary truncate block max-w-[140px]" title={row.current_step}>
                      {row.current_step}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SyncAge seconds={row.last_sync_age_seconds} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={row.infraction_count > 0 ? 'text-error text-sm font-semibold' : 'text-text-disabled text-sm'}>
                      {row.infraction_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <WarmupCell row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-secondary">
                      {row.group_assignment === 'AI_ASSISTED'
                        ? 'AI'
                        : row.group_assignment === 'CONTROL'
                        ? 'Control'
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-text-disabled">
                    No participants checked in yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
