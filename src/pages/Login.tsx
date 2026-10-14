import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wrench } from 'lucide-react'
import { DEMO_ACCOUNTS, useAuth } from '../lib/auth'
import { hasSupabase } from '../lib/supabase'
import { Button, Field, inputClass } from '../components/ui'

export default function Login() {
  const { user, signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState(hasSupabase ? '' : DEMO_ACCOUNTS[0].email)
  const [password, setPassword] = useState(hasSupabase ? '' : DEMO_ACCOUNTS[0].password)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const err = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
    else nav('/admin', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-600 p-4">
      {/* drifting background blobs */}
      <div aria-hidden="true" className="anim-blob pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/40 blur-3xl" />
      <div
        aria-hidden="true"
        style={{ animationDelay: '-6s' }}
        className="anim-blob pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-amber-400/25 blur-3xl"
      />

      <Link
        to="/"
        className="anim-fade-up absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 active:scale-95 sm:left-8 sm:top-8"
      >
        <ArrowLeft size={18} /> Bumalik
      </Link>

      <form onSubmit={submit} className="anim-pop relative w-full max-w-md rounded-[3.5rem] bg-white p-8 shadow-2xl sm:p-10">
        <div className="anim-wobble mb-6 flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-600 text-white shadow-lg shadow-indigo-600/40">
          <Wrench size={26} />
        </div>
        <h1 style={{ animationDelay: '150ms' }} className="anim-fade-up text-3xl font-black tracking-tight text-slate-900">Staff login</h1>
        <p style={{ animationDelay: '230ms' }} className="anim-fade-up mt-1 text-sm font-medium text-slate-500">Para sa admin at maintenance staff.</p>

        <div style={{ animationDelay: '320ms' }} className="anim-fade-up mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        </div>

        {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}

        <Button type="submit" disabled={busy} style={{ animationDelay: '420ms' }} className="anim-fade-up mt-6 w-full py-4">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        {!hasSupabase && (
          <div style={{ animationDelay: '520ms' }} className="anim-fade-up mt-5 rounded-[2rem] bg-amber-50 p-4 text-xs font-semibold text-amber-700">
            <p>Demo mode (walang Supabase). Naka-save ang data sa browser na ito. I-click ang account para i-fill:</p>
            <ul className="mt-2 space-y-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(a.email)
                      setPassword(a.password)
                      setError(null)
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-full bg-white/70 px-4 py-2 text-left hover:bg-white"
                  >
                    <span className="min-w-0 truncate">
                      <b className="font-black">{a.email}</b> / {a.password}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      {a.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  )
}
