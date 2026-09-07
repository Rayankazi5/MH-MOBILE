import type { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FONT_SANS, FONT_SANS_BOLD, FONT_SERIF, useShell } from '@/contexts/ShellContext'

// Native equivalents of the `.arx-*` classes injected by the web Shell.

export function GradientButton({ label, disabled, onPress, small }: { label: string; disabled?: boolean; onPress: () => void; small?: boolean }) {
  const { c } = useShell()
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[s.gradBtnWrap, { shadowColor: c.pri }, disabled && { opacity: 0.6 }]}>
      <LinearGradient colors={[c.pri, c.priDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.gradBtn, small && { paddingVertical: 10, borderRadius: 12 }]}>
        <Sans bold style={{ color: '#fff', fontSize: small ? 13 : 15 }}>{label}</Sans>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export function ArxCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c, dark } = useShell()
  return (
    <View style={[
      s.card,
      { backgroundColor: c.surf, borderColor: c.bdr, shadowOpacity: dark ? 0.45 : 0.08, shadowColor: dark ? '#000' : c.pri },
      style,
    ]}>
      {children}
    </View>
  )
}

export function ArxTag({ children, color, style }: { children: ReactNode; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.tag, { backgroundColor: `${color}18`, borderColor: `${color}35` }, style]}>
      <Text style={[s.tagText, { color }]}>{children}</Text>
    </View>
  )
}

export function ArxProg({ pct, color, style }: { pct: number; color: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useShell()
  return (
    <View style={[s.prog, { backgroundColor: c.acc }, style]}>
      <View style={[s.progFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} />
    </View>
  )
}

export function ArxInput({ style, ...props }: TextInputProps) {
  const { c } = useShell()
  return (
    <TextInput
      placeholderTextColor={c.txt3}
      {...props}
      style={[s.input, { backgroundColor: c.surf2, borderColor: c.bdr, color: c.txt }, style]}
    />
  )
}

export function Serif({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontFamily: FONT_SERIF }, style]}>{children}</Text>
}

export function Sans({ children, style, bold, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; bold?: boolean; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: bold ? FONT_SANS_BOLD : FONT_SANS }, style]}>{children}</Text>
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { c } = useShell()
  return <Sans bold style={[s.sectionLabel, { color: c.txt3 }, style]}>{children}</Sans>
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 4,
  },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 11, fontFamily: FONT_SANS_BOLD },
  prog: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  input: {
    fontFamily: FONT_SANS,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  sectionLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  gradBtnWrap: { borderRadius: 16, overflow: 'hidden', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  gradBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
})
