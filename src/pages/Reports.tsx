import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Hammer, Search, Trash2, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { db, onDataChange } from '../lib/store'
import { useAdminData } from '../lib/useAdminData'
import { byUrgency, fmtDateTime, facilityLabel } from '../lib/utils'
import { Button, Card, Empty, Field, Modal, PageTitle, StatusBadge, UrgencyBadge, inputClass } from '../components/ui'
import { STATUSES, type Report, type Staff, type Status } from '../types'

export default function Reports() {
  const { facilities, reports, refresh, loading } = useAdminData()
  const { role, fullName } = useAuth()
  const isAdmin = role === 'admin'
  const [staff, setStaff] = useState<Staff[]>([])
  const [filter, setFilter] = useState<Status | 'All'>('All')
  const [q, setQ] = useState('')
  const [repairFor, setRepairFor] = useState<Report | null>(null)
  const [photoOpen, setPhotoOpen] = useState<string | null>(null)

  // Admin picks assignees from the maintenance staff list.
  useEffect(() => {
    if (!isAdmin) return
    const load = () => void db.listStaff().then(setStaff).catch(() => setStaff([]))
    load()
    return onDataChange(load)
  }, [isAdmin])
  const staffNames = staff.filter((s) => s.role === 'maintenance').map((s) => s.full_name)

  const facility = (id: string) => facilities.find((f) => f.id === id)

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return reports
      .filter((r) => filter === 'All' || r.status === filter)
      .filter(
        (r) =>
          !term ||
          r.description.toLowerCase().includes(term) ||
          r.ticket.toLowerCase().includes(term) ||
          (facility(r.facility_id)?.name ?? '').toLowerCase().includes(term),
      )
      .sort((a, b) => {
        const open = Number(a.status === 'Resolved') - Number(b.status === 'Resolved')
        return open || byUrgency(a, b) || b.created_at.localeCompare(a.created_at)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, facilities, filter, q])

  async function setStatus(r: Report, status: Status) {
    if (status === 'Resolved') return setRepairFor(r) // resolving requires a repair record
    await db.updateReport(r.id, { status })
    await refresh()
  }

  async function assign(r: Report, assigned_to: string) {
    if (assigned_to === r.assigned_to) return
    await db.updateReport(r.id, { assigned_to })
    await refresh()
  }

  async function remove(r: Report) {
    if (!isAdmin) return
    if (!confirm(`Burahin ang report #${r.ticket}?`)) return
    await db.deleteReport(r.id)
    await refresh()
  }

  if (loading) return <div className="font-bold text-slate-400">Loading…</div>

  return (
    <>
      <PageTitle
        title="Reports"
        subtitle={
          isAdmin ? 'Lahat ng na-report sa pamamagitan ng QR code.' : 'Mga report na naka-assign sa’yo.'
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`${inputClass} !rounded-full !bg-white pl-11`}
            placeholder="Hanapin ang ticket, lugar, detalye…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['All', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-black transition ${
                filter === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty>{isAdmin ? 'Walang report na tumutugma.' : 'Walang naka-assign na report na tumutugma.'}</Empty>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} className="!p-5 sm:!p-6">
              <div className="flex flex-col gap-5 md:flex-row">
                {r.photo && (
                  <button onClick={() => setPhotoOpen(r.photo)} className="shrink-0 self-start">
                    <img src={r.photo} alt="Report" className="h-28 w-28 rounded-[1.75rem] object-cover" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UrgencyBadge value={r.urgency} />
                    <StatusBadge value={r.status} />
                    <span className="font-mono text-xs font-black text-slate-400">#{r.ticket}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-slate-900">{facilityLabel(facility(r.facility_id))}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">{r.description}</p>
                  <div className="mt-2 text-xs font-bold text-slate-400">
                    {r.category} · {fmtDateTime(r.created_at)}
                    {r.reporter_name && ` · ${r.reporter_name}`}
                    {r.reporter_contact && ` (${r.reporter_contact})`}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 md:w-56">
                  <select
                    className={inputClass}
                    value={r.status}
                    onChange={(e) => void setStatus(r, e.target.value as Status)}
                    disabled={r.status === 'Resolved'}
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {isAdmin ? (
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <select
                        className={`${inputClass} pl-9`}
                        value={r.assigned_to}
                        onChange={(e) => void assign(r, e.target.value)}
                        disabled={r.status === 'Resolved'}
                      >
                        <option value="">— Hindi pa naka-assign —</option>
                        {/* keep a legacy / removed assignee visible so it is not silently dropped */}
                        {r.assigned_to && !staffNames.includes(r.assigned_to) && (
                          <option value={r.assigned_to}>{r.assigned_to}</option>
                        )}
                        {staffNames.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                      <User size={15} /> {r.assigned_to}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {r.status !== 'Resolved' && (
                      <Button onClick={() => setRepairFor(r)} className="flex-1 !px-4 !py-2.5">
                        <Hammer size={15} /> Resolve
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="danger" onClick={() => void remove(r)} className="!px-4 !py-2.5" aria-label="Delete">
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RepairModal
        report={repairFor}
        defaultTechnician={isAdmin ? '' : fullName}
        onClose={() => setRepairFor(null)}
        onSaved={async () => {
          setRepairFor(null)
          await refresh()
        }}
      />

      <Modal open={!!photoOpen} onClose={() => setPhotoOpen(null)} title="Larawan">
        {photoOpen && <img src={photoOpen} alt="Report" className="w-full rounded-[2rem]" />}
      </Modal>
    </>
  )
}

function RepairModal({
  report,
  defaultTechnician,
  onClose,
  onSaved,
}: {
  report: Report | null
  defaultTechnician: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [technician, setTechnician] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!report) return
    const amount = Number(cost || 0)
    if (!Number.isFinite(amount) || amount < 0) return setError('Hindi valid ang halaga.')
    setBusy(true)
    setError(null)
    try {
      await db.addRepair({
        report_id: report.id,
        facility_id: report.facility_id,
        description: description.trim() || report.description,
        cost: amount,
        technician: technician.trim() || defaultTechnician || report.assigned_to,
        repair_date: date,
      })
      await db.updateReport(report.id, { status: 'Resolved' })
      setDescription('')
      setCost('')
      setTechnician('')
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'May error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!report} onClose={onClose} title="I-record ang repair">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm font-medium text-slate-500">
          Mamamarkahang <b>Resolved</b> ang report at mase-save sa repair history at expenses.
        </p>
        <Field label="Ano ang ginawa">
          <textarea
            className={`${inputClass} min-h-20`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={report?.description}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gastos (₱)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Petsa">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
        </div>
        <Field label="Technician / Contractor">
          <input
            className={inputClass}
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            placeholder={defaultTechnician || report?.assigned_to || 'Pangalan'}
          />
        </Field>
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'I-save at i-resolve'}
        </Button>
      </form>
    </Modal>
  )
}
