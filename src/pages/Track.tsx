import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, Hammer, MapPin, Search, User, Wrench } from 'lucide-react'
import { db, normalizeTicket } from '../lib/store'
import { fmtDateTime } from '../lib/utils'
import { Badge, Button, Field, StatusBadge, UrgencyBadge, inputClass } from '../components/ui'
import type { Status, TrackedReport } from '../types'

const steps: { status: Status; label: string; icon: typeof Clock }[] = [
  { status: 'Pending', label: 'Natanggap', icon: Clock },
  { status: 'In Progress', label: 'Inaayos', icon: Hammer },
  { status: 'Resolved', label: 'Tapos na', icon: CheckCircle2 },
]

const stepTone: Record<Status, string> = {
  Pending: 'bg-amber-400 text-amber-950',
  'In Progress': 'bg-sky-500 text-white',
  Resolved: 'bg-emerald-500 text-white',
}

const blurb: Record<Status, string> = {
  Pending: 'Natanggap na ang report mo. Hinihintay pang ma-assign o masimulan.',
  'In Progress': 'Inaayos na ng maintenance team ang problema.',
  Resolved: 'Naayos na! Salamat sa pag-report.',
}

type LookupState = 'idle' | 'loading' | 'found' | 'missing' | 'error'

export default function Track() {
  const { ticket: param = '' } = useParams()
  const nav = useNavigate()
  const [input, setInput] = useState(param)
  const [result, setResult] = useState<TrackedReport | null>(null)
  const [state, setState] = useState<LookupState>(param ? 'loading' : 'idle')

  const lookup = useCallback(async (code: string, isCancelled: () => boolean = () => false) => {
    setState('loading')
    try {
      const r = await db.trackReport(code)
      if (isCancelled()) return
      setResult(r)
      setState(r ? 'found' : 'missing')
    } catch {
      if (!isCancelled()) setState('error')
    }
  }, [])

  // Runs for /track/:ticket (including QR-less direct links and the Track link on the success screen).
  useEffect(() => {
    const code = normalizeTicket(param)
    if (!code) return
    let cancelled = false
    void lookup(code, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [param, lookup])

  function submit(e: FormEvent) {
    e.preventDefault()
    const code = normalizeTicket(input)
    if (!code) return
    setInput(code)
    if (code === normalizeTicket(param)) void lookup(code) // same ticket: just refresh the status
    else nav(`/track/${encodeURIComponent(code)}`)
  }

  const current = result ? steps.findIndex((s) => s.status === result.status) : -1

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
          <Link to="/login" className="text-xs font-bold text-white/70 hover:text-white">
            Staff login
          </Link>
        </div>

        <form onSubmit={submit} className="rounded-[3.5rem] bg-white p-6 shadow-xl sm:p-9">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">I-track ang report</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ilagay ang ticket number na natanggap mo pagkatapos mag-report.
          </p>
          <div className="mt-5">
            <Field label="Ticket number">
              <input
                className={`${inputClass} font-mono text-lg font-black uppercase tracking-widest`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hal. A1B2C3D4"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </Field>
          </div>
          <Button type="submit" disabled={state === 'loading'} className="mt-5 w-full py-4 text-base">
            <Search size={18} /> {state === 'loading' ? 'Hinahanap…' : 'Hanapin'}
          </Button>
        </form>

        {state === 'missing' && (
          <div className="mt-6 rounded-[3.5rem] bg-white p-8 text-center shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">Walang nahanap</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Walang report na may ticket na <b className="font-mono">{normalizeTicket(param)}</b>. Check ulit kung
              tama ang pagkakasulat.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6 rounded-[3.5rem] bg-white p-8 text-center shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">May problema</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Hindi ma-check ang ticket ngayon. Subukan ulit mamaya.
            </p>
          </div>
        )}

        {state === 'found' && result && (
          <div className="mt-6 rounded-[3.5rem] bg-white p-6 shadow-xl sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-2xl font-black tracking-widest text-indigo-600">{result.ticket}</span>
              <StatusBadge value={result.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">{blurb[result.status]}</p>

            <ol className="mt-6 grid grid-cols-3 gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon
                const reached = i <= current
                return (
                  <li
                    key={s.status}
                    className={`flex flex-col items-center gap-1.5 rounded-[2rem] px-2 py-4 text-center ${
                      reached ? stepTone[s.status] : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-black uppercase tracking-wider">{s.label}</span>
                  </li>
                )
              })}
            </ol>

            <div className="mt-6 flex items-start gap-3 rounded-[2rem] bg-indigo-50 p-4">
              <MapPin className="mt-0.5 shrink-0 text-indigo-600" size={22} />
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-indigo-400">Lokasyon</div>
                <div className="text-lg font-black leading-tight text-slate-900">{result.facility_name}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {[result.facility_building, result.facility_floor].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[2rem] bg-slate-50 p-4">
                <dt className="text-[11px] font-black uppercase tracking-wider text-slate-400">Uri</dt>
                <dd className="mt-1 text-sm font-black text-slate-900">{result.category}</dd>
              </div>
              <div className="rounded-[2rem] bg-slate-50 p-4">
                <dt className="text-[11px] font-black uppercase tracking-wider text-slate-400">Urgency</dt>
                <dd className="mt-1">
                  <UrgencyBadge value={result.urgency} />
                </dd>
              </div>
              <div className="col-span-2 rounded-[2rem] bg-slate-50 p-4">
                <dt className="text-[11px] font-black uppercase tracking-wider text-slate-400">Naka-assign kay</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-black text-slate-900">
                  <User size={16} className="text-slate-400" />
                  {result.assigned_to || (
                    <Badge className="bg-slate-100 text-slate-500 ring-slate-300">Hindi pa naka-assign</Badge>
                  )}
                </dd>
              </div>
            </dl>

            <ul className="mt-4 space-y-2 text-sm font-bold text-slate-600">
              <li className="flex justify-between gap-3">
                <span className="text-slate-400">Na-report</span>
                <span>{fmtDateTime(result.created_at)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-slate-400">Huling update</span>
                <span>{fmtDateTime(result.updated_at)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-slate-400">Naayos</span>
                <span>{result.resolved_at ? fmtDateTime(result.resolved_at) : '—'}</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
