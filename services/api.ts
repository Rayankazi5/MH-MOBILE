import { getItem } from './storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'
const V1 = `${API_BASE}/api/v1`

function extractError(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const { detail } = body as { detail?: unknown }
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown>
    return typeof first?.msg === 'string' ? first.msg : fallback
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getItem('access_token')
  const res = await fetch(`${V1}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(extractError(body, 'Request failed'))
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Shared types ─────────────────────────────────────────────────────────────

export type Role = 'clinician' | 'patient'

export interface AuthUser {
  id: string
  email: string
  role: string
  full_name: string
}

// ── Clinician types ──────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string
  full_name: string
  email: string
  timezone: string
  last_session_at: string | null
  open_flags: number
}

export interface DomainScore {
  domain: string
  score: number
  confidence: number
  date: string
}

export interface Narrative {
  week_start: string
  bullets: string[]
  generated_at: string
}

export interface DissonanceFlag {
  id: string
  flag_type: string
  self_report_val: string
  signal_val: string
  severity: 'low' | 'medium' | 'high'
  resolved: string | null
  created_at: string
}

export interface ProtectiveFactor {
  label: string
  value: string
  strength: 'strong' | 'moderate' | 'low'
  icon: string
}

export interface ProtectiveFactors {
  available: boolean
  session_date: string | null
  factors: ProtectiveFactor[]
}

export interface SessionResponse {
  question_key: string
  question_text: string
  question_type: string
  raw_value: number | number[]
  answer_label: string
}

export interface PatientSession {
  session_id: string
  started_at: string
  completed_at: string | null
  status: 'done' | 'in_progress' | 'abstained' | string
  responses: SessionResponse[]
}

export interface ClinicalReport {
  patient_name: string
  generated_at: string
  period_weeks: number
  period_start: string
  period_end: string
  adherence: { completed: number; abstained: number }
  domain_scores: Record<string, { mean: number; trend: string }>
  executive_summary: string
  domain_notes: Record<string, string>
  behavioral_highlights: string[]
  journal_summary: string
  flags_summary: string
  session_focus_recommendations: string[]
}

// ── Patient types ────────────────────────────────────────────────────────────

export interface Question {
  key: string
  text: string
  type: 'phq9' | 'likert' | 'calendar' | 'numeric' | string
  scale?: { min: number; max: number; labels: string[] } | null
}

export interface SessionStart {
  session_id: string
  questions: Question[]
}

export interface SessionHistoryItem {
  session_id: string
  started_at: string
  completed_at: string | null
  status: 'in_progress' | 'done' | 'abstained' | string
}

export interface JournalEntryItem {
  id: string
  body: string
  word_count: number | null
  sentiment_score: number | null
  source: 'chat' | 'solo' | null
  created_at: string | null
}

export interface InsightResponse {
  response: string
  keyword: string | null
}

export interface HistoryScore {
  domain: string
  score: number
  confidence: number
  date: string
}

// ── API ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (email: string, password: string, fullName: string, role: Role) =>
      request<AuthUser>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      }),

    me: () => request<AuthUser>('/auth/me'),
  },

  clinician: {
    patients: () => request<PatientSummary[]>('/clinician/patients'),

    linkPatient: (patientEmail: string) =>
      request('/clinician/link', {
        method: 'POST',
        body: JSON.stringify({ patient_email: patientEmail }),
      }),

    summary: (patientId: string) =>
      request<PatientSummary>(`/clinician/patient/${patientId}/summary`),

    scores: (patientId: string, weeks = 8) =>
      request<DomainScore[]>(`/clinician/patient/${patientId}/scores?weeks=${weeks}`),

    narrative: (patientId: string) =>
      request<Narrative | null>(`/clinician/patient/${patientId}/narrative`),

    flags: (patientId: string) =>
      request<DissonanceFlag[]>(`/clinician/patient/${patientId}/flags`),

    resolveFlag: (flagId: string) =>
      request(`/clinician/flag/${flagId}/resolve`, { method: 'PATCH', body: JSON.stringify({}) }),

    patientSessions: (patientId: string) =>
      request<PatientSession[]>(`/clinician/patient/${patientId}/sessions`),

    protectiveFactors: (patientId: string) =>
      request<ProtectiveFactors>(`/clinician/patient/${patientId}/protective-factors`),

    generateReport: (patientId: string, weeks = 4) =>
      request<ClinicalReport>(`/clinician/patient/${patientId}/report?weeks=${weeks}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  },

  patient: {
    startSession: () =>
      request<SessionStart>('/patient/session/start', { method: 'POST', body: JSON.stringify({}) }),

    respond: (sessionId: string, questionKey: string, rawValue: number | number[], responseTimeMs: number) =>
      request<{ status: string }>(`/patient/session/${sessionId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ question_key: questionKey, raw_value: rawValue, response_time_ms: responseTimeMs }),
      }),

    completeSession: (sessionId: string) =>
      request<{ status: string }>(`/patient/session/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({}) }),

    resetSession: (sessionId: string) =>
      request<{ session_id: string; status: string }>(`/patient/session/${sessionId}/reset`, { method: 'POST', body: JSON.stringify({}) }),

    deleteSession: (sessionId: string) =>
      request<void>(`/patient/session/${sessionId}`, { method: 'DELETE' }),

    submitJournal: (body: string, source?: 'chat' | 'solo') =>
      request('/patient/journal', { method: 'POST', body: JSON.stringify({ body, source }) }),

    journals: (source?: 'chat' | 'solo') =>
      request<JournalEntryItem[]>(`/patient/journals${source ? `?source=${source}` : ''}`),

    deleteJournal: (id: string) =>
      request<void>(`/patient/journal/${id}`, { method: 'DELETE' }),

    editJournal: (id: string, body: string) =>
      request<{ status: string; word_count: number }>(`/patient/journal/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      }),

    sessions: () => request<SessionHistoryItem[]>('/patient/sessions'),

    history: () => request<HistoryScore[]>('/patient/history'),

    insight: (body: { keyword?: string; free_text?: string }) =>
      request<InsightResponse>('/patient/insights', { method: 'POST', body: JSON.stringify(body) }),
  },
}
