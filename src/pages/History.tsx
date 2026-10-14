import { useMemo, useState } from 'react'
import { useAdminData } from '../lib/useAdminData'
import { downloadCsv, fmtDate, peso } from '../lib/utils'
import { useI18n } from '../lib/i18n'

import { Badge, Button, Card, Empty, PageTitle, StatusBadge, UrgencyBadge, inputClass } from '../components/ui'

export default function History() {
  const { facilities, reports, repairs, loading } = useAdminData()
  const { t } = useI18n()
  const [facilityId, setFacilityId] = useState('all')

  const name = (id: string) => facilities.find((f) => f.id === id)?.name ?? t('common.unknown')

  const repairRows = useMemo(
    () => repairs.filter((r) => facilityId === 'all' || r.facility_id === facilityId),
    [repairs, facilityId],
  )
  const reportRows = useMemo(
    () => reports.filter((r) => facilityId === 'all' || r.facility_id === facilityId),
    [reports, facilityId],
  )
  const total = repairRows.reduce((s, r) => s + r.cost, 0)

  function exportCsv() {
    downloadCsv('repair-history.csv', [
      ['Date', 'Facility', 'Work done', 'Technician', 'Cost (PHP)'],
      ...repairRows.map((r) => [r.repair_date, name(r.facility_id), r.description, r.technician, r.cost]),
    ])
  }

  if (loading) return <div className="font-bold text-slate-400">{t('common.loading')}</div>

  return (
    <>
      <PageTitle
        title={t('hist.title')}
        subtitle={t('hist.subtitle')}
        action={
          <div className="no-print flex gap-2">
            <select className={`${inputClass} !w-auto !rounded-full !bg-white`} value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
              <option value="all">{t('hist.allFacilities')}</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Button variant="dark" onClick={exportCsv} disabled={repairRows.length === 0}>
              {t('common.exportCsv')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">{t('hist.done')}</h2>
            <Badge className="bg-slate-900 text-white ring-slate-900">{peso(total)}</Badge>
          </div>
          {repairRows.length === 0 ? (
            <Empty>{t('hist.noRepairs')}</Empty>
          ) : (
            <ol className="relative space-y-5 border-l-4 border-slate-100 pl-6">
              {repairRows.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute -left-[34px] top-1.5 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-black text-slate-900">{name(r.facility_id)}</div>
                    <div className="text-sm font-black text-indigo-600">{peso(r.cost)}</div>
                  </div>
                  <p className="text-sm font-medium text-slate-600">{r.description}</p>
                  <div className="mt-1 text-xs font-bold text-slate-400">
                    {fmtDate(r.repair_date)}
                    {r.technician && ` · ${r.technician}`}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <h2 className="mb-5 text-xl font-black">{t('hist.allReports')}</h2>
          {reportRows.length === 0 ? (
            <Empty>{t('hist.noReports')}</Empty>
          ) : (
            <ul className="space-y-3">
              {reportRows.slice(0, 30).map((r) => (
                <li key={r.id} className="rounded-[1.75rem] bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <UrgencyBadge value={r.urgency} />
                    <StatusBadge value={r.status} />
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-900">{name(r.facility_id)}</div>
                  <p className="line-clamp-2 text-xs font-medium text-slate-500">{r.description}</p>
                  <div className="mt-1 text-[11px] font-bold text-slate-400">
                    #{r.ticket} · {fmtDate(r.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
