import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { api, type PatientSummary } from '@/services/api'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [linkEmail, setLinkEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  const loadPatients = useCallback(() => {
    setLoadError(null)
    return api.clinician.patients()
      .then(setPatients)
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load patients'))
      .finally(() => {
        setIsLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  const onRefresh = () => {
    setRefreshing(true)
    loadPatients()
  }

  const handleLink = async () => {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(false)
    try {
      await api.clinician.linkPatient(linkEmail.trim())
      setLinkSuccess(true)
      setLinkEmail('')
      loadPatients()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to link patient')
    } finally {
      setLinking(false)
    }
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 48 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Insight Navigator</Text>
          <Text style={s.userLabel} numberOfLines={1}>{user?.full_name ?? user?.email}</Text>
        </View>
        <TouchableOpacity style={s.signOutBtn} onPress={logout}>
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.cardHeading}>Add a patient</Text>
        <View style={s.linkForm}>
          <TextInput
            style={s.linkInput}
            value={linkEmail}
            onChangeText={setLinkEmail}
            placeholder="patient@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[s.linkBtn, linking && s.linkBtnDisabled]}
            onPress={handleLink}
            disabled={linking}
          >
            <Text style={s.linkBtnText}>{linking ? 'Linking…' : 'Link patient'}</Text>
          </TouchableOpacity>
        </View>
        {linkError && <Text style={s.linkError}>{linkError}</Text>}
        {linkSuccess && <Text style={s.linkSuccess}>Patient linked successfully.</Text>}
      </View>

      <Text style={s.sectionTitle}>Patients ({patients.length})</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#2563eb" />
      ) : loadError ? (
        <View style={s.emptyState}>
          <Text style={s.loadErrorText}>{loadError}</Text>
          <Text style={s.emptySubtitle}>Pull down to try again.</Text>
        </View>
      ) : patients.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No patients linked yet</Text>
          <Text style={s.emptySubtitle}>Enter a patient's email address above to link them.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {patients.map(p => (
            <TouchableOpacity
              key={p.id}
              style={s.patientRow}
              onPress={() => router.push(`/patient/${p.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.patientName}>{p.full_name}</Text>
                <Text style={s.patientEmail}>{p.email}</Text>
              </View>
              <View style={s.patientRowRight}>
                {p.open_flags > 0 && (
                  <View style={s.flagBadge}>
                    <Text style={s.flagBadgeText}>
                      {p.open_flags} flag{p.open_flags > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                <Text style={s.chevron}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  userLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  loadErrorText: { color: '#dc2626', fontWeight: '500', marginBottom: 6, textAlign: 'center' },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: '#fff' },
  signOutText: { fontSize: 13, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', padding: 18, marginBottom: 20 },
  cardHeading: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },
  linkForm: { gap: 10 },
  linkInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111827' },
  linkBtn: { backgroundColor: '#2563eb', borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  linkBtnDisabled: { opacity: 0.6 },
  linkBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  linkError: { color: '#dc2626', fontSize: 13, marginTop: 8 },
  linkSuccess: { color: '#16a34a', fontSize: 13, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 14 },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  emptyTitle: { fontWeight: '500', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  patientName: { fontWeight: '500', fontSize: 15, color: '#111827' },
  patientEmail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  patientRowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flagBadge: { backgroundColor: '#fef2f2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  flagBadgeText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  chevron: { fontSize: 13, color: '#9ca3af' },
})
