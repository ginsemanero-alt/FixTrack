import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Bell, ClipboardList, History, LayoutDashboard, LogOut, QrCode, Receipt, Users, Wrench } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { hasSupabase } from '../lib/supabase'
import { resetDemoData } from '../lib/store'
import { useData } from '../lib/useData'
import { useI18n, type TKey } from '../lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import { Button, Card } from './ui'
import type { Role } from '../types'

const links: { to: string; label: TKey; icon: typeof Users; end?: boolean; roles: Role[] }[] = [
  { to: '/admin', label: 'nav.dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'maintenance'] },
  { to: '/admin/reports', label: 'nav.reports', icon: ClipboardList, roles: ['admin', 'maintenance'] },
  { to: '/admin/facilities', label: 'nav.facilities', icon: QrCode, roles: ['admin'] },
  { to: '/admin/history', label: 'nav.history', icon: History, roles: ['admin'] },
  { to: '/admin/expenses', label: 'nav.expenses', icon: Receipt, roles: ['admin'] },
  { to: '/admin/staff', label: 'nav.staff', icon: Users, roles: ['admin'] },
]

export default function AdminLayout() {
  const { user, loading, role, fullName, signOut } = useAuth()
  const nav = useNavigate()
  const { t } = useI18n()
  const data = useData(role, fullName)
  const pending = data.reports.filter((r) => r.status === 'Pending').length
  const [seen, setSeen] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // In-app notification: tell staff when a new pending report arrives.
  useEffect(() => {
    if (data.loading) return
    if (seen !== null && pending > seen) {
      setToast(
        role === 'admin'
          ? t('layout.toastNew', { n: pending - seen })
          : t('layout.toastAssigned', { n: pending - seen }),
      )
      const timer = window.setTimeout(() => setToast(null), 5000)
      setSeen(pending)
      return () => window.clearTimeout(timer)
    }
    if (seen === null || pending < seen) setSeen(pending)
  }, [pending, seen, data.loading, role, t])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // Signed in, but no row in `profiles` yet: no role means no access.
  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <Card className="max-w-md !rounded-[3.5rem] text-center">
          <h1 className="text-2xl font-black text-slate-900">{t('layout.noAccessTitle')}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{t('layout.noAccessText', { email: user.email })}</p>
          <Button
            onClick={async () => {
              await signOut()
              nav('/login')
            }}
            className="mt-6 w-full"
          >
            <LogOut size={16} /> {t('layout.logout')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print border-b border-slate-200 bg-slate-900 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:rounded-r-[3.5rem] lg:border-0 lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500">
              <Wrench size={22} />
            </span>
            <div>
              <div className="text-lg font-black leading-none">FixTrack</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t('brand.sub')}
              </div>
            </div>
          </div>
          <div className="relative lg:hidden">
            <Bell size={22} />
            {pending > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1.5 text-[10px] font-black">
                {pending}
              </span>
            )}
          </div>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto lg:mt-8 lg:flex-col">
          {links
            .filter((l) => l.roles.includes(role))
            .map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-full px-4 py-3 text-sm font-black transition ${
                    isActive ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={18} />
                {t(label)}
                {to === '/admin/reports' && pending > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                    {pending}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>

        <div className="mt-4 hidden space-y-2 lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:block">
          <LanguageSwitcher className="w-full [&>select]:w-full" />
          <div className="px-2">
            <div className="truncate text-sm font-black text-white">{fullName || user.email}</div>
            <div className="truncate text-xs font-bold text-slate-400">
              {t(role === 'admin' ? 'role.admin' : 'role.maintenance')} · {user.email}
            </div>
          </div>
          {!hasSupabase && role === 'admin' && (
            <button
              onClick={() => {
                if (confirm(t('layout.resetConfirm'))) resetDemoData()
              }}
              className="w-full rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
            >
              {t('layout.reset')}
            </button>
          )}
          <button
            onClick={async () => {
              await signOut()
              nav('/login')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/20"
          >
            <LogOut size={16} /> {t('layout.logout')}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8 lg:p-10">
        {toast && (
          <div className="no-print fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-xl">
            <Bell size={16} /> {toast}
          </div>
        )}
        {data.error && (
          <Card className="mb-6 !rounded-[2rem] bg-rose-50 text-sm font-bold text-rose-600">{data.error}</Card>
        )}
        <Outlet context={data} />
        <LanguageSwitcher tone="light" className="mt-10 lg:hidden" />
        <button
          onClick={async () => {
            await signOut()
            nav('/login')
          }}
          className="no-print mt-3 flex items-center gap-2 rounded-full bg-slate-200 px-5 py-3 text-sm font-black text-slate-700 lg:hidden"
        >
          <LogOut size={16} /> {t('layout.logout')}
        </button>
      </main>
    </div>
  )
}
