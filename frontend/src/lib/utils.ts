// Minimal class merging utility (no external dep needed — roll our own)
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim()
}

// Detect device category from user agent
export function detectDeviceCategory(): 'DESKTOP' | 'MOBILE' | 'TABLET' {
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'TABLET'
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini/i.test(ua)) return 'MOBILE'
  return 'DESKTOP'
}

// Detect OS family
export function detectOsFamily(): string {
  const ua = navigator.userAgent
  if (/windows/i.test(ua)) return 'Windows'
  if (/macintosh|mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  return 'Unknown'
}

// Detect browser family
export function detectBrowserFamily(): string {
  const ua = navigator.userAgent
  if (/edg\//i.test(ua)) return 'Edge'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari'
  return 'Unknown'
}

// Format seconds as MM:SS
export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// Play a synthetic chime using Web Audio API; silently ignores errors
export function playChime(): void {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5)

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.6)

    oscillator.onended = () => { ctx.close().catch(() => undefined) }
  } catch {
    // AudioContext blocked or unavailable — silently ignore
  }
}

// Generate a storage key for a participant
export const participantStorageKey = (code: string) => `aivb:${code}`

// Find any stored participant code in localStorage
export function findStoredParticipantCode(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('aivb:')) {
        return key.slice(5)
      }
    }
  } catch {
    // localStorage unavailable
  }
  return null
}

// Debounce utility
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// Clamp a number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Type-safe ClassValue shim (avoids needing the clsx package)
type ClassValue = string | number | boolean | null | undefined | ClassValue[]
