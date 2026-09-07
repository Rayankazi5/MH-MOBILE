import { useEffect, useState } from 'react'
import { Stack, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  api,
  type ClinicalReport,
  type DomainScore,
  type Narrative,
  type DissonanceFlag,
  type PatientSummary,
  type PatientSession,
  type ProtectiveFactors,
} from '@/services/api'
import { DomainCard } from '@/components/DomainCard'
import { NarrativePanel } from '@/components/NarrativePanel'
import { FlagList } from '@/components/FlagList'
import { ReportModal } from '@/components/ReportModal'

const DOMAINS = ['cognitive_fatigue', 'social_withdrawal', 'anxiety', 'mood_stability', 'sleep_quality']

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const [patient, setPatient] = useState<PatientSummary | null>(null)
  const [scores, setScores] = useState<DomainScore[]>([])
  const [narrative, setNarrative] = useState<Narrative | null>(null)
  const [flags, setFlags] = useState<DissonanceFlag[]>([])
  const [sessions, setSessions] = useState<PatientSession[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [protective, setProtective] = useState<ProtectiveFactors | null>(null)
  const [report, setReport] = useState<ClinicalReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [narrativeLoading, setNarrativeLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.clinician.summary(id).then(setPatient),
      api.clinician.scores(id, 8).then(setScores),
      api.clinician.narrative(id).then(n => { setNarrative(n); setNarrativeLoading(false) }),
      api.clinician.flags(id).then(setFlags),
      api.clinician.patientSessions(id).then(setSessions),
      api.clinician.protectiveFactors(id).then(setProtective),
    ]).catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to load patient data')
      setNarrativeLoading(false)
    })
  }, [id])

  const handleGenerateReport = () => {
    if (!id || reportLoading) return
    setReportLoading(true)
    api.clinician.generateReport(id, 4)
      .then(setReport)
      .catch(() => {})
      .finally(() => setReportLoading(false))
  }

  const handleFlagResolved = (resolvedId: string) => {
    setFlags(prev =>
      prev.map(f => f.id === resolvedId ? { ...f, resolved: new Date().toISOString() } : f),
    )
  }

  if (error) {
    return (
      <View style={s.page}>
        <Stack.Screen options={{ title: 'Patient' }} />
        <Text style={s.errorText}>{error}</Text>
      </View>
    )
  }

  const scoresByDomain: Record<string, DomainScore[]> = {}
  for (const d of DOMAINS) scoresByDomain[d] = []
  for (const sc of scores) {
    if (scoresByDomain[sc.domain]) scoresByDomain[sc.domain].push(sc)
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.page}>
      <Stack.Screen options={{ title: patient?.full_name ?? 'Patient' }} />

      {report && <ReportModal report={report} onClose={() => setReport(null)} />}

      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.patientName}>{patient?.full_name ?? '…'}</Text>
          <Text style={s.patientMeta}>
            {patient?.email}
            {patient?.timezone ? ` · ${patient.timezone}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.reportBtn, reportLoading && s.reportBtnDisabled]}
          onPress={handleGenerateReport}
          disabled={reportLoading}
        >
          <Text style={[s.reportBtnText, reportLoading && s.reportBtnTextDisabled]}>
            {reportLoading ? 'Generating…' : 'Generate Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <Section title="Score trends (last 8 weeks)">
        <View style={s.domainGrid}>
          {DOMAINS.map(d => (
            <DomainCard key={d} domain={d} scores={scoresByDomain[d]} />
          ))}
        </View>
      </Section>

      <Section title="Latest weekly report">
        <NarrativePanel narrative={narrative} loading={narrativeLoading} />
      </Section>

      {protective?.available && protective.factors.length > 0 && (
        <Section title="Protective factors">
          <View style={s.protectiveGrid}>
            {protective.factors.map(f => {
              const color = f.strength === 'strong' ? '#34d399' : f.strength === 'moderate' ? '#fbbf24' : '#f87171'
              return (
                <View key={f.label} style={[s.protectiveCard, { borderColor: `${color}33` }]}>
                  <Text style={s.protectiveIcon}>{f.icon}</Text>
                  <Text style={s.protectiveLabel}>{f.label}</Text>
                  <Text style={[s.protectiveValue, { color }]}>{f.value}</Text>
                </View>
              )
            })}
          </View>
          {protective.session_date && (
            <Text style={s.protectiveDate}>
              From session on {new Date(protective.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          )}
        </Section>
      )}

      <Section title="Dissonance flags">
        <FlagList flags={flags} onResolved={handleFlagResolved} />
      </Section>

      <Section title="Check-in responses">
        {sessions.length === 0 ? (
          <Text style={s.mutedText}>No check-ins recorded yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {sessions.map(sess => (
              <SessionResponseRow
                key={sess.session_id}
                session={sess}
                expanded={expandedSession === sess.session_id}
                onToggle={() => setExpandedSession(prev => prev === sess.session_id ? null : sess.session_id)}
              />
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionHeading}>{title}</Text>
      {children}
    </View>
  )
}

function SessionResponseRow({ session, expanded, onToggle }: {
  session: PatientSession
  expanded: boolean
  onToggle: () => void
}) {
  const dateLabel = new Date(session.completed_at ?? session.started_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  const statusColor = session.status === 'done' ? '#34d399' : session.status === 'abstained' ? '#f87171' : '#fbbf24'
  const statusLabel = session.status === 'done' ? 'Scored' : session.status === 'abstained' ? 'Abstained' : 'In progress'

  return (
    <View style={s.sessionRow}>
      <TouchableOpacity style={s.sessionHeader} onPress={onToggle}>
        <View style={s.sessionHeaderLeft}>
          <Text style={s.sessionDate}>{dateLabel}</Text>
          <View style={[s.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {session.responses.length > 0 && (
            <Text style={s.answerCount}>{session.responses.length} answers</Text>
          )}
        </View>
        <Text style={[s.chevron, expanded && s.chevronExpanded]}>▾</Text>
      </TouchableOpacity>

      {expanded && (
        session.responses.length > 0 ? (
          <View style={s.responseList}>
            {session.responses.map(r => (
              <View key={r.question_key} style={s.responseRow}>
                <Text style={s.responseQuestion}>{r.question_text}</Text>
                <Text style={s.responseAnswer}>{r.answer_label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.responseList}>
            <Text style={s.mutedText}>No responses recorded for this session.</Text>
          </View>
        )
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  page: { padding: 20, paddingBottom: 48 },
  errorText: { color: '#dc2626', marginTop: 32, fontSize: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  patientName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  patientMeta: { fontSize: 13, color: '#6b7280' },
  reportBtn: { backgroundColor: '#2563eb', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 10 },
  reportBtnDisabled: { backgroundColor: '#f3f4f6' },
  reportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  reportBtnTextDisabled: { color: '#9ca3af' },
  section: { marginBottom: 22 },
  sectionHeading: { fontSize: 13, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  domainGrid: { gap: 10 },
  protectiveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  protectiveCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff', borderWidth: 1, borderRadius: 10, padding: 14, gap: 4 },
  protectiveIcon: { fontSize: 20 },
  protectiveLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  protectiveValue: { fontSize: 15, fontWeight: '700' },
  protectiveDate: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  mutedText: { color: '#9ca3af', fontSize: 14 },
  sessionRow: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  sessionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  sessionDate: { fontSize: 14, color: '#374151', fontWeight: '500' },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },
  answerCount: { fontSize: 12, color: '#9ca3af' },
  chevron: { fontSize: 13, color: '#9ca3af' },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  responseList: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', padding: 12 },
  responseRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  responseQuestion: { flex: 1, fontSize: 13, color: '#4b5563', lineHeight: 18 },
  responseAnswer: { fontSize: 13, color: '#1d4ed8', fontWeight: '500' },
})
