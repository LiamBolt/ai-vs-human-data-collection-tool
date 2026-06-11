export default function WithdrawnPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-text-primary">Thank you</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            You have chosen not to participate. Your decision has been recorded. No data about
            you has been collected.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            You are free to leave. Thank you for your time.
          </p>
        </div>
      </div>
    </div>
  )
}
