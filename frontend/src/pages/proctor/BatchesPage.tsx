import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBatches, getSites, createBatch } from '@/lib/api'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RadioGroup } from '@/components/ui/RadioGroup'

export default function BatchesPage() {
  const qc = useQueryClient()
  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  })
  const { data: sites } = useQuery({ queryKey: ['sites'], queryFn: getSites })

  const [showForm, setShowForm] = useState(false)
  const [siteId, setSiteId] = useState('')
  const [clinicDate, setClinicDate] = useState('')
  const [layer, setLayer] = useState<'1' | '2'>('1')
  const [timingMode, setTimingMode] = useState<'PER_TASK' | 'BLOCK'>('PER_TASK')
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createBatch({
        site_id: siteId,
        clinic_date: clinicDate,
        layer: Number(layer) as 1 | 2,
        timing_mode: timingMode,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batches'] })
      setShowForm(false)
      setSiteId(''); setClinicDate(''); setLayer('1'); setTimingMode('PER_TASK')
    },
    onError: () => setFormError('Failed to create batch. Check all fields.'),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!siteId || !clinicDate) { setFormError('Please fill in all required fields.'); return }
    mutation.mutate()
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Batches</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'New batch'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Create batch</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Site</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="bg-surface-card border border-border-subtle rounded-input px-3 py-2.5 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <option value="">Select a site…</option>
                  {sites?.map((s) => (
                    <option key={s.id} value={s.id}>{s.site_name} ({s.site_code})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Clinic date"
                type="date"
                value={clinicDate}
                onChange={(e) => setClinicDate(e.target.value)}
                inputWidth="w-[20ch]"
              />

              <RadioGroup
                label="Layer"
                options={[
                  { value: '1', label: 'Layer 1 — Offline Hint Bank' },
                  { value: '2', label: 'Layer 2 — Live ChatGPT calibration' },
                ]}
                value={layer}
                onChange={(v) => setLayer(v as '1' | '2')}
              />

              <RadioGroup
                label="Timing mode"
                options={[
                  { value: 'PER_TASK', label: 'Per task' },
                  { value: 'BLOCK', label: 'Block' },
                ]}
                value={timingMode}
                onChange={(v) => setTimingMode(v as 'PER_TASK' | 'BLOCK')}
              />

              {formError && <p role="alert" className="text-xs text-error">{formError}</p>}

              <Button type="submit" loading={mutation.isPending} className="w-full">
                Create batch
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {batchesLoading ? (
        <p className="text-sm text-text-disabled">Loading batches…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {batches?.length === 0 && (
            <p className="text-sm text-text-disabled">No batches yet.</p>
          )}
          {batches?.map((batch) => (
            <Card key={batch.id}>
              <CardBody className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-text-primary font-mono">{batch.batch_code}</p>
                  <p className="text-xs text-text-secondary">{batch.clinic_date} · Layer {batch.layer} · {batch.timing_mode}</p>
                </div>
                <a
                  href={`/proctor/monitor?batch=${batch.id}`}
                  className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  Monitor
                </a>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
