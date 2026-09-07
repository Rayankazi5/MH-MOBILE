import { Tabs } from 'expo-router'
import { ShellProvider, useShell } from '@/contexts/ShellContext'
import { ShellHeader, ShellTabBar } from '@/components/patient/Shell'

function PatientTabs() {
  const { c } = useShell()
  return (
    <Tabs
      screenOptions={{ header: () => <ShellHeader /> }}
      sceneContainerStyle={{ backgroundColor: c.bg }}
      tabBar={props => <ShellTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="analysis" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="checkin" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  )
}

export default function PatientLayout() {
  return (
    <ShellProvider>
      <PatientTabs />
    </ShellProvider>
  )
}
