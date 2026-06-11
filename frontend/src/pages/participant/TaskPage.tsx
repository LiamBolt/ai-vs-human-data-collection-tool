import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { submitTask } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { useSessionSync } from '@/hooks/useSessionSync'
import { useTelemetry } from '@/hooks/useTelemetry'
import { SplitWorkspace } from '@/components/layout/SplitWorkspace'
import { ProgressStepper } from '@/components/layout/ProgressStepper'
import { ContextPanel } from '@/components/layout/ContextPanel'
import { AssistancePanel } from '@/components/participant/AssistancePanel'
import { JustificationField } from '@/components/participant/JustificationField'
import { ConfidenceRating } from '@/components/participant/ConfidenceRating'
import { VerificationFields } from '@/components/participant/VerificationFields'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { getTaskIndex, getTotalTasks, getNextTaskRoute } from './routeUtils'
import { TASK_DATA } from '@/lib/taskData'
import type { VerificationMethod, TaskSubmitPayload } from '@/types'

const CONTROL_S1_RULES = 'No AI, no internet search, no notes, no help from other people. Work quietly and do not discuss answers. Write clearly. Show brief working for numeric tasks. Answer the checks after each task.'
const AI_S1_RULES = 'You may request structured assistance only through the approved channel. Use the lowest help level needed (0–3). You must write your final answer and justification in your own words.'
const S2_RULES = 'AI is removed for everyone in Session 2. No AI, no internet search, no help. Solve independently. Show brief working and write justifications in your own words. Answer checks after each task.'

