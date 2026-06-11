import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FormShell } from '@/components/ui/FormShell'

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
      <FormShell eyebrow="Rater access" title="Rater sign-in">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Input label="Username" id="username" name="username" value={username}
            onChange={(e) => setUsername(e.target.value)} autoFocus inputWidth="w-full" />
          <Input label="Password" id="password" name="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} inputWidth="w-full" />
          {error && <p role="alert" className="text-xs text-error">{error}</p>}
          <Button type="submit" loading={mutation.isPending} disabled={!username.trim() || !password} className="w-full">
            Sign in
          </Button>
        </form>
      </FormShell>
    </div>
  )
}
