import { useSessionStore } from '@/store/session'

export default function CompletionPage() {
  const participantCode = useSessionStore((s) => s.participant_code)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center flex flex-col gap-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Study complete
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Thank you for participating. Your responses have been saved. Please inform your
            proctor that you have finished.
          </p>
        </div>

        {participantCode && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-disabled uppercase tracking-wider">
              Your Participant ID
            </p>
            <p className="font-mono text-2xl font-bold text-text-primary tracking-widest">
              {participantCode}
            </p>
            <p className="text-xs text-text-disabled">
              Show this to your proctor for their checklist.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
