import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FONT_SANS_BOLD, FONT_SERIF_BOLD, STAGES, useShell } from '@/contexts/ShellContext'
import { useAuth } from '@/hooks/useAuth'
import { ArxTag } from './Arx'

const NAV = [
  { name: 'home',      icon: '⌂', label: 'Home' },
  { name: 'journal',   icon: '✍', label: 'Journal' },
  { name: 'analysis',  icon: '◉', label: 'Analysis' },
  { name: 'community', icon: '⊕', label: 'Community' },
]

export function ShellHeader() {
  const { c, dark, setDark, stage } = useShell()
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()
  const stageInfo = STAGES[stage]

  return (
    <LinearGradient colors={[c.bg, c.bg, 'transparent']} locations={[0, 0.65, 1]} style={{ paddingTop: insets.top }}>
      <View style={s.header}>
        <Text style={[s.brand, { color: c.txt }]}>
          Insight <Text style={{ color: c.pri }}>Navigator</Text>
        </Text>
        <View style={s.headerRight}>
          <ArxTag color={stageInfo.clr}>● {stage} {stageInfo.label}</ArxTag>
          <TouchableOpacity onPress={() => setDark(!dark)} style={[s.themeBtn, { backgroundColor: c.acc, borderColor: c.bdr }]}>
            <Text style={{ color: c.pri, fontSize: 16 }}>{dark ? '☀' : '◑'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={[s.exitBtn, { borderColor: c.bdr }]}>
            <Text style={[s.exitText, { color: c.txt3 }]}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}

interface TabBarProps {
  state: { index: number; routes: { name: string; key: string }[] }
  navigation: { navigate: (name: string) => void }
}

export function ShellTabBar({ state, navigation }: TabBarProps) {
  const { c } = useShell()
  const insets = useSafeAreaInsets()
  const activeName = state.routes[state.index]?.name

  return (
    <View style={[s.tabBar, { backgroundColor: c.glass, borderTopColor: c.bdr, paddingBottom: Math.max(insets.bottom, 22) }]}>
      {NAV.map(item => {
        const active = activeName === item.name
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            style={[s.tabItem, active && { backgroundColor: c.acc }]}
          >
            <Text style={[s.tabIcon, { color: active ? c.pri : c.txt3 }]}>{item.icon}</Text>
            <Text style={[s.tabLabel, { color: active ? c.pri : c.txt3 }]}>{item.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  brand: { fontFamily: FONT_SERIF_BOLD, fontSize: 26 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  themeBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  exitBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  exitText: { fontSize: 11, fontFamily: FONT_SANS_BOLD },
  tabBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 10, paddingHorizontal: 6, borderTopWidth: 1,
  },
  tabItem: { alignItems: 'center', gap: 4, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, minWidth: 58 },
  tabIcon: { fontSize: 19 },
  tabLabel: { fontSize: 10, fontFamily: FONT_SANS_BOLD },
})
