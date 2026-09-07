import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { STAGES, useShell, type StageKey } from '@/contexts/ShellContext'
import { ArxCard, ArxTag, Sans, Serif } from '@/components/patient/Arx'

const POSTS = [
  { name: 'R.M.', time: '2h ago', text: 'Box breathing helped me through a tough morning. Sharing the technique if anyone wants it 💙', tags: ['S4'], likes: 14 },
  { name: 'A.K.', time: '5h ago', text: "Week 3 of consistent journaling — I'm noticing patterns I never caught before. Highly recommend the interactive mode.", tags: ['S1'], likes: 28 },
  { name: 'P.S.', time: '1d ago', text: 'First full week in S1. Small wins accumulate. Keep going.', tags: ['S1'], likes: 42 },
]

export default function PatientCommunity() {
  const { c, stage } = useShell()
  const [liked, setLiked] = useState<Set<number>>(new Set())

  const allowed = stage === 'S1' || stage === 'S4'

  if (!allowed) {
    const stageInfo = STAGES[stage]
    return (
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.content}>
        <Serif style={{ fontSize: 28, color: c.txt, marginBottom: 18 }}>Community</Serif>
        <ArxCard style={{ paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 44, marginBottom: 18 }}>🤝</Text>
          <Serif style={{ fontSize: 24, color: c.txt, marginBottom: 10 }}>Community Paused</Serif>
          <Sans style={{ color: c.txt2, fontSize: 14, lineHeight: 24, textAlign: 'center', marginBottom: 18 }}>
            Community is available in stable or recovery phases (S1 / S4). This protects everyone — including you — during more vulnerable periods.
          </Sans>
          <Sans style={{ color: c.txt3, fontSize: 13, marginBottom: 20 }}>
            Current stage: <Sans bold style={{ color: stageInfo.clr }}>{stage} · {stageInfo.label}</Sans>
          </Sans>
          <View style={[s.suggest, { backgroundColor: `${c.pri}10`, borderColor: `${c.pri}22` }]}>
            <Sans style={{ color: c.txt2, fontSize: 13, textAlign: 'center' }}>
              Consider using the <Sans bold style={{ color: c.pri }}>e-Journal</Sans> or speaking with your clinician.
            </Sans>
          </View>
        </ArxCard>
      </ScrollView>
    )
  }

  const toggleLike = (i: number) => setLiked(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={s.content}>
      <Serif style={{ fontSize: 28, color: c.txt, marginBottom: 4 }}>Community</Serif>
      <Sans style={{ color: c.txt3, fontSize: 13, marginBottom: 6 }}>Moderated · S1 & S4 members only</Sans>

      <View style={s.memberBadge}>
        <Sans bold style={{ fontSize: 12, color: '#4ADE80' }}>● You are in {stage} · {STAGES[stage].label}</Sans>
      </View>

      {POSTS.map((p, i) => (
        <ArxCard key={i}>
          <View style={s.postHeader}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <LinearGradient colors={[`${c.pri}55`, `${c.priDim}35`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                <Sans bold style={{ fontSize: 12, color: c.pri }}>{p.name[0]}</Sans>
              </LinearGradient>
              <View>
                <Sans bold style={{ color: c.txt, fontSize: 14 }}>{p.name}</Sans>
                <Sans style={{ color: c.txt3, fontSize: 11 }}>{p.time}</Sans>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {p.tags.map(t => {
                const st = STAGES[t as StageKey]
                return <ArxTag key={t} color={st ? st.clr : c.txt3}>{t}</ArxTag>
              })}
            </View>
          </View>

          <Sans style={{ color: c.txt2, fontSize: 14, lineHeight: 23, marginBottom: 12 }}>{p.text}</Sans>

          <TouchableOpacity onPress={() => toggleLike(i)} style={{ alignSelf: 'flex-start' }}>
            <Sans bold style={{ color: liked.has(i) ? c.pri : c.txt3, fontSize: 13 }}>
              {liked.has(i) ? '♥' : '♡'} {p.likes + (liked.has(i) ? 1 : 0)}
            </Sans>
          </TouchableOpacity>
        </ArxCard>
      ))}

      <View style={[s.compose, { backgroundColor: `${c.pri}10`, borderColor: `${c.pri}20` }]}>
        <Sans style={{ color: c.txt3, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
          Community posts are coming soon. Journal entries can be shared with a single tap.
        </Sans>
        <ArxTag color={c.pri} style={{ alignSelf: 'center' }}>Coming soon</ArxTag>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },
  suggest: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignSelf: 'stretch' },
  memberBadge: {
    alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginBottom: 20,
    backgroundColor: 'rgba(74,222,128,.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,.25)',
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  compose: { borderWidth: 1, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center' },
})
