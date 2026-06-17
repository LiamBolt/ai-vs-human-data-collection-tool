import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { submitForm0 } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { FormShell } from '@/components/ui/FormShell'
import type { Form0Payload } from '@/types'

type AgeBand = Form0Payload['age_band']
type EducationLevel = Form0Payload['education_level']
type AiFrequency = Form0Payload['ai_use_frequency']

const AGE_OPTIONS = [
  { value: '18_24', label: '18–24' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_PLUS', label: '45+' },
]
const EDUCATION_OPTIONS = [
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'DEGREE', label: 'Degree' },
  { value: 'POSTGRAD', label: 'Postgrad' },
]
const FREQUENCY_OPTIONS = [
  { value: 'NEVER', label: 'Never' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'DAILY', label: 'Daily' },
]
const LIKERT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
]

type Errors = Partial<Record<string, string>>

export default function Form0Page() {
  const navigate = useNavigate()
  const participantCode = useSessionStore((s) => s.participant_code)
  const setStatus = useSessionStore((s) => s.setStatus)
  const setStep = useSessionStore((s) => s.setStep)

  const [ageBand, setAgeBand] = useState<AgeBand | null>(null)
  const [education, setEducation] = useState<EducationLevel | null>(null)
  const [englishComfort, setEnglishComfort] = useState<number | null>(null)
  const [aiFrequency, setAiFrequency] = useState<AiFrequency | null>(null)
  const [aiConfidence, setAiConfidence] = useState<number | null>(null)
  const [b01, setB01] = useState('')
  const [b02, setB02] = useState('')
  const [b03, setB03] = useState<'YES' | 'NO' | null>(null)
  const [b04, setB04] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  const mutation = useMutation({
    mutationFn: (payload: Form0Payload) => submitForm0(payload),
    onSuccess: () => {
      setStatus('FORM0')
      setStep('waiting_assignment')
      navigate('/waiting', { replace: true })
    },
  })

  const validate = (): boolean => {
    const errs: Errors = {}
    if (!ageBand) errs.ageBand = 'Please select your age band.'
    if (!education) errs.education = 'Please select your education level.'
    if (!englishComfort) errs.englishComfort = 'Please rate your English comfort.'
    if (!aiFrequency) errs.aiFrequency = 'Please select your AI use frequency.'
    if (!aiConfidence) errs.aiConfidence = 'Please rate your AI confidence.'
    if (!b01.trim()) errs.b01 = 'Please answer warm-up question 1.'
    if (!b02.trim()) errs.b02 = 'Please answer warm-up question 2.'
    if (!b03) errs.b03 = 'Please answer Yes or No.'
    if (!b04.trim()) errs.b04 = 'Please answer warm-up question 4.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !participantCode) return

    mutation.mutate({
      participant_code: participantCode,
      age_band: ageBand!,
      education_level: education!,
      english_comfort: englishComfort as 1 | 2 | 3 | 4 | 5,
      ai_use_frequency: aiFrequency!,
      ai_confidence: aiConfidence as 1 | 2 | 3 | 4 | 5,
      warmup_b01_answer: b01.trim(),
      warmup_b02_answer: b02.trim(),
      warmup_b03_answer: b03!,
      warmup_b04_answer: b04.trim(),
    })
  }

  return (
    <div className="min-h-screen py-10 px-6 flex justify-center">
      <FormShell
        maxWidth="max-w-xl"
        eyebrow="Background information"
        title="Form 0"
        subtitle="Complete all fields before continuing."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
          {/* Section 1: Demographics */}
          <section className="flex flex-col gap-5">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-subtle pb-2">
              About you
            </h2>

            <RadioGroup
              label="Age band"
              options={AGE_OPTIONS}
              value={ageBand}
              onChange={(v) => { setAgeBand(v as AgeBand); setErrors((e) => ({ ...e, ageBand: undefined })) }}
              error={errors.ageBand}
            />

            <RadioGroup
              label="Highest education level"
              options={EDUCATION_OPTIONS}
              value={education}
              onChange={(v) => { setEducation(v as EducationLevel); setErrors((e) => ({ ...e, education: undefined })) }}
              error={errors.education}
            />

            <RadioGroup
              label="English language comfort (1 = not comfortable, 5 = very comfortable)"
              options={LIKERT_OPTIONS}
              value={englishComfort !== null ? String(englishComfort) : null}
              onChange={(v) => { setEnglishComfort(Number(v)); setErrors((e) => ({ ...e, englishComfort: undefined })) }}
              variant="pills"
              error={errors.englishComfort}
            />

            <RadioGroup
              label="How often do you use AI tools (e.g. ChatGPT)?"
              options={FREQUENCY_OPTIONS}
              value={aiFrequency}
              onChange={(v) => { setAiFrequency(v as AiFrequency); setErrors((e) => ({ ...e, aiFrequency: undefined })) }}
              error={errors.aiFrequency}
            />

            <RadioGroup
              label="Confidence using AI tools (1 = not confident, 5 = very confident)"
              options={LIKERT_OPTIONS}
              value={aiConfidence !== null ? String(aiConfidence) : null}
              onChange={(v) => { setAiConfidence(Number(v)); setErrors((e) => ({ ...e, aiConfidence: undefined })) }}
              variant="pills"
              error={errors.aiConfidence}
            />
          </section>

          {/* Section 2: Warm-up */}
          <section className="flex flex-col gap-5">
            <h2 className="text-base font-semibold text-text-primary border-b border-border-subtle pb-2">
              Warm-up questions
            </h2>

            <Card>
              <CardBody>
                <p className="text-sm font-medium text-warning">
                  Answer these on your own. No AI, no internet search, no help.
                </p>
              </CardBody>
            </Card>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-text-primary">
                B0-1. Eggs cost 800 UGX each. Buy 6 eggs. Total cost?
              </p>
              <Input
                label="Your answer"
                id="b01"
                name="b01"
                value={b01}
                onChange={(e) => { setB01(e.target.value); setErrors((e2) => ({ ...e2, b01: undefined })) }}
                error={errors.b01}
                inputWidth="w-[15ch]"
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-text-primary">
                B0-2. Battery moves from 60% to 75%. Percent point change?
              </p>
              <Input
                label="Your answer"
                id="b02"
                name="b02"
                value={b02}
                onChange={(e) => { setB02(e.target.value); setErrors((e2) => ({ ...e2, b02: undefined })) }}
                error={errors.b02}
                inputWidth="w-[15ch]"
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-text-primary">
                B0-3. If A then B. A is true. Can we conclude B?
              </p>
              <RadioGroup
                label="Your answer"
                options={[
                  { value: 'YES', label: 'Yes' },
                  { value: 'NO', label: 'No' },
                ]}
                value={b03}
                onChange={(v) => { setB03(v as 'YES' | 'NO'); setErrors((e2) => ({ ...e2, b03: undefined })) }}
                error={errors.b03}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-text-primary">
                B0-4. Meeting starts 09:20 and lasts 35 minutes. End time?
              </p>
              <Input
                label="Your answer"
                id="b04"
                name="b04"
                value={b04}
                onChange={(e) => { setB04(e.target.value); setErrors((e2) => ({ ...e2, b04: undefined })) }}
                error={errors.b04}
                inputWidth="w-[15ch]"
              />
            </div>
          </section>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              loading={mutation.isPending}
              className="w-full"
            >
              Save &amp; continue
            </Button>
            <p className="text-xs text-center text-text-disabled">
              Back is not available · answers are final once submitted.
            </p>
          </div>
        </form>
      </FormShell>
    </div>
  )
}
