import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getBatches,
  checkInParticipant,
  getAssignmentSuggestion,
  setAssignment,
  createDeviation,
} from '@/lib/api'
import { ApiError } from '@/lib/queryClient'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { detectDeviceCategory, detectOsFamily, detectBrowserFamily } from '@/lib/utils'
import type { CheckInResponse, AssignmentPayload, AssignmentSuggestion } from '@/types'

export default function CheckInPage() {
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: getBatches })

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null)
  const [checkInError, setCheckInError] = useState<string | null>(null)

  const [assignedGroup, setAssignedGroup] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverrideInput, setShowOverrideInput] = useState<'CONTROL' | 'AI_ASSISTED' | null>(null)
  const [assignmentDone, setAssignmentDone] = useState(false)

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
      setCheckInResult(data)
      setCheckInError(null)
    },
    onError: () => setCheckInError('Check-in failed. Please try again.'),
  })

  const assignMutation = useMutation({
    mutationFn: (payload: AssignmentPayload) =>
      setAssignment(checkInResult!.participant_id, payload),
    onSuccess: (_, vars) => {
      setAssignedGroup(vars.group)
      setAssignmentDone(true)
      setShowOverrideInput(null)
    },
  })

  const deviationMutation = useMutation({
    mutationFn: (reason: string) =>
      createDeviation({
        batch_id: selectedBatchId,
        participant_id: checkInResult?.participant_id,
        description: `Manual group override: ${reason}`,
      }),
  })

  // Poll for the stratified suggestion — it only exists once the participant
  // submits Form 0 (backend returns 409 FORM0_INCOMPLETE until then).
  const suggestionQuery = useQuery({
    queryKey: ['assignment-suggestion', checkInResult?.participant_id],
    enabled: Boolean(checkInResult) && !assignmentDone,
    retry: false,
    refetchInterval: (query) => (query.state.data ? false : 3000),
    queryFn: async (): Promise<AssignmentSuggestion | null> => {
      try {
        return await getAssignmentSuggestion(checkInResult!.participant_id)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) return null // Form 0 not done yet
        throw err
      }
    },
  })

  const suggestion = suggestionQuery.data ?? null

  const handleAcceptSuggestion = () => {
    if (!suggestion) return
    assignMutation.mutate({
      group: suggestion.suggested_group,
      method: 'SUGGESTED_ACCEPTED',
    })
  }

  const handleOverride = (group: 'CONTROL' | 'AI_ASSISTED') => {
    if (showOverrideInput === group && overrideReason.trim()) {
      deviationMutation.mutate(overrideReason)
      assignMutation.mutate({
        group,
        method: 'MANUAL_OVERRIDE',
        override_reason: overrideReason,
      })
    } else {
      setShowOverrideInput(group)
    }
  }

  const handleReset = () => {
    setCheckInResult(null)
    setAssignedGroup(null)
    setAssignmentDone(false)
    setConsentConfirmed(false)
    setOverrideReason('')
    setShowOverrideInput(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-text-primary">Check-in</h1>

      {!checkInResult ? (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">New participant</h2></CardHeader>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-surface-card border border-border-subtle rounded-input px-3 py-2.5 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <option value="">Select batch…</option>
                {batches?.map((b) => (
                  <option key={b.id} value={b.id}>{b.batch_code}</option>
                ))}
              </select>
            </div>

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
              disabled={!selectedBatchId || !consentConfirmed}
              onClick={() => checkInMutation.mutate()}
              className="w-full"
            >
              Generate Participant ID
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Generated ID */}
          <Card>
            <CardBody className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled">
                Participant ID generated
              </p>
              <div className="flex items-center gap-4">
                <p className="font-mono text-2xl font-bold text-text-primary tracking-widest">
                  {checkInResult.participant_code}
                </p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(checkInResult.participant_code)}
                  className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-text-secondary">
                Hand this code to the participant to enter on their device.
              </p>
            </CardBody>
          </Card>

          {/* Assignment card — appears once Form 0 is complete */}
          {!assignmentDone && !suggestion ? (
            <Card>
              <CardBody className="flex flex-col gap-2">
                <p className="text-sm font-medium text-text-primary">Waiting for Form 0…</p>
                <p className="text-xs text-text-secondary">
                  The group suggestion appears once the participant submits Form 0 on their device.
                </p>
              </CardBody>
            </Card>
          ) : !assignmentDone && suggestion ? (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-text-primary">Group assignment</h2>
              </CardHeader>
              <CardBody className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-text-secondary">
                    Suggested group:{' '}
                    <span className="font-semibold text-text-primary">
                      {suggestion?.suggested_group === 'AI_ASSISTED' ? 'AI-Assisted' : 'Control'}
                    </span>
                  </p>
                  <p className="text-xs text-text-disabled">
                    Stratum: {suggestion?.stratum}
                  </p>
                </div>

                {suggestion?.current_counts && (
                  <div className="rounded-input border border-border-subtle overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-hover">
                          <th className="px-3 py-2 text-left text-text-secondary font-medium">Stratum</th>
                          <th className="px-3 py-2 text-right text-text-secondary font-medium">Control</th>
                          <th className="px-3 py-2 text-right text-text-secondary font-medium">AI-Assisted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(suggestion.current_counts).map(([stratum, count]) => (
                          <tr key={stratum} className="border-t border-border-subtle">
                            <td className="px-3 py-2 text-text-secondary">{stratum}</td>
                            <td className="px-3 py-2 text-right text-text-primary">{String(count)}</td>
                            <td className="px-3 py-2 text-right text-text-primary">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    loading={assignMutation.isPending}
                    onClick={handleAcceptSuggestion}
                    className="w-full"
                  >
                    Accept suggestion ({suggestion?.suggested_group === 'AI_ASSISTED' ? 'AI-Assisted' : 'Control'})
                  </Button>

                  {showOverrideInput !== null && (
                    <Input
                      label={`Reason for overriding to ${showOverrideInput === 'AI_ASSISTED' ? 'AI-Assisted' : 'Control'}`}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      inputWidth="w-full"
                    />
                  )}

                  <div className="flex gap-3">
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
              </CardBody>
            </Card>
          ) : (
            <div className="rounded-card border border-success/30 bg-success/5 px-5 py-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Assigned to: {assignedGroup === 'AI_ASSISTED' ? 'AI-Assisted' : 'Control'}
                </p>
                <p className="text-xs text-text-secondary">Participant may now complete Form 0 on their device.</p>
              </div>
            </div>
          )}

          <Button type="button" variant="ghost" onClick={handleReset}>
            Check in another participant
          </Button>
        </div>
      )}
    </div>
  )
}
