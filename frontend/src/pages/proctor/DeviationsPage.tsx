import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getBatches, createDeviation } from '@/lib/api'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function DeviationsPage() {
  const { data: batches } = useQuery({ queryKey: ['batches'], queryFn: getBatches })

  const [batchId, setBatchId] = useState('')
  const [participantCode, setParticipantCode] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createDeviation({
        batch_id: batchId,
        description: description.trim(),
      }),
    onSuccess: () => {
      setSubmitted(true)
      setDescription('')
      setParticipantCode('')
    },
    onError: () => setError('Failed to log deviation. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!batchId || !description.trim()) {
      setError('Please select a batch and enter a description.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary">Deviations log</h1>
      <p className="text-sm text-text-secondary">
        Record any deviations from the study protocol. These are logged with a timestamp.
      </p>

      {submitted && (
        <div className="rounded-card border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Deviation logged successfully.
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="ml-3 text-xs text-success underline hover:no-underline"
          >
            Log another
          </button>
        </div>
      )}

      {!submitted && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">New deviation</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="bg-surface-card border border-border-subtle rounded-input px-3 py-2.5 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <option value="">Select batch…</option>
                  {batches?.map((b) => (
                    <option key={b.id} value={b.id}>{b.batch_code}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Participant ID"
                optional
                hint="Leave blank if the deviation applies to the whole batch."
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                inputWidth="w-full"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-input px-3 py-2.5 text-base text-text-primary bg-surface-card border border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 resize-y"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {error && <p role="alert" className="text-xs text-error">{error}</p>}

              <Button type="submit" loading={mutation.isPending} disabled={!batchId || !description.trim()} className="w-full">
                Log deviation
              </Button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
