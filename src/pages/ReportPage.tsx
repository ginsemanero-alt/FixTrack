import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Camera, CheckCircle2, MapPin, Search, ShieldCheck, Wrench, X } from 'lucide-react'
import { db } from '../lib/store'
import { compressImage } from '../lib/utils'
import { Button, Field, inputClass } from '../components/ui'
import { CATEGORIES, URGENCIES, type Category, type Facility, type Urgency } from '../types'

const urgencyHelp: Record<Urgency, string> = {
  Low: 'Pwedeng ipagpaliban',
  Medium: 'Kailangan ayusin soon',
  High: 'Nakakaabala sa klase',
  Critical: 'Delikado / emergency',
}

const urgencyActive: Record<Urgency, string> = {
  Low: 'bg-emerald-500 text-white shadow-emerald-500/30',
  Medium: 'bg-amber-500 text-white shadow-amber-500/30',
  High: 'bg-orange-500 text-white shadow-orange-500/30',
  Critical: 'bg-rose-600 text-white shadow-rose-600/30',
}

export default function ReportPage() {
  const { facilityId = '' } = useParams()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [category, setCategory] = useState<Category>('Electrical')
  const [urgency, setUrgency] = useState<Urgency>('Medium')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    db.getFacility(facilityId)
      .then((f) => {
        if (cancelled) return
        setFacility(f)
        setState(f ? 'ready' : 'missing')
      })
      .catch(() => !cancelled && setState('missing'))
    return () => {
      cancelled = true
    }
  }, [facilityId])

  async function onPhoto(file?: File) {
    if (!file) return
    try {
      setPhoto(await compressImage(file))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo error')
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!facility) return
    if (description.trim().length < 5) {
      setError('Pakilagay ang detalye ng problema (kahit maikli).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const report = await db.addReport({
        facility_id: facility.id,
        reporter_name: name.trim(),
        reporter_contact: contact.trim(),
        category,
        description: description.trim(),
        urgency,
        photo,
      })
      setDone(report.ticket)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hindi na-submit. Subukan ulit.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setDone(null)
    setDescription('')
    setPhoto(null)
    setUrgency('Medium')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-indigo-500 to-slate-100 px-4 pb-16 pt-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
              <Wrench size={20} />
            </span>
            <span className="text-lg font-black tracking-tight">FixTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/track"
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-black hover:bg-white/30"
            >
              <Search size={13} /> Track a report
            </Link>
            <Link to="/login" className="text-xs font-bold text-white/70 hover:text-white">
              Staff login
            </Link>
          </div>
        </div>

        {state === 'loading' && (
          <div className="rounded-[3.5rem] bg-white p-10 text-center font-bold text-slate-400">Loading…</div>
        )}

        {state === 'missing' && (
          <div className="rounded-[3.5rem] bg-white p-10 text-center shadow-xl">
            <h1 className="text-2xl font-black text-slate-900">Hindi mahanap ang lokasyon</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Maaaring luma o hindi na valid ang QR code. Sabihan ang maintenance office.
            </p>
          </div>
        )}

        {state === 'ready' && facility && done && (
          <div className="rounded-[3.5rem] bg-white p-8 text-center shadow-xl sm:p-10">
            <CheckCircle2 className="mx-auto text-emerald-500" size={64} />
            <h1 className="mt-4 text-3xl font-black text-slate-900">Na-report na!</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Natanggap na ng maintenance team ang report mo para sa <b>{facility.name}</b>.
            </p>
            <div className="mt-6 rounded-[2rem] bg-slate-100 p-5">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Ticket number
              </div>
              <div className="mt-1 font-mono text-3xl font-black tracking-widest text-indigo-600">{done}</div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              I-save ang number na ito para makita mo ang status ng report mo.
            </p>
            <Link
              to={`/track/${encodeURIComponent(done)}`}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95"
            >
              <Search size={16} /> Track a report
            </Link>
            <Button variant="ghost" onClick={reset} className="mt-3 w-full">
              Mag-report ng isa pa
            </Button>
          </div>
        )}

        {state === 'ready' && facility && !done && (
          <form onSubmit={submit} className="rounded-[3.5rem] bg-white p-6 shadow-xl sm:p-9">
            <div className="mb-6 flex items-start gap-3 rounded-[2rem] bg-indigo-50 p-4">
              <MapPin className="mt-0.5 shrink-0 text-indigo-600" size={22} />
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                  Nagre-report para sa
                </div>
                <div className="text-lg font-black leading-tight text-slate-900">{facility.name}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {[facility.type, facility.building, facility.floor].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>

            <h1 className="mb-5 text-2xl font-black tracking-tight text-slate-900">Anong sira?</h1>

            <div className="space-y-5">
              <Field label="Uri ng problema">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        category === c
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Detalye">
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  placeholder="Hal. Tumutulo ang gripo sa likod ng room…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={600}
                  required
                />
              </Field>

              <Field label="Gaano kaurgent?">
                <div className="grid grid-cols-2 gap-2">
                  {URGENCIES.map((u) => (
                    <button
                      type="button"
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`rounded-[1.5rem] px-4 py-3 text-left transition ${
                        urgency === u
                          ? `${urgencyActive[u]} shadow-lg`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <div className="text-sm font-black">{u}</div>
                      <div className={`text-[11px] font-semibold ${urgency === u ? 'opacity-90' : 'text-slate-400'}`}>
                        {urgencyHelp[u]}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Larawan (optional)">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void onPhoto(e.target.files?.[0])}
                />
                {photo ? (
                  <div className="relative overflow-hidden rounded-[2rem]">
                    <img src={photo} alt="Preview" className="max-h-56 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white"
                      aria-label="Remove photo"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-slate-300 py-6 text-sm font-black text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                  >
                    <Camera size={20} /> Kumuha / pumili ng larawan
                  </button>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pangalan (optional)">
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Contact (optional)">
                  <input
                    className={inputClass}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email / cellphone"
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>
            )}

            <Button type="submit" disabled={busy} className="mt-6 w-full py-4 text-base">
              {busy ? 'Sinusubmit…' : 'I-submit ang report'}
            </Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-400">
              <ShieldCheck size={14} /> Hindi kailangan mag-login
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
