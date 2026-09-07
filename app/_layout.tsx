import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito'
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

function RootNavigator() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return
    const inAuth = segments[0] === '(auth)'
    const inPatientPortal = segments[0] === '(patient)'

    if (!user) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }
    if (user.role === 'patient') {
      if (!inPatientPortal) router.replace('/(patient)/home')
      return
    }
    if (inAuth || inPatientPortal) router.replace('/')
  }, [user, isLoading, segments, router])

  if (isLoading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="patient/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="(patient)" />
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  })

  if (!fontsLoaded) return null

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}
