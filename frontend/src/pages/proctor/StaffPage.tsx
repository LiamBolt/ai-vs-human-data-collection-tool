import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStaff, createStaff, setStaffActive } from '@/lib/api'
import { ApiError } from '@/lib/queryClient'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RadioGroup } from '@/components/ui/RadioGroup'
import type { StaffRole } from '@/types'

export default function StaffPage() {
  const qc = useQueryClient()
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff'], queryFn: getStaff })

  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<StaffRole>('PROCTOR')
  const [displayCode, setDisplayCode] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setUsername(''); setPassword(''); setRole('PROCTOR'); setDisplayCode(''); setFormError(null)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createStaff({
        username: username.trim(),
        password,
        role,
        display_code: displayCode.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setShowForm(false)
      resetForm()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(
          err.code === 'USERNAME_TAKEN'
            ? 'That username is already taken.'
            : err.message,
        )
      } else {
        setFormError('Failed to create the account. Please try again.')
      }
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (username.trim().length < 3) { setFormError('Username must be at least 3 characters.'); return }
    if (password.length < 8) { setFormError('Password must be at least 8 characters.'); return }
    createMutation.mutate()
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary">Staff accounts</h1>
          <p className="text-xs text-text-secondary">
            Create proctor and rater logins. IDs are anonymous codes. Never use real names.
          </p>
        </div>
        <Button type="button" onClick={() => { setShowForm((v) => !v); setFormError(null) }}>
          {showForm ? 'Cancel' : 'New account'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text-primary">Create account</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
              <Input
                label="Username"
                hint="Used only to sign in. At least 3 characters."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />

              <Input
                label="Password"
                hint="At least 8 characters."
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <RadioGroup
                label="Role"
                options={[
                  { value: 'PROCTOR', label: 'Proctor: runs clinics, checks in participants' },
                  { value: 'RATER', label: 'Rater: blinded rubric scoring only' },
                  { value: 'ADMIN', label: 'Admin: full access, manages staff' },
                ]}
                value={role}
                onChange={(v) => setRole(v as StaffRole)}
              />

              <Input
                label="Display ID"
                hint="The code written on forms (e.g. PROCTOR-02). Leave blank to auto-generate."
                value={displayCode}
                onChange={(e) => setDisplayCode(e.target.value)}
                autoComplete="off"
              />

              {formError && <p role="alert" className="text-xs text-error">{formError}</p>}

              <Button type="submit" loading={createMutation.isPending} className="w-full">
                Create account
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-text-disabled">Loading staff…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {staff?.length === 0 && <p className="text-sm text-text-disabled">No staff accounts yet.</p>}
          {staff?.map((member) => (
            <Card key={member.id}>
              <CardBody className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-text-primary">
                    {member.username}
                    {!member.is_active && (
                      <span className="ml-2 text-xs font-normal text-warning">(deactivated)</span>
                    )}
                  </p>
                  <p className="text-xs text-text-secondary font-mono">
                    {member.role} · {member.display_code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => activeMutation.mutate({ id: member.id, isActive: !member.is_active })}
                  disabled={activeMutation.isPending && activeMutation.variables?.id === member.id}
                  className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:underline disabled:opacity-50 transition-opacity duration-150"
                >
                  {member.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
