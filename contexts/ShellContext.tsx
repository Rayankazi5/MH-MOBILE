import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/services/api'

// ── Design tokens (mirrors clinician-dashboard/src/pages/patient/Shell.tsx) ──
export const DARK = {
  bg: '#0C0818', bg2: '#120E26', surf: '#1A1430', surf2: '#221B3D',
  pri: '#A78BFA', priDim: '#7C5CFC', acc: '#261D47',
  txt: '#F0EBFF', txt2: '#C4B5FD', txt3: '#7C6FAD',
  bdr: 'rgba(167,139,250,0.12)',
  glass: 'rgba(26,20,48,0.92)',
}
export const LIGHT = {
  bg: '#F4EFFE', bg2: '#EBE4FF', surf: '#FFFFFF', surf2: '#F9F6FF',
  pri: '#7C5CFC', priDim: '#A78BFA', acc: '#EBE4FF',
  txt: '#18102E', txt2: '#6B5B95', txt3: '#9D8EC4',
  bdr: 'rgba(124,92,252,0.12)',
  glass: 'rgba(255,255,255,0.92)',
}

export type Theme = typeof DARK

export const STAGES = {
  S1: { label: 'Normality', clr: '#4ADE80', msg: "You're balanced today.", icon: '🌿' },
  S2: { label: 'Crisis',    clr: '#F87171', msg: 'Immediate support recommended.', icon: '⚠️' },
  S3: { label: 'Seek Help', clr: '#FB923C', msg: 'Consider reaching out to a professional.', icon: '🤝' },
  S4: { label: 'Coping',    clr: '#60A5FA', msg: 'Active recovery in progress.', icon: '💙' },
}
export type StageKey = keyof typeof STAGES

export const FONT_SANS = 'Nunito_400Regular'
export const FONT_SANS_BOLD = 'Nunito_700Bold'
export const FONT_SERIF = 'CormorantGaramond_500Medium'
export const FONT_SERIF_BOLD = 'CormorantGaramond_600SemiBold'

interface ShellCtx {
  c: Theme
  dark: boolean
  setDark: (v: boolean) => void
  stage: StageKey
  refreshStage: () => void
}

const Ctx = createContext<ShellCtx>({ c: DARK, dark: true, setDark: () => {}, stage: 'S1', refreshStage: () => {} })
export const useShell = () => useContext(Ctx)

function deriveStage(scores: { domain: string; score: number }[]): StageKey {
  if (!scores.length) return 'S1'
  const avg = scores.reduce((s, r) => s + r.score, 0) / scores.length
  const mood = scores.find(r => r.domain === 'mood_stability')?.score ?? avg
  const anxiety = scores.find(r => r.domain === 'anxiety')?.score ?? avg
  if (mood > 0.5 || anxiety > 0.5) return 'S2'
  if (avg > 0.35) return 'S3'
  if (avg > 0.22) return 'S4'
  return 'S1'
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true)
  const [stage, setStage] = useState<StageKey>('S1')

  const refreshStage = () => {
    api.patient.history()
      .then(scores => setStage(deriveStage(scores.slice(-5))))
      .catch(() => {})
  }

  useEffect(refreshStage, [])

  return (
    <Ctx.Provider value={{ c: dark ? DARK : LIGHT, dark, setDark, stage, refreshStage }}>
      {children}
    </Ctx.Provider>
  )
}
