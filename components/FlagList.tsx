import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { api, type DissonanceFlag } from '@/services/api'

interface Props {
  flags: DissonanceFlag[]
  onResolved: (id: string) => void
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#2563eb',
}

const FLAG_LABELS: Record<string, string> = {
  sleep_late_activity: 'Sleep vs. Late Activity',
  mood_movement: 'Mood vs. Movement',
  social_report_vs_withdrawal: 'Social Report vs. Isolation',
}

export function FlagList({ flags, onResolved }: Props) {
  const [resolving, setResolving] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)

  const openFlags = flags.filter(f => !f.resolved)
  const resolvedFlags = flags.filter(f => f.resolved)

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await api.clinician.resolveFlag(id)
      onResolved(id)
    } finally {
      setResolving(null)
    }
  }

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.heading}>Dissonance Flags</Text>
        {openFlags.length > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{openFlags.length} open</Text>
          </View>
        )}
      </View>

      {flags.length === 0 && <Text style={s.muted}>No flags detected yet.</Text>}

      <View style={s.list}>
        {openFlags.map(flag => {
          const color = SEVERITY_COLOR[flag.severity] ?? '#2563eb'
          return (
            <View key={flag.id} style={[s.flagRow, { borderLeftColor: color }]}>
              <View style={s.flagBody}>
                <View style={s.flagTitleRow}>
                  <Text style={s.flagTitle}>{FLAG_LABELS[flag.flag_type] ?? flag.flag_type}</Text>
                  <View style={[s.severityBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                    <Text style={[s.severityText, { color }]}>{flag.severity}</Text>
                  </View>
                </View>
                <Text style={s.flagDetail}><Text style={s.flagDetailLabel}>Self-report: </Text>{flag.self_report_val}</Text>
                <Text style={s.flagDetail}><Text style={s.flagDetailLabel}>Signal: </Text>{flag.signal_val}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleResolve(flag.id)}
                disabled={resolving === flag.id}
                style={[s.resolveBtn, resolving === flag.id && s.resolveBtnDisabled]}
              >
                <Text style={s.resolveBtnText}>
                  {resolving === flag.id ? 'Resolving…' : 'Mark resolved'}
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}

        {resolvedFlags.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity onPress={() => setShowResolved(v => !v)}>
              <Text style={s.resolvedToggle}>
                {resolvedFlags.length} resolved flag{resolvedFlags.length > 1 ? 's' : ''} {showResolved ? '▾' : '▸'}
              </Text>
            </TouchableOpacity>
            {showResolved && (
              <View style={s.resolvedList}>
                {resolvedFlags.map(flag => (
                  <View key={flag.id} style={s.resolvedRow}>
                    <Text style={s.resolvedText}>
                      {FLAG_LABELS[flag.flag_type] ?? flag.flag_type} — resolved {flag.resolved?.slice(0, 10)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 15, fontWeight: '600', color: '#111827' },
  badge: { marginLeft: 8, backgroundColor: '#fef2f2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  muted: { color: '#9ca3af', fontSize: 14 },
  list: { gap: 12 },
  flagRow: { borderLeftWidth: 3, paddingLeft: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  flagBody: { flex: 1 },
  flagTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  flagTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  severityBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  severityText: { fontSize: 11, fontWeight: '600' },
  flagDetail: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  flagDetailLabel: { fontWeight: '600' },
  resolveBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  resolveBtnDisabled: { opacity: 0.5 },
  resolveBtnText: { fontSize: 13, fontWeight: '500', color: '#111827' },
  resolvedToggle: { fontSize: 13, color: '#9ca3af' },
  resolvedList: { marginTop: 10, gap: 8, opacity: 0.6 },
  resolvedRow: { borderLeftWidth: 3, borderLeftColor: '#e5e7eb', paddingLeft: 12 },
  resolvedText: { fontSize: 13, color: '#9ca3af' },
})
