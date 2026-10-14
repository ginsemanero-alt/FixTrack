import { useRef, useState, type FormEvent } from 'react'
import { Download, Link2, Plus, Printer, Trash2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { db } from '../lib/store'
import { useAdminData } from '../lib/useAdminData'
import { reportUrl } from '../lib/utils'
import { Badge, Button, Card, Empty, Field, Modal, PageTitle, inputClass } from '../components/ui'
import { FACILITY_TYPES, type Facility, type FacilityType } from '../types'

export default function Facilities() {
  const { facilities, reports, refresh, loading } = useAdminData()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  function download(f: Facility) {
    const canvas = wrapRef.current?.querySelector<HTMLCanvasElement>(`canvas[data-id="${f.id}"]`)
    if (!canvas) return
    // Compose a printable label: QR + facility name.
    const pad = 40
    const out = document.createElement('canvas')
    out.width = canvas.width + pad * 2
    out.height = canvas.height + pad * 2 + 90
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, out.width, out.height)
    ctx.drawImage(canvas, pad, pad)
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'center'
    ctx.font = '800 34px Inter, sans-serif'
    ctx.fillText(f.name, out.width / 2, canvas.height + pad + 50, out.width - pad)
    ctx.fillStyle = '#64748b'
    ctx.font = '600 22px Inter, sans-serif'
    ctx.fillText('Scan to report a problem', out.width / 2, canvas.height + pad + 84)
    const a = document.createElement('a')
    a.href = out.toDataURL('image/png')
    a.download = `QR-${f.name.replace(/[^\w]+/g, '_')}.png`
    a.click()
  }

  async function copy(f: Facility) {
    try {
      await navigator.clipboard.writeText(reportUrl(f.id))
      setCopied(f.id)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      prompt('Copy this link:', reportUrl(f.id))
    }
  }

  async function remove(f: Facility) {
    if (!confirm(`Burahin ang "${f.name}"? Mabubura rin ang mga report at repair records nito.`)) return
    await db.deleteFacility(f.id)
    await refresh()
  }

  if (loading) return <div className="font-bold text-slate-400">Loading…</div>

  return (
    <>
      <PageTitle
        title="Facilities & QR codes"
        subtitle="Bawat classroom o facility ay may sariling QR code na i-print at idikit."
        action={
          <div className="no-print flex gap-2">
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print lahat
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add facility
            </Button>
          </div>
        }
      />

      {facilities.length === 0 ? (
        <Empty>Wala pang facility. Mag-add para makagawa ng QR code.</Empty>
      ) : (
        <div ref={wrapRef} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {facilities.map((f) => {
            const count = reports.filter((r) => r.facility_id === f.id).length
            return (
              <Card key={f.id} className="break-inside-avoid !rounded-[3.5rem] text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-[2rem] bg-white p-3 ring-4 ring-slate-100">
                    <QRCodeCanvas
                      data-id={f.id}
                      value={reportUrl(f.id)}
                      size={180}
                      level="M"
                      marginSize={1}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-black leading-tight text-slate-900">{f.name}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {[f.building, f.floor].filter(Boolean).join(' · ') || '—'}
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-700 ring-indigo-300">{f.type}</Badge>
                  <Badge className="bg-slate-100 text-slate-600 ring-slate-300">{count} reports</Badge>
                </div>
                <div className="no-print mt-5 grid grid-cols-3 gap-2">
                  <Button variant="dark" onClick={() => download(f)} className="!px-3 !py-2.5" title="Download PNG">
                    <Download size={15} />
                  </Button>
                  <Button variant="ghost" onClick={() => void copy(f)} className="!px-3 !py-2.5" title="Copy link">
                    {copied === f.id ? '✓' : <Link2 size={15} />}
                  </Button>
                  <Button variant="danger" onClick={() => void remove(f)} className="!px-3 !py-2.5" title="Delete">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AddModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={async () => {
          setOpen(false)
          await refresh()
        }}
      />
    </>
  )
}

function AddModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<FacilityType>('Classroom')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await db.addFacility({ name: name.trim(), type, building: building.trim(), floor: floor.trim() })
      setName('')
      setBuilding('')
      setFloor('')
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'May error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add facility">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Pangalan">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hal. Grade 10 - Mabini"
            required
          />
        </Field>
        <Field label="Uri">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as FacilityType)}>
            {FACILITY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Building">
            <input className={inputClass} value={building} onChange={(e) => setBuilding(e.target.value)} />
          </Field>
          <Field label="Floor">
            <input className={inputClass} value={floor} onChange={(e) => setFloor(e.target.value)} />
          </Field>
        </div>
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'I-save at gumawa ng QR'}
        </Button>
      </form>
    </Modal>
  )
}
