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
  // How the global floating theme toggle should render. A screen that provides
  // its own brightness control sets this so the floating one doesn't also show:
  //   'show'        — default floating toggle (plain participant pages)
  //   'hide-mobile' — hidden on mobile only (task workspace: bottom bar has it)
  //   'hide'        — hidden everywhere (consoles: it lives in the sidebar)
  floatingToggleMode: 'show' | 'hide-mobile' | 'hide'
  setFloatingToggleMode: (mode: 'show' | 'hide-mobile' | 'hide') => void
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
  floatingToggleMode: 'show',
  setFloatingToggleMode: (mode) => set({ floatingToggleMode: mode }),
}))

// Ensure the DOM matches the resolved initial theme (the inline script in
// index.html sets this pre-paint; this keeps them in sync if that didn't run).
applyTheme(useThemeStore.getState().theme)
