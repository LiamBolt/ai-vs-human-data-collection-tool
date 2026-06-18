import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBatches,
  getMonitor,
  checkInParticipant,
  getAssignmentSuggestion,
  setAssignment,
  createDeviation,
} from '@/lib/api'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { detectDeviceCategory, detectOsFamily, detectBrowserFamily } from '@/lib/utils'
import type { CheckInResponse, AssignmentPayload, ParticipantMonitorRow } from '@/types'

const BATCH_KEY = 'proctor:checkinBatch'

function groupName(group: string): string {
  return group === 'AI_ASSISTED' ? 'AI-Assisted' : 'Control'
}

/**
 * Group-assignment control for one participant. It reads server state (the
 * stratified suggestion) rather than any check-in-time local state, so the
 * proctor can assign at any time — including after navigating away and back, or
 * after only ever opening Monitor. On assign it refreshes the batch roster so
 * the participant drops out of the awaiting queue.
 */
function AssignmentCard({
  participantId,
  participantCode,
  batchId,
}: {
  participantId: string
  participantCode: string
  batchId: string
}) {
  const qc = useQueryClient()
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverrideInput, setShowOverrideInput] = useState<'CONTROL' | 'AI_ASSISTED' | null>(null)

  const suggestionQuery = useQuery({
    queryKey: ['assignment-suggestion', participantId],
    queryFn: () => getAssignmentSuggestion(participantId),
    retry: false,
  })
  const suggestion = suggestionQuery.data ?? null

  const deviationMutation = useMutation({
    mutationFn: (reason: string) =>
      createDeviation({
        batch_id: batchId,
        participant_id: participantId,
        description: `Manual group override: ${reason}`,
      }),
  })

  const assignMutation = useMutation({
    mutationFn: (payload: AssignmentPayload) => setAssignment(participantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitor', batchId] })
    },
  })

  const handleOverride = (group: 'CONTROL' | 'AI_ASSISTED') => {
    if (showOverrideInput === group && overrideReason.trim()) {
      deviationMutation.mutate(overrideReason)
      assignMutation.mutate({ group, method: 'MANUAL_OVERRIDE', override_reason: overrideReason })
    } else {
      setShowOverrideInput(group)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-mono text-sm font-semibold text-text-primary">{participantCode}</h3>
          <span className="text-xs text-text-disabled">Form 0 complete</span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-5">
        {suggestionQuery.isLoading ? (
          <p className="text-sm text-text-disabled">Loading suggestion…</p>
        ) : !suggestion ? (
          <p className="text-sm text-text-disabled">Suggestion unavailable. Try again shortly.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-text-secondary">
                Suggested group:{' '}
                <span className="font-semibold text-text-primary">{groupName(suggestion.suggested_group)}</span>
              </p>
              <p className="text-xs text-text-disabled">Stratum: {suggestion.stratum}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                loading={assignMutation.isPending && assignMutation.variables?.method === 'SUGGESTED_ACCEPTED'}
                onClick={() =>
                  assignMutation.mutate({ group: suggestion.suggested_group, method: 'SUGGESTED_ACCEPTED' })
                }
                className="w-full"
              >
                Accept suggestion ({groupName(suggestion.suggested_group)})
              </Button>

              {showOverrideInput !== null && (
                <Input
                  label={`Reason for overriding to ${groupName(showOverrideInput)}`}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  inputWidth="w-full"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOverride('CONTROL')}
                  disabled={showOverrideInput === 'CONTROL' && !overrideReason.trim()}
                  className="flex-1"
                >
                  Override → Control
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOverride('AI_ASSISTED')}
                  disabled={showOverrideInput === 'AI_ASSISTED' && !overrideReason.trim()}
                  className="flex-1"
                >
                  Override → AI-Assisted
                </Button>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default function CheckInPage() {
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: getBatches })

  const [selectedBatchId, setSelectedBatchId] = useState(
    () => sessionStorage.getItem(BATCH_KEY) ?? '',
  )
  useEffect(() => {
    if (selectedBatchId) sessionStorage.setItem(BATCH_KEY, selectedBatchId)
  }, [selectedBatchId])

  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<CheckInResponse | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  // Batch roster — the recoverable source of who is awaiting a group. It is the
  // same query Monitor uses, so assigning here refreshes both.
  const { data: roster } = useQuery({
    queryKey: ['monitor', selectedBatchId],
    queryFn: () => getMonitor(selectedBatchId),
    enabled: !!selectedBatchId,
    refetchInterval: 4000,
  })
  const awaiting: ParticipantMonitorRow[] = (roster ?? []).filter(
    (r) => r.current_step === 'waiting_assignment' && !r.group_assignment,
  )

  const checkInMutation = useMutation({
    mutationFn: () =>
      checkInParticipant({
        batch_id: selectedBatchId,
        consent_given: true,
        device_category: detectDeviceCategory(),
        os_family: detectOsFamily(),
        browser_family: detectBrowserFamily(),
        user_agent_raw: navigator.userAgent,
      }),
    onSuccess: (data) => {
      setLastGenerated(data)
      setConsentConfirmed(false)
      setCheckInError(null)
    },
    onError: () => setCheckInError('Check-in failed. Please try again.'),
  })

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-text-primary">Check-in</h1>

      <Select
        label="Active batch"
        value={selectedBatchId}
        onChange={(e) => setSelectedBatchId(e.target.value)}
      >
        <option value="">Select batch…</option>
        {batches?.map((b) => (
          <option key={b.id} value={b.id}>{b.batch_code}</option>
        ))}
      </Select>

      {selectedBatchId && (
        <>
          {/* New participant */}
          <Card>
            <CardHeader><h2 className="text-sm font-semibold text-text-primary">New participant</h2></CardHeader>
            <CardBody className="flex flex-col gap-5">
              <label className="flex items-start gap-3 min-h-[44px] p-3 rounded-input border border-border-subtle bg-surface-card cursor-pointer hover:bg-surface-hover transition-colors">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-accent"
                />
                <span className="text-sm text-text-primary">Participant has read and confirmed consent (verbal or written).</span>
              </label>

              {checkInError && <p role="alert" className="text-xs text-error">{checkInError}</p>}

              <Button
                type="button"
                loading={checkInMutation.isPending}
                disabled={!consentConfirmed}
                onClick={() => checkInMutation.mutate()}
                className="w-full"
              >
                Generate Participant ID
              </Button>
            </CardBody>
          </Card>

          {/* Last generated ID — convenience so the proctor can read it out */}
          {lastGenerated && (
            <Card>
              <CardBody className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled">
                  Participant ID generated
                </p>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-2xl font-bold text-text-primary tracking-widest">
                    {lastGenerated.participant_code}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(lastGenerated.participant_code)}
                    className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-text-secondary">
                  Hand this code to the participant. Their group can be assigned below once they submit Form 0 —
                  you do not need to stay on this page.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Awaiting group assignment — recoverable from server state */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Awaiting group assignment{awaiting.length > 0 ? ` (${awaiting.length})` : ''}
            </h2>
            {awaiting.length === 0 ? (
              <p className="text-sm text-text-disabled">
                None right now. A participant appears here as soon as they submit Form 0 — assign them then,
                even if you were on another page.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {awaiting.map((row) => (
                  <AssignmentCard
                    key={row.participant_id}
                    participantId={row.participant_id}
                    participantCode={row.participant_code}
                    batchId={selectedBatchId}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
