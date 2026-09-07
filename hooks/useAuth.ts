import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type AuthUser, type Role } from '@/services/api'
import { getItem, setItem, deleteItem } from '@/services/storage'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string, portal: Role) => Promise<void>
  register: (email: string, password: string, fullName: string, portal: Role) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PORTAL_MISMATCH: Record<Role, string> = {
  clinician: 'This portal is for clinicians only. Please use the patient portal.',
  patient: 'This portal is for patients only. Please use the therapist portal.',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getItem('access_token')
      .then(token => {
        if (!token) return
        return api.auth.me().then(setUser).catch(() => deleteItem('access_token'))
      })
      .finally(() => setIsLoading(false))
  }, [])

  const _setSession = async (access_token: string, portal: Role) => {
    await setItem('access_token', access_token)
    const me = await api.auth.me()
    if (me.role !== portal) {
      await deleteItem('access_token')
      throw new Error(PORTAL_MISMATCH[portal])
    }
    setUser(me)
  }

  const login = async (email: string, password: string, portal: Role) => {
    const { access_token } = await api.auth.login(email, password)
    await _setSession(access_token, portal)
  }

  const register = async (email: string, password: string, fullName: string, portal: Role) => {
    await api.auth.register(email, password, fullName, portal)
    const { access_token } = await api.auth.login(email, password)
    await _setSession(access_token, portal)
  }

  const logout = async () => {
    await deleteItem('access_token')
    setUser(null)
  }

  return createElement(AuthContext.Provider, { value: { user, isLoading, login, register, logout } }, children)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
