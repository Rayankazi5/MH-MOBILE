import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/services/api'

type Mode = 'login' | 'register'

const ACCENT: Record<Role, { main: string; dark: string; glow: string }> = {
  patient: { main: '#3b82f6', dark: '#2563eb', glow: 'rgba(59,130,246,0.3)' },
  clinician: { main: '#8b5cf6', dark: '#7c3aed', glow: 'rgba(139,92,246,0.3)' },
}

export default function LoginScreen() {
  const { login, register } = useAuth()
  const insets = useSafeAreaInsets()

  const [portal, setPortal] = useState<Role>('patient')
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isPatient = portal === 'patient'
  const accent = ACCENT[portal]

  const switchPortal = (p: Role) => {
    setPortal(p)
    setError('')
    setFullName('')
    setEmail('')
    setPassword('')
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    if (mode === 'register' && !fullName.trim()) { setError('Full name is required.'); return }
    if (!email.trim() || !password) { setError('Email and password are required.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password, fullName.trim(), portal)
      } else {
        await login(email.trim(), password, portal)
      }
      // Root layout routes to the right portal once the user is set
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#0a0e1a', '#111827', '#0f172a']} style={StyleSheet.absoluteFill} />
      <View style={[s.orb, s.orb1]} />
      <View style={[s.orb, s.orb2]} />
      <View style={[s.orb, s.orb3]} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoSection}>
            <Svg width={44} height={44} viewBox="0 0 36 36">
              <Defs>
                <SvgGradient id="grad" x1="0" y1="0" x2="36" y2="36">
                  <Stop offset="0" stopColor="#3b82f6" />
                  <Stop offset="1" stopColor="#8b5cf6" />
                </SvgGradient>
              </Defs>
              <Circle cx="18" cy="18" r="18" fill="url(#grad)" />
              <Path
                d="M12 18C12 14.686 14.686 12 18 12C21.314 12 24 14.686 24 18C24 21.314 21.314 24 18 24"
                stroke="white" strokeWidth={2.5} strokeLinecap="round" fill="none"
              />
              <Circle cx="18" cy="18" r="3" fill="white" />
            </Svg>
            <Text style={s.logoText}>Insight Navigator</Text>
            <Text style={s.logoSubtext}>Mental health decision support platform</Text>
          </View>

          <View style={s.card}>
            {/* Portal selector */}
            <View style={s.portalRow}>
              <PortalButton
                emoji="🧠" label="Patient" color={ACCENT.patient.main}
                active={isPatient} onPress={() => switchPortal('patient')}
              />
              <View style={s.portalDivider} />
              <PortalButton
                emoji="🩺" label="Therapist" color={ACCENT.clinician.main}
                active={!isPatient} onPress={() => switchPortal('clinician')}
              />
            </View>

            {/* Mode tabs */}
            <View style={s.tabBar}>
              {(['login', 'register'] as Mode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.tabBtn, mode === m && { borderBottomColor: accent.main }]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.tabText, mode === m && { color: accent.main, fontWeight: '700' }]}>
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.form}>
              {mode === 'register' && (
                <Field
                  label="Full name" value={fullName} onChangeText={setFullName}
                  placeholder={isPatient ? 'Jane Smith' : 'Dr. Jane Smith'} autoCapitalize="words"
                />
              )}
              <Field
                label="Email" value={email} onChangeText={setEmail}
                placeholder={isPatient ? 'you@example.com' : 'you@clinic.com'}
                keyboardType="email-address" autoCapitalize="none"
              />
              <Field
                label="Password" value={password} onChangeText={setPassword}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} secureTextEntry
              />

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.submitBtnWrap, { shadowColor: accent.main }, submitting && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={[accent.main, accent.dark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.submitBtn}
                >
                  <Text style={s.submitBtnText}>
                    {submitting
                      ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                      : mode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={s.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={[s.switchLink, { color: accent.main }]} onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Register' : 'Sign in'}
              </Text>
            </Text>

            <Text style={s.portalHint}>
              {isPatient ? 'Are you a therapist? ' : 'Are you a patient? '}
              <Text
                style={[s.switchLink, { color: isPatient ? ACCENT.clinician.main : ACCENT.patient.main }]}
                onPress={() => switchPortal(isPatient ? 'clinician' : 'patient')}
              >
                {isPatient ? 'Therapist portal →' : 'Patient portal →'}
              </Text>
            </Text>
          </View>

          <Text style={s.footer}>Secured with end-to-end encryption · HIPAA-aware architecture</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function PortalButton({ emoji, label, color, active, onPress }: {
  emoji: string; label: string; color: string; active: boolean; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[s.portalBtn, active && { borderColor: color, backgroundColor: `${color}1a` }]}
      onPress={onPress}
    >
      <Text style={s.portalEmoji}>{emoji}</Text>
      <Text style={[s.portalLabel, { color: active ? color : '#9ca3af' }]}>{label}</Text>
    </TouchableOpacity>
  )
}

function Field({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words' | 'sentences'
}) {
  return (
    <View>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0e1a' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 300, height: 300, top: -100, left: -100, backgroundColor: 'rgba(59,130,246,0.10)' },
  orb2: { width: 260, height: 260, bottom: -80, right: -80, backgroundColor: 'rgba(139,92,246,0.09)' },
  orb3: { width: 160, height: 160, top: '45%', left: '55%', backgroundColor: 'rgba(16,185,129,0.06)' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#c7d2fe', letterSpacing: -0.5, marginTop: 12 },
  logoSubtext: { color: '#6b7280', fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
  },
  portalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  portalBtn: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
  },
  portalEmoji: { fontSize: 28, lineHeight: 32 },
  portalLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  portalDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  form: { gap: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    padding: 12, fontSize: 16, color: '#f3f4f6', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  error: {
    color: '#f87171', fontSize: 14, lineHeight: 20,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 8, padding: 10,
  },
  submitBtnWrap: {
    borderRadius: 12, marginTop: 2, overflow: 'hidden',
    shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtn: { paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' },
  switchLink: { fontWeight: '600' },
  portalHint: { textAlign: 'center', marginTop: 12, fontSize: 13, color: '#4b5563' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 12, color: '#374151', letterSpacing: 0.3 },
})
