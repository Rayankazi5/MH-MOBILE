import { StyleSheet, Text, View } from 'react-native'
import type { Narrative } from '@/services/api'

interface Props {
  narrative: Narrative | null
  loading: boolean
}

export function NarrativePanel({ narrative, loading }: Props) {
  if (loading) {
    return (
      <View style={s.card}>
        <Text style={s.heading}>Weekly Narrative</Text>
        <Text style={s.muted}>Loading…</Text>
      </View>
    )
  }

  if (!narrative) {
    return (
      <View style={s.card}>
        <Text style={s.heading}>Weekly Narrative</Text>
        <Text style={s.muted}>
          No narrative available yet. Generated every Monday after the patient's weekly check-ins.
        </Text>
      </View>
    )
  }

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={[s.heading, { marginBottom: 0 }]}>Weekly Narrative</Text>
        <Text style={s.weekLabel}>Week of {narrative.week_start}</Text>
      </View>
      <View style={s.bullets}>
        {narrative.bullets.map((bullet, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>
      <Text style={s.disclaimer}>
        AI-generated from anonymised keyword patterns. Not a diagnosis.
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  heading: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 14 },
  weekLabel: { fontSize: 12, color: '#9ca3af' },
  muted: { color: '#9ca3af', fontSize: 14 },
  bullets: { gap: 8 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { color: '#374151', fontSize: 15 },
  bulletText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 21 },
  disclaimer: { fontSize: 11, color: '#d1d5db', marginTop: 14 },
})
