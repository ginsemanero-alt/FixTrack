import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAdminData } from '../lib/useAdminData'
import { downloadCsv, peso } from '../lib/utils'
import { Button, Card, Empty, PageTitle, inputClass } from '../components/ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Expenses() {
  const { facilities, repairs, reports, loading } = useAdminData()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)

  const years = useMemo(() => {
    const set = new Set<number>([thisYear])
    repairs.forEach((r) => set.add(Number(r.repair_date.slice(0, 4))))
    return [...set].sort((a, b) => b - a)
  }, [repairs, thisYear])

  const inYear = useMemo(() => repairs.filter((r) => r.repair_date.startsWith(String(year))), [repairs, year])
  const total = inYear.reduce((s, r) => s + r.cost, 0)

  const monthly = useMemo(
    () =>
      MONTHS.map((m, i) => ({
        month: m,
        total: inYear
          .filter((r) => Number(r.repair_date.slice(5, 7)) === i + 1)
          .reduce((s, r) => s + r.cost, 0),
      })),
    [inYear],
  )

  const byFacility = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    inYear.forEach((r) => {
      const cur = map.get(r.facility_id) ?? { total: 0, count: 0 }
      map.set(r.facility_id, { total: cur.total + r.cost, count: cur.count + 1 })
    })
    return [...map.entries()]
      .map(([id, v]) => ({ id, name: facilities.find((f) => f.id === id)?.name ?? 'Unknown', ...v }))
      .sort((a, b) => b.total - a.total)
  }, [inYear, facilities])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    inYear.forEach((r) => {
      const cat = reports.find((x) => x.id === r.report_id)?.category ?? 'Other'
      map.set(cat, (map.get(cat) ?? 0) + r.cost)
    })
    return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  }, [inYear, reports])

  function exportCsv() {
    downloadCsv(`expenses-${year}.csv`, [
      ['Month', 'Total (PHP)'],
      ...monthly.map((m) => [m.month, m.total]),
      [],
      ['Facility', 'Repairs', 'Total (PHP)'],
      ...byFacility.map((f) => [f.name, f.count, f.total]),
    ])
  }

  if (loading) return <div className="font-bold text-slate-400">Loading…</div>

  return (
    <>
      <PageTitle
        title="Expenses"
        subtitle="Gastos sa repair kada buwan, taon, at facility."
        action={
          <div className="no-print flex gap-2">
            <select
              className={`${inputClass} !w-auto !rounded-full !bg-white`}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </Button>
            <Button variant="dark" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[2.5rem] bg-indigo-600 p-6 text-white sm:col-span-1">
          <div className="text-[11px] font-black uppercase tracking-wider opacity-80">Total {year}</div>
          <div className="mt-3 text-4xl font-black tracking-tight">{peso(total)}</div>
        </div>
        <div className="rounded-[2.5rem] bg-white p-6 ring-1 ring-slate-200">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Bilang ng repairs</div>
          <div className="mt-3 text-4xl font-black tracking-tight">{inYear.length}</div>
        </div>
        <div className="rounded-[2.5rem] bg-white p-6 ring-1 ring-slate-200">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Average kada repair</div>
          <div className="mt-3 text-4xl font-black tracking-tight">
            {peso(inYear.length ? total / inYear.length : 0)}
          </div>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="mb-5 text-xl font-black">Buwanang gastos</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 12, fontWeight: 700 }} tickFormatter={(v: number) => `₱${v / 1000}k`} />
              <Tooltip formatter={(v) => peso(Number(v))} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="total" name="Gastos" fill="#4f46e5" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-black">Ayon sa facility</h2>
          {byFacility.length === 0 ? (
            <Empty>Walang gastos sa taong ito.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {byFacility.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-black text-slate-900">{f.name}</div>
                    <div className="text-xs font-bold text-slate-400">{f.count} repair(s)</div>
                  </div>
                  <div className="font-black text-indigo-600">{peso(f.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-black">Ayon sa uri ng sira</h2>
          {byCategory.length === 0 ? (
            <Empty>Walang gastos sa taong ito.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {byCategory.map((c) => (
                <li key={c.name} className="flex items-center justify-between py-3">
                  <div className="font-black text-slate-900">{c.name}</div>
                  <div className="font-black text-indigo-600">{peso(c.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
