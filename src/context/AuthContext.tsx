import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { validateUserAccess } from '../services/gasApi'
import type { Establishment, UserRole } from '../types'

type GoogleIdTokenPayload = {
  email?: string
  name?: string
  picture?: string
}

export type AuthStatus = 'signedOut' | 'checking' | 'unauthorized' | 'authenticated'

export type AuthState = {
  status: AuthStatus
  role: UserRole | null
  email: string
  name: string | null
  picture: string | null
  establishment: Establishment | null
  adminProfile: Establishment | null
  message: string | null
}

const INITIAL_STATE: AuthState = {
  status: 'signedOut',
  role: null,
  email: '',
  name: null,
  picture: null,
  establishment: null,
  adminProfile: null,
  message: null,
}

const STORAGE_KEY = 'medallas.sesion'

type AuthContextValue = {
  auth: AuthState
  signInWithGoogleCredential: (credential: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => restoreSession())

  useEffect(() => {
    if (auth.status === 'authenticated') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  async function signInWithGoogleCredential(credential: string) {
    let payload: GoogleIdTokenPayload
    try {
      payload = jwtDecode<GoogleIdTokenPayload>(credential)
    } catch {
      setAuth({
        ...INITIAL_STATE,
        status: 'unauthorized',
        message: 'No fue posible leer la sesión entregada por Google. Intenta nuevamente.',
      })
      return
    }

    const email = (payload.email || '').trim()
    if (!email) {
      setAuth({
        ...INITIAL_STATE,
        status: 'unauthorized',
        message: 'Tu cuenta de Google no expone un correo electrónico válido.',
      })
      return
    }

    setAuth({
      ...INITIAL_STATE,
      status: 'checking',
      email,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    })

    try {
      const res = await validateUserAccess(email)

      if (res.success && res.role === 'director' && res.establishment) {
        setAuth({
          status: 'authenticated',
          role: 'director',
          email,
          name: payload.name ?? null,
          picture: payload.picture ?? null,
          establishment: res.establishment,
          adminProfile: null,
          message: null,
        })
        return
      }

      if (res.success && res.role === 'admin' && res.admin) {
        setAuth({
          status: 'authenticated',
          role: 'admin',
          email,
          name: payload.name ?? null,
          picture: payload.picture ?? null,
          establishment: null,
          adminProfile: res.admin,
          message: null,
        })
        return
      }

      setAuth({
        ...INITIAL_STATE,
        status: 'unauthorized',
        email,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
        message:
          res.message ||
          'Tu correo no se encuentra registrado en la base de datos de establecimientos ni como usuario administrador. Por favor, contacta al equipo a cargo del sistema.',
      })
    } catch {
      setAuth({
        ...INITIAL_STATE,
        status: 'unauthorized',
        email,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
        message: 'No fue posible conectar con el sistema. Verifica tu conexión e intenta nuevamente.',
      })
    }
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY)
    setAuth(INITIAL_STATE)
  }

  return <AuthContext.Provider value={{ auth, signInWithGoogleCredential, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return ctx
}

function restoreSession(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw) as AuthState
    if (parsed.status === 'authenticated' && parsed.role) return parsed
    return INITIAL_STATE
  } catch {
    return INITIAL_STATE
  }
}
