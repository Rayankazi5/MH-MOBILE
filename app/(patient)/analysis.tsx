import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Polygon, Polyline, Stop, Text as SvgText } from 'react-native-svg'
import { api, type HistoryScore } from '@/services/api'
import { useShell } from '@/contexts/ShellContext'
import { ArxCard, ArxInput, ArxProg, GradientButton, Sans, SectionLabel, Serif } from '@/components/patient/Arx'

const KEYWORDS = [
  { key: 'sleep',   label: 'Sleep',   icon: '🌙' },
  { key: 'mood',    label: 'Mood',    icon: '🌤️' },
  { key: 'anxiety', label: 'Anxiety', icon: '💭' },
  { key: 'energy',  label: 'Energy',  icon: '⚡' },
  { key: 'social',  label: 'Social',  icon: '🤝' },
  { key: 'overall', label: 'Overall', icon: '🗓️' },
]

const DOMAIN_LABELS: Record<string, string> = {
  cognitive_fatigue: 'Cognitive Fatigue',
  social_withdrawal: 'Social Withdrawal',
  anxiety: 'Anxiety',
  mood_stability: 'Mood Stability',
  sleep_quality: 'Sleep Quality',
}

type ChatEntry = { label: string; response: string }

const W = 310

export default function PatientAnalysis() {
  const { c } = useShell()

  const [scores, setScores] = useState<HistoryScore[]>([])
  const [moodPoints, setMoodPoints] = useState<number[]>([])
  const [verdictOk, setVerdictOk] = useState(true)
  const [xaiOpen, setXaiOpen] = useState(false)

  const [explored, setExplored] = useState<Set<string>>(new Set())
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [ventText, setVentText] = useState('')
  const [ventLoading, setVentLoading] = useState(false)
  const [error, setError] = useState('')

  useFocusEffect(useCallback(() => {
    api.patient.history().then(data => {
      setScores(data)
      const mood = data.filter(d => d.domain === 'mood_stability').slice(-7).map(d => Math.round((1 - d.score) * 100))
      if (mood.length > 0) setMoodPoints(mood)
      const recent = data.slice(-5)
      if (recent.length) {
        const avg = recent.reduce((s, r) => s + r.score, 0) / recent.length
        setVerdictOk(avg < 0.4)
      }
    }).catch(() => {})
  }, []))

  const handleKeyword = async (key: string, label: string) => {
    if (loading || explored.has(key)) return
    setLoading(true)
    setError('')
    try {
      const { response } = await api.patient.insight({ keyword: key })
      setChat(prev => [...prev, { label, response }])
      setExplored(prev => new Set([...prev, key]))
    } catch {
      setError('Could not load insight. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const handleVent = async () => {
    if (!ventText.trim() || ventLoading) return
    setVentLoading(true)
    setError('')
    try {
      const { response } = await api.patient.insight({ free_text: ventText.trim() })
      setChat(prev => [...prev, { label: 'Your thoughts', response }])
      setVentText('')
    } catch {
      setError('Could not process your message.')
    } finally {
      setVentLoading(false)
    }
  }

  // Chart geometry (mirrors the web SVG exactly)
  const chartData = moodPoints.length >= 2 ? moodPoints : [55, 60, 48, 72, 68, 75, 72]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, chartData.length)
  const hi = Math.max(...chartData), lo = Math.min(...chartData)
  const ny = (v: number) => 90 - ((v - lo) / (hi - lo + 1)) * 76
  const nx = (i: number) => (i / Math.max(chartData.length - 1, 1)) * (W - 40) + 20
  const pts = chartData.map((v, i) => `${nx(i)},${ny(v)}`).join(' ')
  const areaPts = `20,95 ${pts} ${nx(chartData.length - 1)},95`

  const domainMap: Record<string, number> = {}
  const domainCounts: Record<string, number> = {}
  for (const sc of scores) {
    domainMap[sc.domain] = (domainMap[sc.domain] ?? 0) + sc.score
    domainCounts[sc.domain] = (domainCounts[sc.domain] ?? 0) + 1
  }
  const DOMAIN_CLR: Record<string, string> = {
    cognitive_fatigue: c.pri, social_withdrawal: '#60A5FA', anxiety: '#FB923C', mood_stability: '#4ADE80', sleep_quality: '#F87171',
  }
  const domainAvg = Object.entries(domainMap).map(([d, total]) => ({
    label: DOMAIN_LABELS[d] ?? d,
    pct: Math.round((total / (domainCounts[d] ?? 1)) * 100),
    clr: DOMAIN_CLR[d] ?? c.pri,
  })).sort((a, b) => b.pct - a.pct)

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Serif style={{ fontSize: 28, color: c.txt, marginBottom: 4 }}>AI Analysis</Serif>
      <Sans style={{ color: c.txt3, fontSize: 13, marginBottom: 18 }}>Your behavioural data at a glance</Sans>

      {/* Mood chart */}
      <ArxCard>
        <SectionLabel style={{ marginBottom: 12 }}>Mood Trend</SectionLabel>
        <Svg width="100%" height={110} viewBox="0 0 310 105">
          <Defs>
            <SvgGradient id="arxGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.pri} stopOpacity={0.3} />
              <Stop offset="1" stopColor={c.pri} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          {[25, 50, 75].map(y => (
            <Line key={y} x1={10} y1={105 - y} x2={300} y2={105 - y} stroke={c.bdr} strokeWidth={1} />
          ))}
          <Polygon points={areaPts} fill="url(#arxGrad)" />
          <Polyline points={pts} fill="none" stroke={c.pri} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {chartData.map((v, i) => (
            <Circle key={i} cx={nx(i)} cy={ny(v)} r={4} fill={c.pri} stroke={c.surf} strokeWidth={2} />
          ))}
          {days.map((d, i) => (
            <SvgText key={d} x={nx(i)} y={104} textAnchor="middle" fontSize={9} fill={c.txt3}>{d}</SvgText>
          ))}
        </Svg>
      </ArxCard>

      {/* Verdict */}
      <View style={[s.verdict, verdictOk ? s.verdictOk : s.verdictWarn]}>
        <View style={[s.verdictIcon, { backgroundColor: verdictOk ? 'rgba(74,222,128,.15)' : 'rgba(251,146,60,.15)' }]}>
          <Text style={{ fontSize: 20 }}>{verdictOk ? '✅' : '📊'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Sans bold style={{ color: verdictOk ? '#4ADE80' : '#FB923C', fontSize: 14, marginBottom: 2 }}>
            {verdictOk ? 'Patterns Stable' : 'Patterns Need Attention'}
          </Sans>
          <Sans style={{ color: c.txt2, fontSize: 13 }}>
            {verdictOk
              ? 'Your behavioural signals are within a healthy range. Keep it up.'
              : 'Some domains show elevated concern. Check insights below for details.'}
          </Sans>
        </View>
      </View>

      {/* XAI breakdown */}
      {domainAvg.length > 0 && (
        <ArxCard style={{ padding: 0, overflow: 'hidden' }}>
          <TouchableOpacity onPress={() => setXaiOpen(v => !v)} style={s.xaiToggle}>
            <Sans bold style={{ color: c.txt, fontSize: 14 }}>🔍 Domain breakdown (XAI)</Sans>
            <Text style={{ color: c.pri, transform: [{ rotate: xaiOpen ? '180deg' : '0deg' }] }}>▾</Text>
          </TouchableOpacity>
          {xaiOpen && (
            <View style={[s.xaiBody, { borderTopColor: c.bdr }]}>
              <Sans style={{ color: c.txt3, fontSize: 12, marginBottom: 14 }}>
                Average concern score per domain (0 = low concern, 100 = high concern):
              </Sans>
              {domainAvg.map(({ label, pct, clr }) => (
                <View key={label} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Sans style={{ color: c.txt2, fontSize: 12 }}>{label}</Sans>
                    <Sans bold style={{ color: clr, fontSize: 12 }}>{pct}</Sans>
                  </View>
                  <ArxProg pct={pct} color={clr} />
                </View>
              ))}
            </View>
          )}
        </ArxCard>
      )}

      {/* Keyword chips */}
      <SectionLabel style={{ marginBottom: 12 }}>Explore Insights</SectionLabel>
      <View style={s.chipGrid}>
        {KEYWORDS.map(k => {
          const done = explored.has(k.key)
          return (
            <TouchableOpacity
              key={k.key} disabled={loading || done} onPress={() => handleKeyword(k.key, k.label)}
              style={[s.chip, { backgroundColor: done ? `${c.pri}15` : c.surf, borderColor: done ? `${c.pri}50` : c.bdr }]}
            >
              <Text style={{ fontSize: 18 }}>{k.icon}</Text>
              <Sans bold style={{ fontSize: 11, color: done ? c.pri : c.txt3 }}>{k.label}{done ? ' ✓' : ''}</Sans>
            </TouchableOpacity>
          )
        })}
      </View>

      {loading && <Sans style={{ textAlign: 'center', paddingVertical: 16, color: c.txt3, fontSize: 14 }}>Generating insight…</Sans>}

      {chat.map((entry, i) => (
        <ArxCard key={i} style={{ marginBottom: 12 }}>
          <SectionLabel style={{ marginBottom: 8 }}>{entry.label}</SectionLabel>
          <Sans style={{ color: c.txt2, fontSize: 13, lineHeight: 22 }}>{entry.response}</Sans>
        </ArxCard>
      ))}

      {error ? <Sans style={{ color: '#F87171', fontSize: 13, marginBottom: 10 }}>{error}</Sans> : null}

      {explored.size >= 1 && (
        <View style={[s.vent, { backgroundColor: `${c.pri}08`, borderColor: `${c.pri}22` }]}>
          <Sans bold style={{ color: c.txt, fontSize: 14, marginBottom: 4 }}>Anything on your mind?</Sans>
          <Sans style={{ color: c.txt3, fontSize: 13, lineHeight: 21, marginBottom: 12 }}>
            Share freely — you'll get a gentle, data-grounded reflection back.
          </Sans>
          <ArxInput
            value={ventText} onChangeText={setVentText} multiline placeholder="Write freely…"
            style={{ minHeight: 90, textAlignVertical: 'top', marginBottom: 10 }}
          />
          <GradientButton label={ventLoading ? 'Reflecting…' : 'Share thoughts'} disabled={!ventText.trim() || ventLoading} onPress={handleVent} />
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
  verdict: { borderWidth: 1, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 14, flexDirection: 'row', gap: 14, alignItems: 'center' },
  verdictOk: { backgroundColor: 'rgba(74,222,128,.08)', borderColor: 'rgba(74,222,128,.2)' },
  verdictWarn: { backgroundColor: 'rgba(251,146,60,.08)', borderColor: 'rgba(251,146,60,.22)' },
  verdictIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  xaiToggle: { paddingVertical: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xaiBody: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1 },
  vent: { marginTop: 8, borderWidth: 1, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 16 },
})
