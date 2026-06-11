import { Textarea } from '@/components/ui/Textarea'
import { useSessionStore } from '@/store/session'

interface JustificationFieldProps {
  taskCode: string
  prompt: string
  error?: string
  onBlur?: () => void
}

export function JustificationField({ taskCode, prompt, error, onBlur }: JustificationFieldProps) {
  const setDraftAnswer = useSessionStore((s) => s.setDraftAnswer)
  // Subscribe to the derived string so the controlled textarea re-renders on every keystroke.
  const value = useSessionStore(
    (s) => (s.draft_answers[`${taskCode}.justification`] as string | undefined) ?? '',
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftAnswer(taskCode, 'justification', e.target.value)
  }

  return (
    <div data-task-field>
      <Textarea
        id={`${taskCode}-justification`}
        name={`${taskCode}-justification`}
        label="Justification"
        hint={prompt}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        minChars={30}
        error={error}
        rows={6}
      />
    </div>
  )
}