// Tab-switch modal for Session 2
function TabSwitchModal({ onDismiss }: { onDismiss: () => void }) {
  // Trap focus inside modal
  useEffect(() => {
    const btn = document.getElementById('tab-modal-continue')
    btn?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault() // Cannot be dismissed by Escape
      if (e.key === 'Tab') e.preventDefault() // Focus trapped
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tab-modal-title"
      aria-describedby="tab-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
    >
      <div className="max-w-sm w-full bg-surface-card border border-error/30 rounded-modal p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 id="tab-modal-title" className="text-base font-semibold text-text-primary">
              Tab switch detected
            </h2>
          </div>
          <p id="tab-modal-desc" className="text-sm text-text-secondary leading-relaxed">
            Please stay on this page during Session 2. This event has been recorded.
          </p>
        </div>
        <button
          id="tab-modal-continue"
          type="button"
          onClick={onDismiss}
          className="w-full min-h-[44px] px-5 py-2.5 bg-accent text-[#08222F] font-semibold rounded-input hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

interface TaskPageProps {
  session: 1 | 2
}

type Errors = Partial<Record<string, string>>

export default function TaskPage({ session }: TaskPageProps) {
  const { taskCode = '' } = useParams<{ taskCode: string }>()
  const navigate = useNavigate()
  const { syncNow } = useSessionSync()

  const participantCode = useSessionStore((s) => s.participant_code)
  const group = useSessionStore((s) => s.group_assignment)
  const setDraftAnswer = useSessionStore((s) => s.setDraftAnswer)
  const getDraftForTask = useSessionStore((s) => s.getDraftForTask)
  const hintState = useSessionStore((s) => s.hint_state[taskCode])
  const setStep = useSessionStore((s) => s.setStep)

  const task = TASK_DATA[taskCode]
  const draft = getDraftForTask(taskCode)

  const isAI = group === 'AI_ASSISTED'
  const showAssistance = isAI && session === 1

  const {
    recordStart,
    recordFirstAnswer,
    recordEnd,
    getTimerDurations,
    onObjectiveChange,
    answerChangeCount,
    pasteBlockedMessage,
    showTabModal,
    dismissTabModal,
  } = useTelemetry(taskCode)

  // Timer starts on mount
  useEffect(() => {
    recordStart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Local answer state (mirrors draft store) ──
  const [objectiveAnswer, setObjectiveAnswer] = useState<string>((draft['objective'] as string | undefined) ?? '')
  const [c2Plan, setC2Plan] = useState<string>((draft['c2_plan'] as string | undefined) ?? '')
  const [c2Amount, setC2Amount] = useState<string>((draft['c2_amount'] as string | undefined) ?? '')
  const [copyUsed, setCopyUsed] = useState<'yes' | 'no' | null>((draft['copy_used'] as 'yes' | 'no' | undefined) ?? null)
  const [verified, setVerified] = useState<'yes' | 'no' | null>((draft['verified'] as 'yes' | 'no' | undefined) ?? null)
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | null>(
    (draft['verification_method'] as VerificationMethod | undefined) ?? null
  )
  const [verificationMethodOther, setVerificationMethodOther] = useState<string>((draft['verification_method_other'] as string | undefined) ?? '')
  const [verificationEvidence, setVerificationEvidence] = useState<string>((draft['verification_evidence'] as string | undefined) ?? '')
  const [controlCompliance, setControlCompliance] = useState<boolean>((draft['control_compliance'] as boolean | undefined) ?? false)
  const [taskFamiliarity, setTaskFamiliarity] = useState<'yes' | 'no' | null>((draft['task_familiarity'] as 'yes' | 'no' | undefined) ?? null)
  const [selfCheck, setSelfCheck] = useState<'yes' | 'no' | null>((draft['self_check'] as 'yes' | 'no' | undefined) ?? null)
  const [confidence, setConfidence] = useState<number | null>((draft['confidence'] as number | undefined) ?? null)
  const [notes, setNotes] = useState<string>((draft['notes'] as string | undefined) ?? '')
  const [errors, setErrors] = useState<Errors>({})

  const setField = (field: string, value: unknown) => {
    setDraftAnswer(taskCode, field, value)
  }

  const handleObjectiveChange = (value: string, prevValue: string) => {
    onObjectiveChange(field_id_for_task(taskCode), prevValue, value)
    recordFirstAnswer()
  }

  const field_id_for_task = (code: string) => `${code}-objective`

  const mutation = useMutation({
    mutationFn: (payload: TaskSubmitPayload) => submitTask(taskCode, payload),
    onSuccess: () => {
      const next = getNextTaskRoute(session, taskCode)
      setStep(`${session === 1 ? 's1' : 's2'}_task_${taskCode}`)
      navigate(next, { replace: true })
    },
  })

  const getJustification = () => (draft['justification'] as string | undefined) ?? ''

  const validate = (): boolean => {
    const errs: Errors = {}
    const justification = getJustification()

    // Objective answer
    if (taskCode === 'C2') {
      if (!c2Plan) errs.objective = 'Please select a plan.'
      if (!c2Amount.trim()) errs.c2Amount = 'Please enter the amount.'
    } else {
      if (!objectiveAnswer.trim()) errs.objective = 'Please provide an answer.'
    }

    // Justification min 30 chars
    if (justification.trim().length < 30) {
      errs.justification =
        'Please provide a brief explanation of your reasoning (minimum 30 characters) to continue.'
    }

    // AI group S1 checks
    if (isAI && session === 1) {
      if (!copyUsed) errs.copyUsed = 'Please indicate whether you used wording from the assistance.'
      if (!verified) errs.verified = 'Please indicate whether you verified your answer.'
      if (verified === 'yes') {
        if (!verificationMethod) errs.verificationMethod = 'Please select a verification method.'
        if (!verificationEvidence.trim()) {
          errs.verificationEvidence = 'Please provide verification evidence (one sentence).'
        }
      }
    }

    // Control S1 check
    if (!isAI && session === 1) {
      if (!controlCompliance) {
        errs.controlCompliance =
          'Please confirm that you did not use AI or other help for this task.'
      }
    }

    // Checks
    if (!taskFamiliarity) errs.taskFamiliarity = 'Please answer this check.'
    if (!selfCheck) errs.selfCheck = 'Please answer this check.'
    if (!confidence) errs.confidence = 'Please select a confidence rating.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !participantCode) return

    recordEnd()
    const timers = getTimerDurations()

    const objectiveAnswerFinal =
      taskCode === 'C2'
        ? `${c2Plan}|${c2Amount.trim()}`
        : objectiveAnswer.trim()

    const payload: TaskSubmitPayload = {
      participant_code: participantCode,
      session_number: session,
      task_code: taskCode,
      objective_answer: objectiveAnswerFinal,
      text_justification: getJustification(),
      task_familiarity: taskFamiliarity === 'yes',
      self_check: selfCheck === 'yes',
      confidence_rating: confidence as 1 | 2 | 3 | 4 | 5,
      control_compliance: !isAI && session === 1 ? controlCompliance : null,
      assistance_level: isAI && session === 1 ? (hintState?.unlocked_level ?? 0) as 0 | 1 | 2 | 3 : null,
      requests_count: isAI && session === 1 ? (hintState?.request_count ?? 0) : null,
      copy_used: isAI && session === 1 ? copyUsed === 'yes' : null,
      verified: isAI && session === 1 ? verified === 'yes' : null,
      verification_method: isAI && session === 1 && verified === 'yes' ? verificationMethod : null,
      verification_method_other:
        isAI && session === 1 && verified === 'yes' && verificationMethod === 'OTHER'
          ? verificationMethodOther
          : null,
      verification_evidence:
        isAI && session === 1 && verified === 'yes' ? verificationEvidence : null,
      ...timers,
      answer_change_count: answerChangeCount,
      participant_notes: notes.trim() || null,
      telemetry_batch: useSessionStore.getState().telemetry_buffer,
    }

    syncNow()
    mutation.mutate(payload)
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-error">Task not found: {taskCode}</p>
      </div>
    )
  }

  const sessionRules =
    session === 2
      ? S2_RULES
      : isAI
      ? AI_S1_RULES
      : CONTROL_S1_RULES

  const leftPanel = (
    <ContextPanel
      stepTitle={`Session ${session}`}
      taskCode={taskCode}
      taskFamily={task.family}
      question={task.objective_question}
      sessionRules={sessionRules}
      assistancePanel={
        showAssistance
          ? <AssistancePanel taskCode={taskCode} participantCode={participantCode!} />
          : undefined
      }
    />
  )

  const rightPanel = (
    <div className="flex flex-col gap-6">
      <ProgressStepper
        session={session}
        taskIndex={getTaskIndex(session, taskCode)}
        totalTasks={getTotalTasks(session)}
        taskCode={taskCode}
        taskFamily={task.family}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate data-task-field>
        {/* Objective answer */}
        {taskCode === 'C2' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-text-primary">{task.objective_question}</p>
            <RadioGroup
              label="Which plan is cheaper?"
              options={[
                { value: 'DAILY', label: 'Daily plan' },
                { value: 'WEEKLY', label: 'Weekly plan' },
              ]}
              value={c2Plan}
              onChange={(v) => {
                const prev = c2Plan
                setC2Plan(v)
                setField('c2_plan', v)
                handleObjectiveChange(v, prev)
              }}
              error={errors.objective}
            />
            <Input
              label="By how much (UGX)?"
              id={`${taskCode}-c2-amount`}
              name={`${taskCode}-c2-amount`}
              value={c2Amount}
              onChange={(e) => {
                const prev = c2Amount
                setC2Amount(e.target.value)
                setField('c2_amount', e.target.value)
                handleObjectiveChange(e.target.value, prev)
              }}
              error={errors.c2Amount}
              inputMode="numeric"
              inputWidth="w-[15ch]"
            />
          </div>
        ) : task.answer_type === 'YES_NO' ? (
          <RadioGroup
            label={task.objective_question}
            options={[
              { value: 'YES', label: 'Yes' },
              { value: 'NO', label: 'No' },
            ]}
            value={objectiveAnswer || null}
            onChange={(v) => {
              const prev = objectiveAnswer
              setObjectiveAnswer(v)
              setField('objective', v)
              handleObjectiveChange(v, prev)
            }}
            error={errors.objective}
          />
        ) : (
          <Input
            label={task.objective_question}
            id={field_id_for_task(taskCode)}
            name={field_id_for_task(taskCode)}
            value={objectiveAnswer}
            onChange={(e) => {
              const prev = objectiveAnswer
              setObjectiveAnswer(e.target.value)
              setField('objective', e.target.value)
              handleObjectiveChange(e.target.value, prev)
            }}
            onBlur={() => syncNow()}
            error={errors.objective}
            inputMode={task.answer_type === 'NUMERIC' ? 'numeric' : 'text'}
            inputWidth={task.answer_type === 'NUMERIC' ? 'w-[15ch]' : 'w-full'}
          />
        )}

        {/* Justification */}
        <JustificationField
          taskCode={taskCode}
          prompt={task.justification_prompt}
          error={errors.justification}
          onBlur={syncNow}
        />

        {/* Paste blocked message */}
        {pasteBlockedMessage && (
          <div role="alert" className="rounded-input border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            {pasteBlockedMessage}
          </div>
        )}

        {/* AI group S1: Copy used + Verified */}
        {isAI && session === 1 && (
          <div className="flex flex-col gap-5 pt-2 border-t border-border-subtle">
            <RadioGroup
              label="Copy used"
              hint="Did you use wording from the assistance in your answer or justification?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              value={copyUsed}
              onChange={(v) => {
                setCopyUsed(v as 'yes' | 'no')
                setField('copy_used', v)
              }}
              error={errors.copyUsed}
            />

            <RadioGroup
              label="Verified"
              hint="Did you independently verify your answer?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              value={verified}
              onChange={(v) => {
                setVerified(v as 'yes' | 'no')
                setField('verified', v)
              }}
              error={errors.verified}
            />

            {verified === 'yes' && (
              <VerificationFields
                method={verificationMethod}
                onMethodChange={(m) => { setVerificationMethod(m); setField('verification_method', m) }}
                methodOther={verificationMethodOther}
                onMethodOtherChange={(t) => { setVerificationMethodOther(t); setField('verification_method_other', t) }}
                evidence={verificationEvidence}
                onEvidenceChange={(t) => { setVerificationEvidence(t); setField('verification_evidence', t) }}
                errors={{
                  method: errors.verificationMethod,
                  evidence: errors.verificationEvidence,
                }}
              />
            )}
          </div>
        )}

        {/* Control group S1: compliance */}
        {!isAI && session === 1 && (
          <div className="pt-2 border-t border-border-subtle">
            <Checkbox
              label="I did not use AI, internet search, or help from others for this task."
              checked={controlCompliance}
              onChange={(e) => {
                setControlCompliance(e.target.checked)
                setField('control_compliance', e.target.checked)
              }}
            />
            {errors.controlCompliance && (
              <p role="alert" className="mt-1.5 text-xs text-error">{errors.controlCompliance}</p>
            )}
          </div>
        )}

        {/* Checks row */}
        <div className="flex flex-col gap-4 pt-2 border-t border-border-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-disabled">Checks</p>

          <RadioGroup
            label="Task familiarity"
            hint="Have you seen a similar problem before?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={taskFamiliarity}
            onChange={(v) => {
              setTaskFamiliarity(v as 'yes' | 'no')
              setField('task_familiarity', v)
            }}
            error={errors.taskFamiliarity}
          />

          <RadioGroup
            label="Self-check"
            hint="Did you check your answer before submitting?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={selfCheck}
            onChange={(v) => {
              setSelfCheck(v as 'yes' | 'no')
              setField('self_check', v)
            }}
            error={errors.selfCheck}
          />

          <ConfidenceRating
            value={confidence}
            onChange={(v) => {
              setConfidence(v)
              setField('confidence', v)
            }}
            error={errors.confidence}
          />
        </div>

        {/* Notes (optional) */}
        <Input
          label="Notes"
          optional
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setField('notes', e.target.value) }}
          inputWidth="w-full"
        />

        {/* Submit */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            loading={mutation.isPending}
            className="w-full lg:w-auto lg:ml-auto"
          >
            Save &amp; next
          </Button>
          <p className="text-xs text-center text-text-disabled">
            Back is not available — answers are final once submitted.
          </p>
        </div>
      </form>
    </div>
  )

  return (
    <>
      {showTabModal && <TabSwitchModal onDismiss={dismissTabModal} />}
      <SplitWorkspace
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        contextSummary={`${taskCode} — ${task.family}`}
      />
    </>
  )
}
