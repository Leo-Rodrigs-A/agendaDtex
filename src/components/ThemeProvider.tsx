import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

export const PRIMARY_COLORS = [
  { id: 'red', label: 'Vermelho', swatch: '#ef4444' },
  { id: 'orange', label: 'Laranja', swatch: '#f97316' },
  { id: 'yellow', label: 'Amarelo', swatch: '#eab308' },
  { id: 'blue', label: 'Azul', swatch: '#3b82f6' },
  { id: 'green', label: 'Verde', swatch: '#22c55e' },
  { id: 'purple', label: 'Roxo', swatch: '#a855f7' },
] as const

export type PrimaryColorId = (typeof PRIMARY_COLORS)[number]['id']

type ThemeState = {
  theme: ThemeMode
  toggleTheme: () => void
  /** null = paleta neutra padrão (preto/branco) */
  primaryColor: PrimaryColorId | null
  setPrimaryColor: (color: PrimaryColorId | null) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

const THEME_KEY = 'dtex-theme'
const COLOR_KEY = 'dtex-primary-color'

function readInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

function readInitialColor(): PrimaryColorId | null {
  const stored = localStorage.getItem(COLOR_KEY)
  return PRIMARY_COLORS.some((c) => c.id === stored)
    ? (stored as PrimaryColorId)
    : null
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme)
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColorId | null>(
    readInitialColor,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (primaryColor) {
      document.documentElement.dataset.primary = primaryColor
    } else {
      delete document.documentElement.dataset.primary
    }
    if (primaryColor) {
      localStorage.setItem(COLOR_KEY, primaryColor)
    } else {
      localStorage.removeItem(COLOR_KEY)
    }
  }, [primaryColor])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const setPrimaryColor = useCallback((color: PrimaryColorId | null) => {
    setPrimaryColorState(color)
  }, [])

  const value = useMemo<ThemeState>(
    () => ({ theme, toggleTheme, primaryColor, setPrimaryColor }),
    [theme, toggleTheme, primaryColor, setPrimaryColor],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>')
  }
  return ctx
}
