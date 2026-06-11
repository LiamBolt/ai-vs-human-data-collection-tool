import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createLayer2Log } from '@/lib/api'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Layer2Page() {
  const [participantId, setParticipantId] = useState('')
  const [promptLogId, setPromptLogId] = useState('')
  const [modelName, setModelName] = useState('')
  const [promptCount, setPromptCount] = useState('')
  const [timeInTool, setTimeInTool] = useState('')
  const [similarityNote, setSimilarityNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createLayer2Log({
        participant_id: participantId.trim(),
        prompt_log_id: promptLogId.trim(),
        model_name_shown: modelName.trim(),
        prompt_count: Number(promptCount),
        time_in_tool_minutes: Number(timeInTool),
        copy_similarity_note: similarityNote.trim() || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: () => setError('Failed to save Layer 2 log. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!participantId || !promptLogId || !modelName || !promptCount || !timeInTool) {
      setError('Please fill in all required fields.')
      return
    }
    mutation.mutate()
  }

  const handleReset = () => {
    setSubmitted(false)
    setParticipantId(''); setPromptLogId(''); setModelName('')
    setPromptCount(''); setTimeInTool(''); setSimilarityNote('')
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text-primary">Layer 2 — Calibration log</h1>
        <p className="text-sm text-text-secondary">
          For Layer 2 calibration batches only. Enter after the session.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            Layer 2 log saved.
          </div>
          <Button type="button" variant="secondary" onClick={handleReset}>Log another participant</Button>
        </div>
      ) : (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-text-primary">Calibration entry</h2></CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input label="Participant ID" value={participantId} onChange={(e) => setParticipantId(e.target.value)} inputWidth="w-full" />
              <Input label="Prompt log ID" hint="The ID from the AI tool's log export." value={promptLogId} onChange={(e) => setPromptLogId(e.target.value)} inputWidth="w-full" />
              <Input label="Model name shown" hint="E.g. GPT-4o, Claude 3.5 Sonnet" value={modelName} onChange={(e) => setModelName(e.target.value)} inputWidth="w-full" />
              <Input label="Prompt count" value={promptCount} onChange={(e) => setPromptCount(e.target.value)} inputMode="numeric" inputWidth="w-[10ch]" />
              <Input label="Time in AI tool (minutes)" value={timeInTool} onChange={(e) => setTimeInTool(e.target.value)} inputMode="numeric" inputWidth="w-[10ch]" />
              <Input
                label="Copy similarity note"
                optional
                hint="Brief observation about whether answers appear copied from AI output."
                value={similarityNote}
                onChange={(e) => setSimilarityNote(e.target.value)}
                inputWidth="w-full"
              />
              {error && <p role="alert" className="text-xs text-error">{error}</p>}
              <Button type="submit" loading={mutation.isPending} className="w-full">Save log</Button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
