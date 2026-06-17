import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { FormShell } from '@/components/ui/FormShell'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function RaterLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const mutation = useMutation({
    mutationFn: () => login({ username: username.trim(), password }),
    onSuccess: (data) => {
      if (data.role !== 'RATER') {
        setError('This account is not a Rater account.')
        return
      }
      setAuth(data.access_token, data.role, data.display_code)
      navigate('/rater/queue', { replace: true })
    },
    onError: () => setError('Invalid username or password.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) return
    mutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size={76} />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              AI vs the Brain
            </h1>
            <p className="text-sm text-text-secondary">
              Blinded Rater Panel
            </p>
          </div>
        </div>

        <FormShell showBrand={false} eyebrow="Rater access" title="Rater sign-in">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Input label="Username" id="username" name="username" value={username}
              onChange={(e) => setUsername(e.target.value)} autoFocus inputWidth="w-full" />
            <PasswordInput label="Password" id="password" name="password" value={password}
              onChange={(e) => setPassword(e.target.value)} inputWidth="w-full" />
            {error && <p role="alert" className="text-xs text-error">{error}</p>}
            <Button type="submit" loading={mutation.isPending} disabled={!username.trim() || !password} className="w-full">
              Sign in
            </Button>
          </form>
        </FormShell>
      </div>
    </div>
  )
}
