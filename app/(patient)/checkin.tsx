import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { api, type Question } from '@/services/api'
import { useShell } from '@/contexts/ShellContext'

const MAX_VENT_CHARS = 1000
const PHQ_LABELS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Phase = 'idle' | 'loading' | 'active' | 'submitting' | 'completing' | 'done' | 'already_done' | 'error'

export default function Checkin() {
  const router = useRouter()
  const { refreshStage } = useShell()

  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [calendarDays, setCalendarDays] = useState<number[]>([])
  const [numericValue, setNumericValue] = useState('')
  const [error, setError] = useState('')
  const [ventText, setVentText] = useState('')
  const [ventSent, setVentSent] = useState(false)
  const [ventSending, setVentSending] = useState(false)
  const startedAt = useRef(Date.now())

  const question = questions[index] ?? null
  const total = questions.length

  useEffect(() => {
    setSelected(null)
    setCalendarDays([])
    setNumericValue('')
    startedAt.current = Date.now()
  }, [index])

  const goHome = () => router.replace('/(patient)/home')

  const startSession = async () => {
    setPhase('loading')
    setError('')
    try {
      const { session_id, questions: qs } = await api.patient.startSession()
      setSessionId(session_id)
      setQuestions(qs)
      setIndex(0)
      setPhase('active')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start session'
      if (msg === 'already_completed_today') setPhase('already_done')
      else { setError(msg); setPhase('error') }
    }
  }

  const advance = async (rawValue: number | number[]) => {
    if (!sessionId || !question) return
    const rtMs = Date.now() - startedAt.current
    setPhase('submitting')
    try {
      await api.patient.respond(sessionId, question.key, rawValue, rtMs)
      if (index + 1 >= total) {
        setPhase('completing')
        await api.patient.completeSession(sessionId)
        refreshStage()
        setPhase('done')
      } else {
        setIndex(i => i + 1)
        setPhase('active')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer')
      setPhase('error')
    }
  }

  const handlePhq = (value: number) => {
    setSelected(value)
    setTimeout(() => advance(value), 280)
  }

  const handleNumeric = () => {
    const n = parseFloat(numericValue)
    if (isNaN(n)) { setError('Please enter a valid number'); return }
    setError('')
    advance(n)
  }

  const handleVent = async () => {
    if (!ventText.trim() || ventSending) return
    setVentSending(true)
    try {
      await api.patient.submitJournal(ventText.trim())
      setVentSent(true)
    } catch { /* non-critical */ } finally {
      setVentSending(false)
    }
  }

  const toggleDay = (d: number) =>
    setCalendarDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  // ── Full-screen states ──────────────────────────────────────────────────

  if (phase === 'idle' || phase === 'loading') {
    return (
      <Center>
        <Text style={s.bigEmoji}>📋</Text>
        <Text style={s.cardTitle}>Daily Check-in</Text>
        <Text style={s.cardBody}>Answer a few short questions about how you've been feeling. It takes about 3–5 minutes.</Text>
        <PrimaryBtn label={phase === 'loading' ? 'Starting…' : 'Start check-in'} disabled={phase === 'loading'} onPress={startSession} />
        <GhostBtn label="Back" onPress={goHome} />
      </Center>
    )
  }

  if (phase === 'already_done') {
    return (
      <Center>
        <Text style={s.bigEmoji}>✅</Text>
        <Text style={s.cardTitle}>Already checked in today</Text>
        <Text style={s.cardBody}>You've completed today's check-in. You can edit or delete it from your home page.</Text>
        <PrimaryBtn label="Back to home" onPress={goHome} />
      </Center>
    )
  }

  if (phase === 'done') {
    return (
      <Center>
        <Text style={s.bigEmoji}>✅</Text>
        <Text style={s.cardTitle}>Check-in complete!</Text>
        <Text style={[s.cardBody, { marginBottom: 24 }]}>Your responses have been recorded. Your clinician will be able to review your progress.</Text>

        {!ventSent ? (
          <View style={s.ventBox}>
            <Text style={s.ventTitle}>Anything else on your mind?</Text>
            <Text style={s.ventSub}>Optional — share whatever you're feeling right now.</Text>
            <TextInput
              value={ventText}
              onChangeText={t => setVentText(t.slice(0, MAX_VENT_CHARS))}
              placeholder="Write freely…" placeholderTextColor="#4b5563"
              multiline style={s.ventInput}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>{ventText.length}/{MAX_VENT_CHARS}</Text>
              <TouchableOpacity onPress={handleVent} disabled={!ventText.trim() || ventSending} style={[s.shareBtnWrap, !ventText.trim() && { opacity: 0.5 }]}>
                <LinearGradient colors={ventText.trim() ? ['#8b5cf6', '#6d28d9'] : ['#1f2937', '#1f2937']} style={s.shareBtn}>
                  <Text style={{ color: ventText.trim() ? '#fff' : '#6b7280', fontSize: 13, fontWeight: '600' }}>{ventSending ? 'Saving…' : 'Share'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.ventSaved}>
            <Text style={{ fontSize: 14, color: '#34d399' }}>✓ Thoughts saved</Text>
          </View>
        )}

        <PrimaryBtn label="Explore my insights" onPress={() => router.replace('/(patient)/analysis')} />
        <GhostBtn label="Back to home" onPress={goHome} />
      </Center>
    )
  }

  if (phase === 'error') {
    return (
      <Center>
        <Text style={s.bigEmoji}>⚠️</Text>
        <Text style={[s.cardTitle, { color: '#f87171' }]}>Something went wrong</Text>
        <Text style={s.cardBody}>{error}</Text>
        <PrimaryBtn label="Try again" onPress={() => { setPhase('idle'); setError('') }} />
        <GhostBtn label="Back to home" onPress={goHome} />
      </Center>
    )
  }

  // ── Active question ─────────────────────────────────────────────────────

  const isSubmitting = phase === 'submitting' || phase === 'completing'
  const labels = question?.scale?.labels ?? PHQ_LABELS
  const qType = question?.type ?? 'phq9'
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0

  return (
    <View style={s.page}>
      <LinearGradient colors={['#0a0e1a', '#111827', '#0f172a']} style={StyleSheet.absoluteFill} />
      <View style={s.progressTrack}>
        <LinearGradient colors={['#3b82f6', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={s.header}>
        <Text style={s.headerBrand}>Insight Navigator</Text>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>{phase === 'completing' ? 'Submitting…' : `${index + 1} of ${total}`}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.questionWrap} keyboardShouldPersistTaps="handled">
          {question && (
            <>
              <Text style={s.questionText}>{question.text}</Text>

              {(qType === 'phq9' || qType === 'likert') && (
                <View style={{ gap: 10 }}>
                  {labels.map((label, i) => {
                    const sel = selected === i
                    return (
                      <TouchableOpacity
                        key={i} disabled={isSubmitting} onPress={() => handlePhq(i)}
                        style={[s.option, sel && s.optionSel, isSubmitting && { opacity: 0.7 }]}
                      >
                        <View style={[s.radio, sel && { borderColor: '#3b82f6' }]}>
                          {sel && <View style={s.radioDot} />}
                        </View>
                        <Text style={[s.optionLabel, sel && { color: '#93c5fd', fontWeight: '500' }]}>{label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {qType === 'calendar' && (
                <View>
                  <Text style={s.hint}>Select all that apply</Text>
                  <View style={s.dayRow}>
                    {DAYS.map((d, i) => {
                      const sel = calendarDays.includes(i)
                      return (
                        <TouchableOpacity key={i} disabled={isSubmitting} onPress={() => toggleDay(i)} style={[s.day, sel && s.optionSel]}>
                          <Text style={[s.dayText, sel && { color: '#93c5fd', fontWeight: '600' }]}>{d}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                  <PrimaryBtn label={isSubmitting ? 'Saving…' : 'Continue'} disabled={isSubmitting} onPress={() => advance(calendarDays)} />
                </View>
              )}

              {qType === 'numeric' && (
                <View>
                  {question.scale && (
                    <Text style={[s.hint, { marginBottom: 12 }]}>Enter a number between {question.scale.min} and {question.scale.max}</Text>
                  )}
                  <TextInput
                    value={numericValue}
                    onChangeText={t => { setNumericValue(t); setError('') }}
                    keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#4b5563"
                    returnKeyType="done" onSubmitEditing={handleNumeric}
                    style={s.numericInput}
                  />
                  {error ? <Text style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</Text> : null}
                  <PrimaryBtn label={isSubmitting ? 'Saving…' : 'Continue'} disabled={isSubmitting} onPress={handleNumeric} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.page}>
      <LinearGradient colors={['#0a0e1a', '#111827', '#0f172a']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.centerScroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>{children}</View>
      </ScrollView>
    </View>
  )
}

function PrimaryBtn({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[s.primaryWrap, disabled && { opacity: 0.6 }]}>
      <LinearGradient colors={['#3b82f6', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primary}>
        <Text style={s.primaryText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

function GhostBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.ghost}>
      <Text style={{ color: '#6b7280', fontSize: 15 }}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0e1a' },
  centerScroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingVertical: 40, paddingHorizontal: 32, alignItems: 'center',
  },
  bigEmoji: { fontSize: 44, marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#f3f4f6', marginBottom: 12, textAlign: 'center' },
  cardBody: { color: '#9ca3af', fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 32 },
  primaryWrap: { alignSelf: 'stretch', borderRadius: 10, overflow: 'hidden', marginBottom: 12, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  primary: { paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: { alignSelf: 'stretch', paddingVertical: 10, alignItems: 'center' },
  ventBox: {
    alignSelf: 'stretch', backgroundColor: 'rgba(139,92,246,0.07)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    borderRadius: 12, padding: 18, marginBottom: 20,
  },
  ventTitle: { fontWeight: '600', fontSize: 15, color: '#c4b5fd', marginBottom: 6 },
  ventSub: { color: '#9ca3af', fontSize: 13, marginBottom: 12, lineHeight: 19 },
  ventInput: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#f3f4f6', fontSize: 14, padding: 10, minHeight: 80, textAlignVertical: 'top', marginBottom: 10, lineHeight: 22,
  },
  shareBtnWrap: { borderRadius: 8, overflow: 'hidden' },
  shareBtn: { paddingVertical: 6, paddingHorizontal: 14 },
  ventSaved: {
    alignSelf: 'stretch', backgroundColor: 'rgba(52,211,153,0.07)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 20,
  },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: '100%', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerBrand: { fontWeight: '700', color: '#a5b4fc', fontSize: 16 },
  questionWrap: { paddingHorizontal: 24, paddingVertical: 48 },
  questionText: { fontSize: 20, fontWeight: '600', color: '#f3f4f6', lineHeight: 30, marginBottom: 32 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionSel: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3b82f6' },
  optionLabel: { fontSize: 16, color: '#d1d5db', flex: 1 },
  hint: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  day: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dayText: { fontSize: 15, color: '#d1d5db' },
  numericInput: {
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14,
    fontSize: 20, color: '#f3f4f6', backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16,
  },
})
