import { StyleSheet, Text, View } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'
import type { DomainScore } from '@/services/api'

interface Props {
  domain: string
  scores: DomainScore[]
}

const DOMAIN_LABELS: Record<string, string> = {
  cognitive_fatigue: 'Cognitive Fatigue',
  social_withdrawal: 'Social Withdrawal',
  anxiety: 'Anxiety',
  mood_stability: 'Mood Stability',
  sleep_quality: 'Sleep Quality',
}

function scoreColor(score: number): string {
  if (score >= 0.65) return '#dc2626'
  if (score >= 0.4) return '#d97706'
  return '#16a34a'
}

const CHART_W = 100
const CHART_H = 40

export function DomainCard({ domain, scores }: Props) {
  const latest = scores.length > 0 ? scores[scores.length - 1] : null
  const latestScore = latest?.score ?? null

  const points = scores.map((s, i) => {
    const x = scores.length > 1 ? (i / (scores.length - 1)) * CHART_W : CHART_W / 2
    const y = CHART_H - (Math.max(0, Math.min(1, s.score)) * CHART_H)
    return `${x},${y}`
  }).join(' ')

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.label}>{DOMAIN_LABELS[domain] ?? domain}</Text>
        {latestScore !== null && (
          <Text style={[s.scoreText, { color: scoreColor(latestScore) }]}>
            {Math.round(latestScore * 100)}
          </Text>
        )}
      </View>

      {scores.length >= 2 ? (
        <View style={s.chartWrap}>
          <Svg width="100%" height={48} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
            <Polyline
              points={points}
              fill="none"
              stroke={latestScore !== null ? scoreColor(latestScore) : '#2563eb'}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </Svg>
        </View>
      ) : (
        <View style={s.emptyChart}>
          <Text style={s.emptyChartText}>Not enough data for trend</Text>
        </View>
      )}

      {latest && (
        <Text style={s.meta}>
          Confidence {Math.round(latest.confidence * 100)}% · {latest.date.slice(0, 10)}
        </Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  scoreText: { fontSize: 20, fontWeight: '700' },
  chartWrap: { height: 48 },
  emptyChart: { height: 48, alignItems: 'center', justifyContent: 'center' },
  emptyChartText: { color: '#d1d5db', fontSize: 12 },
  meta: { fontSize: 11, color: '#9ca3af' },
})
