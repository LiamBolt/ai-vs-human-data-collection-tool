import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { submitTransferPrompt } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormShell } from '@/components/ui/FormShell'

export default function TransferPromptPage() {
  const navigate = useNavigate()
  const participantCode = useSessionStore((s) => s.participant_code)
  const setStep = useSessionStore((s) => s.setStep)
  const setStatus = useSessionStore((s) => s.setStatus)

  const [used, setUsed] = useState<'yes' | 'no' | null>(null)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<{ used?: string; text?: string }>({})

  const mutation = useMutation({
    mutationFn: () =>
      submitTransferPrompt({
        participant_code: participantCode!,
        used: used === 'yes',
        text: used === 'yes' ? text : null,
      }),
    onSuccess: () => {
      setStatus('SCALES_S2')
      setStep('scales_s2')
      navigate('/s2/scales', { replace: true })
    },
  })

  const validate = () => {
    const errs: typeof errors = {}
    if (!used) errs.used = 'Please select Yes or No.'
    if (used === 'yes' && !text.trim()) {
      errs.text = 'Please briefly describe the method you used.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) mutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <FormShell
        maxWidth="max-w-lg"
        eyebrow="Transfer prompt"
        title="Method reflection"
        subtitle="Did you use a method you learned or saw in Session 1? If Yes, write one line."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <RadioGroup
            label="Did you use a method from Session 1?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={used}
            onChange={(v) => {
              setUsed(v as 'yes' | 'no')
              setErrors((e) => ({ ...e, used: undefined }))
            }}
            error={errors.used}
          />

          {used === 'yes' && (
            <Input
              label="Briefly describe the method"
              hint="One line is sufficient."
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setErrors((e2) => ({ ...e2, text: undefined }))
              }}
              error={errors.text}
              inputWidth="w-full"
            />
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!used}
              className="w-full"
            >
              Continue to final scales
            </Button>
            <p className="text-xs text-center text-text-disabled">
              Back is not available · answers are final.
            </p>
          </div>
        </form>
      </FormShell>
    </div>
  )
}
