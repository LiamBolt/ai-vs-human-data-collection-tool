import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'aivb:theme'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage unavailable — fall through to system preference
  }
  return null
}

function getInitialTheme(): Theme {
  // Light is the default for every device (desktop and mobile). A previously
  // chosen theme is still respected; only the first-visit default is light.
  return readStoredTheme() ?? 'light'
}

function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  // When a screen owns the brightness control in its own mobile chrome (e.g. the
  // task workspace bottom bar), it hides the global floating toggle on mobile so
  // the two don't both appear. Desktop is unaffected.
  floatingToggleHidden: boolean
  setFloatingToggleHidden: (hidden: boolean) => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persistence is best-effort; the in-memory theme still applies
    }
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
  floatingToggleHidden: false,
  setFloatingToggleHidden: (hidden) => set({ floatingToggleHidden: hidden }),
}))

// Ensure the DOM matches the resolved initial theme (the inline script in
// index.html sets this pre-paint; this keeps them in sync if that didn't run).
applyTheme(useThemeStore.getState().theme)
