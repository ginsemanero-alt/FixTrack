import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { hasSupabase, supabase } from './supabase'
import type { Role, Staff } from '../types'

interface AuthState {
  loading: boolean
  user: { email: string } | null
  /** null when signed out, or signed in without a `profiles` row (no access). */
  role: Role | null
  fullName: string
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

// ───────────── Demo accounts (used only when Supabase is not configured) ─────────────
interface DemoAccount {
  email: string
  password: string
  role: Role
  fullName: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'admin@school.edu', password: 'admin123', role: 'admin', fullName: 'Admin' },
  { email: 'tonyo@school.edu', password: 'staff123', role: 'maintenance', fullName: 'Mang Tonyo' },
  { email: 'dan@school.edu', password: 'staff123', role: 'maintenance', fullName: 'Electrician Dan' },
]

const DEMO_KEY = 'fixtrack.demoUser'
const ACCOUNTS_KEY = 'fixtrack.demoAccounts'

export function getDemoAccounts(): DemoAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw) return JSON.parse(raw) as DemoAccount[]
  } catch {
    // fall through to defaults
  }
  return DEMO_ACCOUNTS
}

function saveDemoAccounts(rows: DemoAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(rows))
  window.dispatchEvent(new Event('fixtrack:change'))
}

export function demoStaffList(): Staff[] {
  return getDemoAccounts().map((a) => ({ id: a.email, email: a.email, full_name: a.fullName, role: a.role }))
}

/** Demo mode only: create a maintenance account. Throws a user-readable message on bad input. */
export function addDemoStaff(input: { email: string; password: string; fullName: string }) {
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()
  if (!email || !fullName || input.password.length < 4) {
    throw new Error('Kumpletuhin ang pangalan, email, at password (min. 4 na character).')
  }
  const rows = getDemoAccounts()
  if (rows.some((a) => a.email === email)) throw new Error('May account na gamit ang email na iyon.')
  if (rows.some((a) => a.fullName.toLowerCase() === fullName.toLowerCase())) {
    throw new Error('May staff na may ganoong pangalan. Gumamit ng ibang pangalan.')
  }
  saveDemoAccounts([...rows, { email, password: input.password, role: 'maintenance', fullName }])
}

/** Demo mode only: remove a maintenance account (admin accounts cannot be removed). */
export function removeDemoStaff(email: string) {
  saveDemoAccounts(getDemoAccounts().filter((a) => !(a.email === email && a.role === 'maintenance')))
}

export function resetDemoAccounts() {
  localStorage.removeItem(ACCOUNTS_KEY)
  window.dispatchEvent(new Event('fixtrack:change'))
}

const findDemo = (email: string) => getDemoAccounts().find((a) => a.email === email.trim().toLowerCase())

// ───────────── Provider ─────────────
interface Profile {
  role: Role | null
  fullName: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false)
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null)
  // Supabase mode: the profile that was loaded, and for which user id.
  const [profile, setProfile] = useState<(Profile & { forId: string }) | null>(null)

  useEffect(() => {
    if (!hasSupabase) {
      const saved = localStorage.getItem(DEMO_KEY)
      const acct = saved ? findDemo(saved) : undefined
      setAuthUser(acct ? { id: acct.email, email: acct.email } : null)
      setSessionReady(true)
      return
    }
    const toUser = (u?: { id: string; email?: string } | null) => (u?.email ? { id: u.id, email: u.email } : null)
    supabase!.auth.getSession().then(({ data }) => {
      setAuthUser(toUser(data.session?.user))
      setSessionReady(true)
    })
    const { data: sub } = supabase!.auth.onAuthStateChange((_e, session) => {
      setAuthUser(toUser(session?.user))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Supabase mode: load role + name from `profiles` for the signed-in user.
  // (Kept out of onAuthStateChange on purpose: awaiting Supabase calls in that callback can deadlock.)
  useEffect(() => {
    if (!hasSupabase || !authUser) return
    let cancelled = false
    supabase!
      .from('profiles')
      .select('role, full_name')
      .eq('id', authUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const role = data?.role === 'admin' || data?.role === 'maintenance' ? (data.role as Role) : null
        setProfile({ forId: authUser.id, role, fullName: data?.full_name ?? '' })
      })
    return () => {
      cancelled = true
    }
  }, [authUser])

  let role: Role | null = null
  let fullName = ''
  let profileLoading = false
  if (authUser) {
    if (hasSupabase) {
      if (profile?.forId === authUser.id) {
        role = profile.role
        fullName = profile.fullName
      } else {
        profileLoading = true
      }
    } else {
      const acct = findDemo(authUser.email)
      role = acct?.role ?? null
      fullName = acct?.fullName ?? ''
    }
  }

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!hasSupabase) {
      const acct = findDemo(email)
      if (acct && acct.password === password) {
        localStorage.setItem(DEMO_KEY, acct.email)
        setAuthUser({ id: acct.email, email: acct.email })
        return null
      }
      return 'Mali ang email o password.'
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signOut = async () => {
    if (!hasSupabase) {
      localStorage.removeItem(DEMO_KEY)
      setAuthUser(null)
      return
    }
    await supabase!.auth.signOut()
  }

  return (
    <Ctx.Provider
      value={{
        loading: !sessionReady || profileLoading,
        user: authUser ? { email: authUser.email } : null,
        role,
        fullName,
        signIn,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
