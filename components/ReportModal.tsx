import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ClinicalReport } from '@/services/api'

const DOMAIN_LABELS: Record<string, string> = {
  cognitive_fatigue: 'Cognitive Fatigue / Energy',
  social_withdrawal: 'Social Withdrawal',
  anxiety: 'Anxiety',
  mood_stability: 'Mood Stability',
  sleep_quality: 'Sleep Quality',
}

const DOMAIN_ORDER = ['sleep_quality', 'mood_stability', 'anxiety', 'cognitive_fatigue', 'social_withdrawal']

function trendColor(trend: string) {
  return trend === 'worsening' ? '#dc2626'
    : trend === 'improving' ? '#16a34a'
    : trend === 'stable' ? '#2563eb'
    : '#9ca3af'
}

function trendArrow(trend: string) {
  return trend === 'worsening' ? '↑' : trend === 'improving' ? '↓' : trend === 'stable' ? '→' : '—'
}

function TrendBadge({ trend }: { trend: string }) {
  const color = trendColor(trend)
  return (
    <View style={[s.trendBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <Text style={[s.trendBadgeText, { color }]}>{trendArrow(trend)} {trend}</Text>
    </View>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score < 0.35 ? '#16a34a' : score < 0.6 ? '#d97706' : '#dc2626'
  return (
    <View style={s.scoreBarRow}>
      <View style={s.scoreBarTrack}>
        <View style={[s.scoreBarFill, { width: `${score * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.scoreBarLabel, { color }]}>{(score * 100).toFixed(0)}%</Text>
    </View>
  )
}

function buildShareText(report: ClinicalReport): string {
  const lines = [
    `Clinical Progress Report — ${report.patient_name}`,
    `Period: ${report.period_start} → ${report.period_end}`,
    '',
    'Executive Summary',
    report.executive_summary,
    '',
    'Recommended Session Focus',
    ...report.session_focus_recommendations.map((r, i) => `${i + 1}. ${r}`),
  ]
  return lines.join('\n')
}

export function ReportModal({ report, onClose }: { report: ClinicalReport; onClose: () => void }) {
  const generated = new Date(report.generated_at).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.controls}>
          <TouchableOpacity style={s.btnSecondary} onPress={() => Share.share({ message: buildShareText(report) })}>
            <Text style={s.btnSecondaryText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnClose} onPress={onClose}>
            <Text style={s.btnCloseText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <View style={s.header}>
          <Text style={s.eyebrow}>Clinical Progress Report</Text>
          <Text style={s.patientName}>{report.patient_name}</Text>
          <Text style={s.headerMeta}>
            Period: {report.period_start} → {report.period_end}{'\n'}
            Generated: {generated}{'\n'}
            Sessions: {report.adherence.completed} completed
            {report.adherence.abstained > 0 ? `, ${report.adherence.abstained} abstained` : ''}
          </Text>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionHeading}>Executive Summary</Text>
          <Text style={s.paragraph}>{report.executive_summary}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionHeading}>Domain Analysis</Text>
          <View style={s.domainGrid}>
            {DOMAIN_ORDER.map(d => {
              const info = report.domain_scores[d]
              const note = report.domain_notes?.[d]
              if (!info && !note) return null
              return (
                <View key={d} style={s.domainCard}>
                  <View style={s.domainCardHeader}>
                    <Text style={s.domainCardLabel}>{DOMAIN_LABELS[d] ?? d}</Text>
                    {info && <TrendBadge trend={info.trend} />}
                  </View>
                  {info && <ScoreBar score={info.mean} />}
                  {note && <Text style={s.domainNote}>{note}</Text>}
                </View>
              )
            })}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionHeading}>Behavioral Indicators</Text>
          {report.behavioral_highlights.map((h, i) => (
            <Text key={i} style={s.listItem}>• {h}</Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionHeading}>Journal Themes</Text>
          <Text style={s.paragraph}>{report.journal_summary}</Text>
          <Text style={[s.sectionHeading, { marginTop: 16 }]}>Dissonance Flags</Text>
          <Text style={s.paragraph}>{report.flags_summary}</Text>
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionHeading}>Recommended Session Focus</Text>
          {report.session_focus_recommendations.map((r, i) => (
            <Text key={i} style={s.listItem}>{i + 1}. {r}</Text>
          ))}
        </View>

        <View style={[s.divider, { marginTop: 24 }]} />
        <Text style={s.disclaimer}>
          This report is generated automatically from patient self-report data and behavioral signals.
          It is not a clinical diagnosis and should be interpreted by a licensed clinician.
        </Text>
      </ScrollView>
    </Modal>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  controls: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 20 },
  btnSecondary: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  btnClose: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  btnCloseText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  header: { marginBottom: 8 },
  eyebrow: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  patientName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  headerMeta: { fontSize: 13, color: '#6b7280', lineHeight: 19 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 20 },
  section: { marginBottom: 4 },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  paragraph: { fontSize: 15, color: '#374151', lineHeight: 24 },
  domainGrid: { gap: 12 },
  domainCard: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14 },
  domainCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  domainCardLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  trendBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  trendBadgeText: { fontSize: 11, fontWeight: '700' },
  scoreBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  scoreBarTrack: { flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 999, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 999 },
  scoreBarLabel: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  domainNote: { marginTop: 8, fontSize: 13, color: '#6b7280', lineHeight: 19 },
  listItem: { fontSize: 15, color: '#374151', lineHeight: 23, marginBottom: 4 },
  disclaimer: { fontSize: 11, color: '#9ca3af', marginTop: 12, textAlign: 'center', lineHeight: 16 },
})
