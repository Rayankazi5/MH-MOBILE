import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import Svg, { Circle } from 'react-native-svg'
import { api, type SessionHistoryItem } from '@/services/api'
import { FONT_SANS, FONT_SANS_BOLD, FONT_SERIF, FONT_SERIF_BOLD, STAGES, useShell } from '@/contexts/ShellContext'
import { ArxCard, ArxProg, ArxTag, Sans, SectionLabel, Serif } from '@/components/patient/Arx'

function isToday(d: string | null) {
  return !!d && new Date(d).toDateString() === new Date().toDateString()
}

const METRICS = [
  { label: 'Mood',   clr: '#A78BFA' },
  { label: 'Sleep',  clr: '#60A5FA' },
  { label: 'Social', clr: '#4ADE80' },
]

const RING_R = 23
const CIRCUMFERENCE = 2 * Math.PI * RING_R

export default function PatientHome() {
  const { c, stage, refreshStage } = useShell()
  const router = useRouter()

  const [history, setHistory] = useState<SessionHistoryItem[]>([])
  const [metricVals, setMetricVals] = useState<number[]>([])
  const [riskPct, setRiskPct] = useState(21)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editBusy, setEditBusy] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    refreshStage()
    api.patient.sessions().then(setHistory).catch(() => {})
    api.patient.history().then(scores => {
      const get = (domain: string) => {
        const rows = scores.filter(s => s.domain === domain)
        if (!rows.length) return 50
        const avg = rows.slice(-3).reduce((a, r) => a + r.score, 0) / Math.min(rows.length, 3)
        return Math.round((1 - avg) * 100) // invert: low concern = high %
      }
      setMetricVals([get('mood_stability'), get('sleep_quality'), get('social_withdrawal')])
      const allScores = scores.slice(-5)
      if (allScores.length) {
        const avg = allScores.reduce((a, r) => a + r.score, 0) / allScores.length
        setRiskPct(Math.round(avg * 100))
      }
    }).catch(() => {})
  }, []))

  const completedToday = history.find(s => s.status === 'done' && isToday(s.completed_at)) ?? null
  const stageInfo = STAGES[stage]

  const handleEdit = async (sessionId: string) => {
    setEditBusy(sessionId)
    try {
      await api.patient.resetSession(sessionId)
      router.push('/(patient)/checkin')
    } catch { /* stay on page */ } finally {
      setEditBusy(null)
    }
  }

  const handleDelete = (sessionId: string) => {
    setConfirmDelete(null)
    setHistory(prev => prev.filter(s => s.session_id !== sessionId))
    api.patient.deleteSession(sessionId).catch(() => {})
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning,'
    if (h < 17) return 'Good afternoon,'
    return 'Good evening,'
  }

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const riskClr = riskPct < 30 ? '#4ADE80' : riskPct < 60 ? '#FB923C' : '#F87171'
  const riskLabel = riskPct < 30 ? 'Low' : riskPct < 60 ? 'Moderate' : 'High'
  const displayMetrics = METRICS.map((m, i) => ({ ...m, val: metricVals[i] ?? 60 }))

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.content}>
      <Sans bold style={[s.date, { color: c.txt3 }]}>{dateStr.toUpperCase()}</Sans>
      <Serif style={[s.greeting, { color: c.txt }]}>
        {greeting()}{'\n'}<Text style={{ color: c.pri }}>how are you feeling?</Text>
      </Serif>

      {stage === 'S2' && (
        <View style={s.crisis}>
          <Text style={{ fontSize: 20 }}>🆘</Text>
          <View style={{ flex: 1 }}>
            <Sans bold style={{ color: '#F87171', fontSize: 13 }}>Crisis Detected — Helpline Available</Sans>
            <Sans style={{ color: c.txt2, fontSize: 12 }}>iCall: 9152987821 · Vandrevala: 1860-2662-345</Sans>
          </View>
        </View>
      )}

      {/* Stage card */}
      <View style={[s.stageCard, { backgroundColor: `${stageInfo.clr}12`, borderColor: `${stageInfo.clr}30` }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.stageLabel, { color: stageInfo.clr }]}>{stage} · {stageInfo.label.toUpperCase()}</Text>
          <Serif style={{ fontSize: 21, color: c.txt }}>{stageInfo.msg}</Serif>
        </View>
        <View style={[s.stageIcon, { backgroundColor: `${stageInfo.clr}20`, borderColor: stageInfo.clr }]}>
          <Text style={{ fontSize: 22 }}>{stageInfo.icon}</Text>
        </View>
      </View>

      {/* Metric cards */}
      <View style={s.metricRow}>
        {displayMetrics.map(m => (
          <ArxCard key={m.label} style={s.metricCard}>
            <SectionLabel style={{ textAlign: 'center', marginBottom: 7 }}>{m.label}</SectionLabel>
            <Text style={[s.metricVal, { color: m.clr }]}>{m.val}</Text>
            <ArxProg pct={m.val} color={m.clr} style={{ marginTop: 8 }} />
          </ArxCard>
        ))}
      </View>

      {/* Risk + status row */}
      <View style={s.riskRow}>
        <ArxCard style={s.riskCard}>
          <SectionLabel style={{ fontSize: 9, marginBottom: 8, textAlign: 'center' }}>Risk Rate</SectionLabel>
          <Svg width={60} height={60} viewBox="0 0 60 60">
            <Circle cx={30} cy={30} r={RING_R} fill="none" stroke={c.acc} strokeWidth={6} />
            <Circle
              cx={30} cy={30} r={RING_R} fill="none" stroke={riskClr} strokeWidth={6}
              strokeDasharray={`${(riskPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeLinecap="round" rotation={-90} origin="30, 30"
            />
          </Svg>
          <Text style={[s.riskVal, { color: riskClr }]}>{riskPct}</Text>
          <Sans bold style={{ color: riskClr, fontSize: 10 }}>{riskLabel}</Sans>
        </ArxCard>

        <ArxCard style={{ flex: 1, marginBottom: 0 }}>
          <SectionLabel style={{ marginBottom: 10 }}>Today's Status</SectionLabel>
          <Sans style={{ color: c.txt2, fontSize: 13, lineHeight: 21, marginBottom: 12 }}>
            {completedToday
              ? "You've completed today's check-in. Insights are being updated."
              : "Complete today's check-in to update your patterns and insights."}
          </Sans>
          <ArxTag color={c.pri}>{completedToday ? '✓ Checked in' : '📋 Check-in due'}</ArxTag>
        </ArxCard>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => router.push(completedToday ? '/(patient)/journal' : '/(patient)/checkin')}
        style={[s.cta, { backgroundColor: `${c.pri}12`, borderColor: `${c.pri}22` }]}
      >
        <View style={[s.ctaIcon, { backgroundColor: `${c.pri}20` }]}>
          <Text style={{ fontSize: 18 }}>{completedToday ? '✍️' : '📋'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Sans bold style={{ color: c.txt, fontSize: 14, marginBottom: 2 }}>
            {completedToday ? 'Journal' : 'Daily Check-in'}
          </Sans>
          <Sans style={{ color: c.txt3, fontSize: 13 }}>
            {completedToday ? "You haven't journaled today — 3-min check-in?" : 'Answer a short questionnaire about your week.'}
          </Sans>
        </View>
        <Text style={{ color: c.pri, fontSize: 18 }}>→</Text>
      </TouchableOpacity>

      {/* Recent sessions */}
      {history.length > 0 && (
        <View>
          <SectionLabel style={{ marginBottom: 12 }}>Recent Sessions</SectionLabel>
          <View style={{ gap: 8 }}>
            {history.slice(0, 5).map(sess => {
              const busy = editBusy === sess.session_id
              const confirming = confirmDelete === sess.session_id
              const dateLabel = new Date(sess.completed_at ?? sess.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const isDone = sess.status === 'done'
              const statusClr = isDone ? '#4ADE80' : sess.status === 'abstained' ? '#F87171' : '#FB923C'

              return (
                <View key={sess.session_id} style={[s.sessionRow, { backgroundColor: c.surf, borderColor: c.bdr }]}>
                  <View style={s.sessionLeft}>
                    <Sans style={{ color: c.txt2, fontSize: 13 }}>{dateLabel}</Sans>
                    <ArxTag color={statusClr}>{isDone ? 'Scored' : sess.status === 'abstained' ? 'Skipped' : 'In progress'}</ArxTag>
                  </View>
                  {!confirming ? (
                    <View style={s.rowBtns}>
                      <RowBtn label={busy ? '…' : 'Edit'} color={c.pri} disabled={busy} onPress={() => handleEdit(sess.session_id)} />
                      <RowBtn label="Delete" color="#F87171" disabled={busy} onPress={() => setConfirmDelete(sess.session_id)} />
                    </View>
                  ) : (
                    <View style={s.rowBtns}>
                      <Sans style={{ fontSize: 12, color: c.txt3 }}>Delete?</Sans>
                      <RowBtn label="Yes" color="#F87171" onPress={() => handleDelete(sess.session_id)} />
                      <RowBtn label="No" color={c.txt3} onPress={() => setConfirmDelete(null)} />
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

function RowBtn({ label, color, disabled, onPress }: { label: string; color: string; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[s.rowBtn, disabled && { opacity: 0.4 }]}>
      <Text style={{ color, fontSize: 12, fontFamily: FONT_SANS_BOLD }}>{label}</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
  date: { fontSize: 12, letterSpacing: 0.9, marginBottom: 4 },
  greeting: { fontSize: 30, lineHeight: 36, marginBottom: 22 },
  crisis: {
    backgroundColor: 'rgba(248,113,113,.1)', borderWidth: 1, borderColor: 'rgba(248,113,113,.3)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  stageCard: {
    borderWidth: 1, borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  stageLabel: { fontSize: 11, fontFamily: FONT_SANS_BOLD, letterSpacing: 0.9, marginBottom: 5 },
  stageIcon: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, marginBottom: 0 },
  metricVal: { fontFamily: FONT_SERIF_BOLD, fontSize: 30, lineHeight: 32, textAlign: 'center' },
  riskRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  riskCard: { width: 100, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  riskVal: { fontFamily: FONT_SERIF_BOLD, fontSize: 20, marginTop: 4 },
  cta: {
    borderWidth: 1, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22,
  },
  ctaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionRow: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  rowBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
})
