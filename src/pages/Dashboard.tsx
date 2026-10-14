import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Hammer, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../lib/auth'
import { useI18n, type TKey } from '../lib/i18n'

import { useAdminData } from '../lib/useAdminData'
import { byUrgency, fmtDateTime, peso } from '../lib/utils'
import { Card, Empty, PageTitle, StatusBadge, UrgencyBadge } from '../components/ui'
import { CATEGORIES } from '../types'

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  tone: string
}) {
  return (
    <div className={`rounded-[2.5rem] p-6 ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider opacity-80">{label}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <div className="mt-3 text-4xl font-black tracking-tight">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { facilities, reports, repairs, loading } = useAdminData()
  const { role, fullName } = useAuth()
  const { t } = useI18n()
  const isAdmin = role === 'admin'
  const name = (id: string) => facilities.find((f) => f.id === id)?.name ?? t('common.unknown')

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    return {
      pending: reports.filter((r) => r.status === 'Pending').length,
      progress: reports.filter((r) => r.status === 'In Progress').length,
      resolved: reports.filter((r) => r.status === 'Resolved').length,
      monthCost: repairs.filter((r) => r.repair_date.startsWith(month)).reduce((s, r) => s + r.cost, 0),
    }
  }, [reports, repairs])

  const byCategory = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        name: t(`category.${c}` as TKey),
        count: reports.filter((r) => r.category === c).length,
      })),
    [reports, t],
  )

  const attention = useMemo(
    () => reports.filter((r) => r.status !== 'Resolved').sort(byUrgency).slice(0, 6),
    [reports],
  )

  if (loading) return <div className="font-bold text-slate-400">{t('common.loading')}</div>

  return (
    <>
      <PageTitle
        title={t('dash.title')}
        subtitle={isAdmin ? t('dash.subAdmin') : t('dash.subStaff', { name: fullName })}
      />

      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        <Stat label={t('status.Pending')} value={stats.pending} icon={<Clock />} tone="bg-amber-400 text-amber-950" />
        <Stat label={t('status.In Progress')} value={stats.progress} icon={<Hammer />} tone="bg-sky-500 text-white" />
        <Stat label={t('status.Resolved')} value={stats.resolved} icon={<CheckCircle2 />} tone="bg-emerald-500 text-white" />
        {isAdmin && (
          <Stat label={t('dash.monthCost')} value={peso(stats.monthCost)} icon={<Wallet />} tone="bg-slate-900 text-white" />
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <AlertTriangle className="text-rose-500" size={22} /> {t('dash.attention')}
            </h2>
            <Link to="/admin/reports" className="text-sm font-black text-indigo-600 hover:underline">
              {t('dash.viewAll')}
            </Link>
          </div>
          {attention.length === 0 ? (
            <Empty>{isAdmin ? t('dash.emptyAdmin') : t('dash.emptyStaff')}</Empty>
          ) : (
            <ul className="space-y-3">
              {attention.map((r) => (
                <li key={r.id} className="rounded-[2rem] bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-black text-slate-900">{name(r.facility_id)}</div>
                    <div className="flex gap-2">
                      <UrgencyBadge value={r.urgency} />
                      <StatusBadge value={r.status} />
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">{r.description}</p>
                  <div className="mt-2 text-xs font-bold text-slate-400">
                    #{r.ticket} · {t(`category.${r.category}` as TKey)} · {fmtDateTime(r.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-5 text-xl font-black">{t('dash.byCategory')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" name={t('dash.series')} fill="#4f46e5" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}
