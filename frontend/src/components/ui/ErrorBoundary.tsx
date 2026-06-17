import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
              <p className="text-sm text-text-secondary leading-relaxed">
                Re-enter your Participant ID to continue · your progress is saved.
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.href = '/'
              }}
              className="w-full min-h-[44px] px-5 py-2.5 bg-accent text-[#08222F] font-semibold rounded-input hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Return to start
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
