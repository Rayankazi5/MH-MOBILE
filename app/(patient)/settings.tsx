import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/hooks/useAuth'

export default function PatientSettings() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  return (
    <View style={s.page}>
      <LinearGradient colors={['#0a0e1a', '#111827', '#0f172a']} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/(patient)/home')}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.row}>
            <Text style={s.rowLabel}>Name</Text>
            <Text style={s.rowValue}>{user?.full_name ?? '—'}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Email</Text>
            <Text style={s.rowValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy</Text>
          <Text style={s.muted}>Your journal entries are end-to-end encrypted. Only you and your linked clinician can access your data.</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Session</Text>
          <TouchableOpacity onPress={logout} style={s.outlineBtn}>
            <Text style={s.outlineBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.section, { borderColor: 'rgba(239,68,68,0.15)' }]}>
          <Text style={[s.sectionTitle, { color: '#f87171' }]}>Danger zone</Text>
          {!confirming ? (
            <>
              <Text style={s.muted}>Deleting your account is permanent and cannot be undone. All your data will be anonymised.</Text>
              <TouchableOpacity onPress={() => setConfirming(true)} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>Delete account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[s.muted, { color: '#f87171', fontWeight: '500' }]}>Are you sure? This cannot be undone.</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setConfirming(false)} style={s.cancelBtn}>
                  <Text style={{ color: '#9ca3af', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                {/* Mirrors web: deletion would call the backend; for now it just signs out */}
                <TouchableOpacity onPress={logout} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>Yes, delete my account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a0e1a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  back: { color: '#8b5cf6', fontSize: 15 },
  headerTitle: { fontWeight: '700', color: '#a5b4fc', fontSize: 16 },
  body: { padding: 24, gap: 20 },
  section: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 20, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 12 },
  rowLabel: { fontSize: 14, color: '#9ca3af' },
  rowValue: { fontSize: 14, color: '#e5e7eb', fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  muted: { fontSize: 14, color: '#9ca3af', lineHeight: 22, marginBottom: 16 },
  outlineBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8 },
  outlineBtnText: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  deleteBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', borderRadius: 8 },
  deleteBtnText: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
})
