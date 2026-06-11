import { create } from 'zustand'
import type { StaffRole } from '@/types'

const SESSION_KEY = 'staff_token'
const ROLE_KEY = 'staff_role'
const DISPLAY_KEY = 'staff_display_code'

interface AuthStore {
  token: string | null
  role: StaffRole | null
  display_code: string | null
  setAuth: (token: string, role: StaffRole, displayCode: string) => void
  clearAuth: () => void
}

function loadFromSession(): Pick<AuthStore, 'token' | 'role' | 'display_code'> {
  try {
    const token = sessionStorage.getItem(SESSION_KEY)
    const role = sessionStorage.getItem(ROLE_KEY) as StaffRole | null
    const display_code = sessionStorage.getItem(DISPLAY_KEY)
    return { token, role, display_code }
  } catch {
    return { token: null, role: null, display_code: null }
  }
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...loadFromSession(),

  setAuth: (token, role, displayCode) => {
    try {
      sessionStorage.setItem(SESSION_KEY, token)
      sessionStorage.setItem(ROLE_KEY, role)
      sessionStorage.setItem(DISPLAY_KEY, displayCode)
    } catch {
      // sessionStorage unavailable
    }
    set({ token, role, display_code: displayCode })
  },

  clearAuth: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(ROLE_KEY)
      sessionStorage.removeItem(DISPLAY_KEY)
    } catch {
      // ignore
    }
    set({ token: null, role: null, display_code: null })
  },
}))
