import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useI18n, type TKey } from '../lib/i18n'
import type { Category, Status, Urgency } from '../types'
import { QRCodeSVG } from 'qrcode.react'
import { Bell, ClipboardList, Clock, LayoutDashboard, QrCode, Wallet, Wrench } from 'lucide-react'

// HashRouter uses the URL hash for routing, so in-page anchors are scrolled to manually.
function scrollTo(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const display = 'font-display font-black tracking-tight'

const steps: { n: string; title: TKey; text: TKey }[] = [
  { n: '01', title: 'land.step1.title', text: 'land.step1.text' },
  { n: '02', title: 'land.step2.title', text: 'land.step2.text' },
  { n: '03', title: 'land.step3.title', text: 'land.step3.text' },
]

const features: { icon: ReactNode; title: TKey; text: TKey; tone: string; sub: string }[] = [
  {
    icon: <QrCode size={40} />,
    title: 'land.f1.title',
    text: 'land.f1.text',
    tone: 'bg-indigo-600 text-white',
    sub: 'text-indigo-100',
  },
  {
    icon: <ClipboardList size={40} className="text-indigo-600" />,
    title: 'land.f2.title',
    text: 'land.f2.text',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <LayoutDashboard size={40} className="text-indigo-600" />,
    title: 'land.f3.title',
    text: 'land.f3.text',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <Clock size={40} className="text-indigo-600" />,
    title: 'land.f4.title',
    text: 'land.f4.text',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <Wallet size={40} className="text-amber-400" />,
    title: 'land.f5.title',
    text: 'land.f5.text',
    tone: 'bg-slate-900 text-white',
    sub: 'text-slate-300',
  },
  {
    icon: <Bell size={40} className="text-amber-950" />,
    title: 'land.f6.title',
    text: 'land.f6.text',
    tone: 'bg-amber-400 text-amber-950',
    sub: 'text-amber-900',
  },
]

// Sample rows for the dashboard preview. Place and staff names are demo data and stay as-is.
const rows: {
  place: string
  text: TKey
  category: Category
  assignee?: string
  cost?: string
  urgency: Urgency
  urgencyTone: string
  status: Status
  statusTone: string
}[] = [
  {
    place: 'Grade 12 - Rizal',
    text: 'land.prev.r1',
    category: 'Electrical',
    urgency: 'High',
    urgencyTone: 'bg-orange-100 text-orange-700',
    status: 'Pending',
    statusTone: 'bg-amber-100 text-amber-700',
  },
  {
    place: 'Boys Restroom A',
    text: 'land.prev.r2',
    category: 'Plumbing',
    assignee: 'Mang Tonyo',
    urgency: 'Critical',
    urgencyTone: 'bg-rose-100 text-rose-700',
    status: 'In Progress',
    statusTone: 'bg-sky-100 text-sky-700',
  },
  {
    place: 'Gymnasium',
    text: 'land.prev.r3',
    category: 'Electrical',
    assignee: 'Electrician Dan',
    cost: '₱7,400',
    urgency: 'Medium',
    urgencyTone: 'bg-amber-100 text-amber-700',
    status: 'Resolved',
    statusTone: 'bg-emerald-100 text-emerald-700',
  },
]

const badge = 'rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider'
const eyebrow = 'text-[13px] font-black uppercase tracking-[0.1em] text-indigo-600'
const h2 = `${display} text-balance text-4xl leading-none sm:text-5xl lg:text-6xl`

export default function Landing() {
  const { t } = useI18n()
  // A real QR pointing at the staff login of whichever site this is deployed on.
  const qrValue = `${window.location.origin}${window.location.pathname}#/login`

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 font-sans text-slate-900">
      {/* NAV */}
      <header className="anim-fade-up mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <a href="#top" onClick={scrollTo('top')} className="flex items-center gap-3">
          <span className="anim-wobble flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
            <Wrench size={22} />
          </span>
          <span className={`${display} text-2xl`}>FixTrack</span>
        </a>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-bold text-slate-600">
          <a href="#how" onClick={scrollTo('how')} className="hover:text-slate-900">{t('land.nav.how')}</a>
          <a href="#features" onClick={scrollTo('features')} className="hover:text-slate-900">{t('land.nav.features')}</a>
          <a href="#preview" onClick={scrollTo('preview')} className="hover:text-slate-900">{t('land.nav.preview')}</a>
          <a href="#audience" onClick={scrollTo('audience')} className="hover:text-slate-900">{t('land.nav.audience')}</a>
          <LanguageSwitcher tone="light" />
          <Link to="/login" className="rounded-full bg-slate-900 px-6 py-3 font-black text-white hover:bg-slate-700">
            {t('common.staffLogin')}
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-14 px-6 pb-20 pt-14">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col items-start gap-7">
          <span style={{ animationDelay: '100ms' }} className="anim-fade-up rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-amber-950">
            {t('brand.tagline')}
          </span>
          <h1 style={{ animationDelay: '220ms' }} className={`anim-fade-up ${display} text-[clamp(52px,8vw,100px)] leading-[0.92] tracking-[-0.035em]`}>
            {t('land.hero.l1')}<br />{t('land.hero.l2')}<br /><span className="text-indigo-600">{t('land.hero.l3')}</span>
          </h1>
          <p style={{ animationDelay: '380ms' }} className="anim-fade-up max-w-[520px] text-xl leading-relaxed text-slate-600">
            {t('land.hero.text')}
          </p>
          <div style={{ animationDelay: '520ms' }} className="anim-fade-up flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full bg-indigo-600 px-8 py-[18px] text-base font-black text-white shadow-xl shadow-indigo-600/40 transition hover:bg-indigo-700 active:scale-95"
            >
              {t('land.hero.demo')}
            </Link>
            <a
              href="#how"
              onClick={scrollTo('how')}
              className="rounded-full bg-white px-8 py-[18px] text-base font-black text-slate-900 ring-2 ring-inset ring-slate-300 transition hover:bg-slate-50 active:scale-95"
            >
              {t('land.hero.how')}
            </a>
          </div>
        </div>

        {/* QR card + phone */}
        <div className="flex min-w-0 flex-[1_1_400px] justify-center">
          <div style={{ animationDelay: '300ms' }} className="anim-pop flex w-full max-w-[520px] flex-wrap items-center justify-center gap-7 rounded-[3.5rem] bg-slate-900 px-6 py-10">
            <div style={{ '--r': '-4deg' } as React.CSSProperties} className="anim-float flex w-[190px] flex-col items-center gap-3 rounded-[2rem] bg-white p-[18px]">
              <QRCodeSVG value={qrValue} size={150} level="M" marginSize={0} />
              <div className="text-center leading-tight">
                <div className={`${display} text-[17px]`}>Grade 12 - Rizal</div>
                <div className="mt-1 text-[11px] font-bold text-slate-500">{t('qr.scan')}</div>
              </div>
            </div>

            <div className="anim-float-slow flex w-[248px] max-w-full flex-col gap-3 rounded-[2.5rem] bg-white px-4 pb-5 pt-[18px] ring-[6px] ring-slate-800">
              <div className="rounded-[1.4rem] bg-indigo-50 px-3.5 py-3">
                <div className="text-[9px] font-black uppercase tracking-[0.08em] text-indigo-500">{t('land.mock.reportingFor')}</div>
                <div className={`${display} mt-0.5 text-[17px] leading-tight`}>Grade 12 - Rizal</div>
                <div className="text-[11px] font-semibold text-slate-500">{t('ftype.Classroom')} · Main Building · 2nd Floor</div>
              </div>
              <div className={`${display} text-xl`}>{t('land.mock.question')}</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-black text-white">{t('category.Electrical')}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">{t('category.Plumbing')}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">{t('category.Furniture')}</span>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-semibold leading-snug text-slate-700">
                {t('land.mock.text')}
              </div>
              <div className="flex gap-1.5">
                <span className="flex-1 rounded-[0.9rem] bg-slate-100 py-2 text-center text-[11px] font-black text-slate-500">{t('urgency.Medium')}</span>
                <span className="flex-1 rounded-[0.9rem] bg-orange-500 py-2 text-center text-[11px] font-black text-white">{t('urgency.High')}</span>
              </div>
              <div className="rounded-full bg-indigo-600 py-3 text-center text-sm font-black text-white">{t('land.mock.submit')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* maintenance tape */}
      <div
        aria-hidden="true"
        className="anim-tape h-5"
        style={{ background: 'repeating-linear-gradient(-45deg,#fbbf24 0,#fbbf24 18px,#0f172a 18px,#0f172a 36px)' }}
      />

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap gap-6 px-6 pb-6 pt-[88px]">
        <Reveal className="flex min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-[3.5rem] bg-slate-900 p-8 text-white sm:p-12">
          <span className={`${badge} self-start bg-rose-700 text-white`}>{t('land.problem.badge')}</span>
          <h2 className={`${display} text-balance text-3xl leading-[1.05] sm:text-4xl lg:text-[44px]`}>
            {t('land.problem.title')}
          </h2>
          <ul className="flex flex-col gap-4 text-lg text-slate-300">
            <li className="flex gap-3.5"><span className="font-black text-rose-400">✕</span>{t('land.problem.p1')}</li>
            <li className="flex gap-3.5"><span className="font-black text-rose-400">✕</span>{t('land.problem.p2')}</li>
          </ul>
        </Reveal>
        <Reveal delay={120} className="flex min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-[3.5rem] bg-indigo-600 p-8 text-white sm:p-12">
          <span className={`${badge} self-start bg-white text-indigo-800`}>{t('land.solution.badge')}</span>
          <h2 className={`${display} text-balance text-3xl leading-[1.05] sm:text-4xl lg:text-[44px]`}>
            {t('land.solution.title')}
          </h2>
          <ul className="flex flex-col gap-4 text-lg">
            <li className="flex gap-3.5"><span className="font-black text-amber-200">✓</span>{t('land.solution.s1')}</li>
            <li className="flex gap-3.5"><span className="font-black text-amber-200">✓</span>{t('land.solution.s2')}</li>
          </ul>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-24">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>{t('land.how.eyebrow')}</span>
          <h2 className={h2}>{t('land.how.title')}</h2>
        </Reveal>
        <div className="flex flex-wrap gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-[3rem] bg-white p-9 ring-1 ring-slate-200">
              <span className="font-mono text-[44px] font-bold leading-none text-indigo-600">{s.n}</span>
              <h3 className={`${display} text-[28px]`}>{t(s.title)}</h3>
              <p className="text-slate-600">{t(s.text)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>{t('land.feat.eyebrow')}</span>
          <h2 className={h2}>{t('land.feat.title')}</h2>
        </Reveal>
        <div className="flex flex-wrap gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 110} className={`flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-[3.5rem] p-9 ${f.tone}`}>
              {f.icon}
              <h3 className={`${display} text-[26px]`}>{t(f.title)}</h3>
              <p className={f.sub}>{t(f.text)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="preview" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>{t('land.prev.eyebrow')}</span>
          <h2 className={h2}>{t('land.prev.title')}</h2>
          <p className="text-slate-600">{t('land.prev.note')}</p>
        </Reveal>

        <Reveal className="flex flex-col gap-5 rounded-[4rem] bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-wrap gap-4">
            {[
              ['Pending', '1', 'bg-amber-400 text-amber-950'],
              ['In Progress', '2', 'bg-sky-500 text-sky-950'],
              ['Resolved', '3', 'bg-emerald-500 text-emerald-950'],
            ].map(([label, value, tone]) => (
              <div key={label} className={`min-w-0 flex-[1_1_200px] rounded-[2.25rem] p-6 ${tone}`}>
                <div className="text-[11px] font-black uppercase tracking-[0.08em]">{t(`status.${label}` as TKey)}</div>
                <div className={`${display} text-[52px] leading-[1.1]`}>{value}</div>
              </div>
            ))}
            <div className="min-w-0 flex-[1_1_200px] rounded-[2.25rem] bg-white p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">{t('land.prev.total')}</div>
              <div className={`${display} text-[40px] leading-[1.35] tabular-nums`}>₱12,450</div>
            </div>
          </div>

          <div className="rounded-[2.75rem] bg-white px-7 py-3">
            {rows.map((r, i) => (
              <div
                key={r.place}
                className={`flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 py-5 ${i < rows.length - 1 ? 'border-b border-slate-200' : ''}`}
              >
                <div className="min-w-0 flex-[1_1_280px]">
                  <div className="text-lg font-black">{r.place}</div>
                  <div className="text-sm text-slate-600">{t(r.text)}</div>
                  <div className="mt-0.5 text-xs font-bold text-slate-400">
                    {[t(`category.${r.category}`), r.assignee && (r.status === 'Resolved' ? r.assignee : t('land.prev.assignedTo', { name: r.assignee })), r.cost]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`${badge} ${r.urgencyTone}`}>{t(`urgency.${r.urgency}` as TKey)}</span>
                  <span className={`${badge} ${r.statusTone}`}>{t(`status.${r.status}` as TKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>{t('land.aud.eyebrow')}</span>
          <h2 className={h2}>{t('land.aud.title')}</h2>
        </Reveal>
        <div className="flex flex-wrap gap-5">
          <Reveal className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-[3.5rem] bg-white p-8 ring-1 ring-slate-200 sm:p-11">
            <span className={`${badge} self-start bg-emerald-100 text-emerald-700`}>{t('land.a1.badge')}</span>
            <h3 className={`${display} text-[32px] leading-[1.05]`}>{t('land.a1.title')}</h3>
            <p className="text-slate-600">
              {t('land.a1.text')}
            </p>
          </Reveal>
          <Reveal delay={120} className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-[3.5rem] bg-slate-900 p-8 text-white sm:p-11">
            <span className={`${badge} self-start bg-amber-400 text-amber-950`}>{t('land.a2.badge')}</span>
            <h3 className={`${display} text-[32px] leading-[1.05]`}>{t('land.a2.title')}</h3>
            <p className="text-slate-300">
              {t('land.a2.text')}
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-[1200px] px-6 pb-14 pt-28">
        <Reveal className="flex flex-col items-center gap-7 rounded-[4rem] bg-indigo-600 px-10 py-[72px] text-center text-white">
          <h2 className={`${display} max-w-3xl text-balance text-[clamp(40px,6vw,76px)] leading-[0.98] tracking-[-0.035em]`}>
            {t('land.cta.title')}
          </h2>
          <p className="max-w-[540px] text-[19px] text-indigo-100">
            {t('land.cta.text')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login" className="rounded-full bg-amber-400 px-9 py-[18px] text-base font-black text-amber-950 transition hover:bg-amber-300 active:scale-95">
              {t('land.cta.open')}
            </Link>
            <a
              href="#how"
              onClick={scrollTo('how')}
              className="rounded-full bg-white/15 px-9 py-[18px] text-base font-black text-white transition hover:bg-white/25 active:scale-95"
            >
              {t('land.hero.how')}
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 pb-12 text-sm font-semibold text-slate-500">
        <span><b className="font-black text-slate-900">FixTrack</b> · {t('brand.tagline')}</span>
        <span>{t('land.footer.capstone')} · {t('land.footer.placeholder')}</span>
      </footer>
    </div>
  )
}
