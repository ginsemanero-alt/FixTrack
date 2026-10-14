import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
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

const steps = [
  {
    n: '01',
    title: 'I-scan ang QR',
    text: 'Nakadikit ang QR sa bawat classroom o facility. Pag na-scan, bubukas ang form na may lokasyon na. Hindi kailangan ng account.',
  },
  {
    n: '02',
    title: 'I-report ang sira',
    text: 'Piliin ang uri ng problema, isulat ang detalye, itakda kung gaano ka-urgent, at magdagdag ng larawan. Ticket number ang ibabalik sa nag-report.',
  },
  {
    n: '03',
    title: 'Ayusin at itala',
    text: 'Ina-assign ang report sa staff. Pag tapos, itinatala ang ginawa, ang technician, at ang gastos. Napupunta ito sa repair history ng facility.',
  },
]

const features: { icon: ReactNode; title: string; text: string; tone: string; sub: string }[] = [
  {
    icon: <QrCode size={40} />,
    title: 'QR code generator',
    text: 'May sariling QR ang bawat facility. I-download bilang PNG na may pangalan ng lugar, kopyahin ang link, o i-print lahat nang sabay.',
    tone: 'bg-indigo-600 text-white',
    sub: 'text-indigo-100',
  },
  {
    icon: <ClipboardList size={40} className="text-indigo-600" />,
    title: 'Report form na walang login',
    text: 'Naka-prefill ang lokasyon. May uri ng sira, detalye, urgency mula Low hanggang Critical, at larawan na kinukunan mismo sa cellphone.',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <LayoutDashboard size={40} className="text-indigo-600" />,
    title: 'Maintenance dashboard',
    text: 'Bilang ng Pending, In Progress, at Resolved na report. Nauuna sa listahan ang pinaka-urgent, para alam agad kung ano ang uunahin.',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <Clock size={40} className="text-indigo-600" />,
    title: 'Repair history',
    text: 'Timeline ng mga naayos na sa bawat facility: ano ang ginawa, sino ang gumawa, kailan, at magkano. May CSV export.',
    tone: 'bg-white text-slate-900 ring-1 ring-slate-200',
    sub: 'text-slate-600',
  },
  {
    icon: <Wallet size={40} className="text-amber-400" />,
    title: 'Expense tracking',
    text: 'Buwanang chart ng gastos sa repair, kasama ang total kada facility at kada uri ng sira. Piliin ang taon, i-print o i-export.',
    tone: 'bg-slate-900 text-white',
    sub: 'text-slate-300',
  },
  {
    icon: <Bell size={40} className="text-amber-950" />,
    title: 'Alert sa bagong report',
    text: 'May lalabas na abiso at badge sa dashboard kapag may bagong report, kaya hindi ito natatabunan.',
    tone: 'bg-amber-400 text-amber-950',
    sub: 'text-amber-900',
  },
]

const rows = [
  {
    place: 'Grade 12 - Rizal',
    text: 'Dalawang ceiling fan ang hindi gumagana at kumukurap ang isang ilaw.',
    meta: 'Electrical',
    urgency: ['High', 'bg-orange-100 text-orange-700'],
    status: ['Pending', 'bg-amber-100 text-amber-700'],
  },
  {
    place: 'Boys Restroom A',
    text: 'Tumutulo ang gripo at basa ang sahig.',
    meta: 'Plumbing · Naka-assign kay Mang Tonyo',
    urgency: ['Critical', 'bg-rose-100 text-rose-700'],
    status: ['In progress', 'bg-sky-100 text-sky-700'],
  },
  {
    place: 'Gymnasium',
    text: 'Pinalitan ang 2 LED floodlight.',
    meta: 'Electrical · Electrician Dan · ₱7,400',
    urgency: ['Medium', 'bg-amber-100 text-amber-700'],
    status: ['Resolved', 'bg-emerald-100 text-emerald-700'],
  },
]

const badge = 'rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider'
const eyebrow = 'text-[13px] font-black uppercase tracking-[0.1em] text-indigo-600'
const h2 = `${display} text-balance text-4xl leading-none sm:text-5xl lg:text-6xl`

export default function Landing() {
  // A real QR pointing at the staff login of whichever site this is deployed on.
  const qrValue = `${window.location.origin}${window.location.pathname}#/login`

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 font-sans text-slate-900">
      {/* NAV */}
      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <a href="#top" onClick={scrollTo('top')} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
            <Wrench size={22} />
          </span>
          <span className={`${display} text-2xl`}>FixTrack</span>
        </a>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[15px] font-bold text-slate-600">
          <a href="#how" onClick={scrollTo('how')} className="hover:text-slate-900">Paano gumagana</a>
          <a href="#features" onClick={scrollTo('features')} className="hover:text-slate-900">Features</a>
          <a href="#preview" onClick={scrollTo('preview')} className="hover:text-slate-900">Dashboard</a>
          <a href="#audience" onClick={scrollTo('audience')} className="hover:text-slate-900">Para kanino</a>
          <Link to="/login" className="rounded-full bg-slate-900 px-6 py-3 font-black text-white hover:bg-slate-700">
            Staff login
          </Link>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-14 px-6 pb-20 pt-14">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col items-start gap-7">
          <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-amber-950">
            School Facility Maintenance and Repair Management
          </span>
          <h1 className={`${display} text-[clamp(52px,8vw,100px)] leading-[0.92] tracking-[-0.035em]`}>
            Scan.<br />Report.<br /><span className="text-indigo-600">Ayusin.</span>
          </h1>
          <p className="max-w-[520px] text-xl leading-relaxed text-slate-600">
            Bawat classroom at facility ay may sariling QR code. I-scan ito para agad maiulat ang sira. Makikita ng
            maintenance team kung ano ang aayusin, kailan ito naayos, at magkano ang nagastos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full bg-indigo-600 px-8 py-[18px] text-base font-black text-white shadow-xl shadow-indigo-600/40 transition hover:bg-indigo-700 active:scale-95"
            >
              Subukan ang demo
            </Link>
            <a
              href="#how"
              onClick={scrollTo('how')}
              className="rounded-full bg-white px-8 py-[18px] text-base font-black text-slate-900 ring-2 ring-inset ring-slate-300 transition hover:bg-slate-50 active:scale-95"
            >
              Paano ito gumagana
            </a>
          </div>
        </div>

        {/* QR card + phone */}
        <div className="flex min-w-0 flex-[1_1_400px] justify-center">
          <div className="flex w-full max-w-[520px] flex-wrap items-center justify-center gap-7 rounded-[3.5rem] bg-slate-900 px-6 py-10">
            <div className="flex w-[190px] -rotate-[4deg] flex-col items-center gap-3 rounded-[2rem] bg-white p-[18px]">
              <QRCodeSVG value={qrValue} size={150} level="M" marginSize={0} />
              <div className="text-center leading-tight">
                <div className={`${display} text-[17px]`}>Grade 12 - Rizal</div>
                <div className="mt-1 text-[11px] font-bold text-slate-500">Scan to report a problem</div>
              </div>
            </div>

            <div className="flex w-[248px] max-w-full flex-col gap-3 rounded-[2.5rem] bg-white px-4 pb-5 pt-[18px] ring-[6px] ring-slate-800">
              <div className="rounded-[1.4rem] bg-indigo-50 px-3.5 py-3">
                <div className="text-[9px] font-black uppercase tracking-[0.08em] text-indigo-500">Nagre-report para sa</div>
                <div className={`${display} mt-0.5 text-[17px] leading-tight`}>Grade 12 - Rizal</div>
                <div className="text-[11px] font-semibold text-slate-500">Classroom · Main Building · 2nd Floor</div>
              </div>
              <div className={`${display} text-xl`}>Anong sira?</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-black text-white">Electrical</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">Plumbing</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">Furniture</span>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-semibold leading-snug text-slate-700">
                Dalawang ceiling fan ang hindi gumagana at kumukurap ang isang ilaw.
              </div>
              <div className="flex gap-1.5">
                <span className="flex-1 rounded-[0.9rem] bg-slate-100 py-2 text-center text-[11px] font-black text-slate-500">Medium</span>
                <span className="flex-1 rounded-[0.9rem] bg-orange-500 py-2 text-center text-[11px] font-black text-white">High</span>
              </div>
              <div className="rounded-full bg-indigo-600 py-3 text-center text-sm font-black text-white">I-submit ang report</div>
            </div>
          </div>
        </div>
      </section>

      {/* maintenance tape */}
      <div
        aria-hidden="true"
        className="h-5"
        style={{ background: 'repeating-linear-gradient(-45deg,#fbbf24 0,#fbbf24 18px,#0f172a 18px,#0f172a 36px)' }}
      />

      {/* PROBLEM / SOLUTION */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap gap-6 px-6 pb-6 pt-[88px]">
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-[3.5rem] bg-slate-900 p-8 text-white sm:p-12">
          <span className={`${badge} self-start bg-rose-700 text-white`}>Ang problema</span>
          <h2 className={`${display} text-balance text-3xl leading-[1.05] sm:text-4xl lg:text-[44px]`}>
            Huli ang report, nawawala ang record.
          </h2>
          <ul className="flex flex-col gap-4 text-lg text-slate-300">
            <li className="flex gap-3.5"><span className="font-black text-rose-400">✕</span>Natatagalan ang pag-uulat ng sira sa classroom at facility.</li>
            <li className="flex gap-3.5"><span className="font-black text-rose-400">✕</span>Mahirap subaybayan ang mga nakaraang repair at ang ginastos dito.</li>
          </ul>
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6 rounded-[3.5rem] bg-indigo-600 p-8 text-white sm:p-12">
          <span className={`${badge} self-start bg-white text-indigo-800`}>Ang FixTrack</span>
          <h2 className={`${display} text-balance text-3xl leading-[1.05] sm:text-4xl lg:text-[44px]`}>
            Isang scan, may ticket na. Bawat ayos, may tala.
          </h2>
          <ul className="flex flex-col gap-4 text-lg">
            <li className="flex gap-3.5"><span className="font-black text-amber-200">✓</span>QR code sa mismong lugar, kaya handa na ang form pag na-scan.</li>
            <li className="flex gap-3.5"><span className="font-black text-amber-200">✓</span>Nakatala ang bawat repair at gastos, kada facility at kada buwan.</li>
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>Paano gumagana</span>
          <h2 className={h2}>Tatlong hakbang, mula sira hanggang tala.</h2>
        </div>
        <div className="flex flex-wrap gap-5">
          {steps.map((s) => (
            <div key={s.n} className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 rounded-[3rem] bg-white p-9 ring-1 ring-slate-200">
              <span className="font-mono text-[44px] font-bold leading-none text-indigo-600">{s.n}</span>
              <h3 className={`${display} text-[28px]`}>{s.title}</h3>
              <p className="text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>Features</span>
          <h2 className={h2}>Lahat ng kailangan ng maintenance office.</h2>
        </div>
        <div className="flex flex-wrap gap-5">
          {features.map((f) => (
            <div key={f.title} className={`flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-[3.5rem] p-9 ${f.tone}`}>
              {f.icon}
              <h3 className={`${display} text-[26px]`}>{f.title}</h3>
              <p className={f.sub}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section id="preview" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>Dashboard</span>
          <h2 className={h2}>Isang tingin, alam mo na ang lagay.</h2>
          <p className="text-slate-600">Ito ang sample data na kasama sa demo ng system.</p>
        </div>

        <div className="flex flex-col gap-5 rounded-[4rem] bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-wrap gap-4">
            {[
              ['Pending', '1', 'bg-amber-400 text-amber-950'],
              ['In progress', '2', 'bg-sky-500 text-sky-950'],
              ['Resolved', '3', 'bg-emerald-500 text-emerald-950'],
            ].map(([label, value, tone]) => (
              <div key={label} className={`min-w-0 flex-[1_1_200px] rounded-[2.25rem] p-6 ${tone}`}>
                <div className="text-[11px] font-black uppercase tracking-[0.08em]">{label}</div>
                <div className={`${display} text-[52px] leading-[1.1]`}>{value}</div>
              </div>
            ))}
            <div className="min-w-0 flex-[1_1_200px] rounded-[2.25rem] bg-white p-6">
              <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Total na gastos sa repair</div>
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
                  <div className="text-sm text-slate-600">{r.text}</div>
                  <div className="mt-0.5 text-xs font-bold text-slate-400">{r.meta}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`${badge} ${r.urgency[1]}`}>{r.urgency[0]}</span>
                  <span className={`${badge} ${r.status[1]}`}>{r.status[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-6 pt-28">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className={eyebrow}>Para kanino</span>
          <h2 className={h2}>Madali para sa nag-uulat, buo para sa nag-aayos.</h2>
        </div>
        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-[3.5rem] bg-white p-8 ring-1 ring-slate-200 sm:p-11">
            <span className={`${badge} self-start bg-emerald-100 text-emerald-700`}>Walang login</span>
            <h3 className={`${display} text-[32px] leading-[1.05]`}>Estudyante, guro, at staff ng school</h3>
            <p className="text-slate-600">
              Kahit sino na makakita ng sira ay pwedeng mag-report. Camera lang ng cellphone ang kailangan. Pagkatapos
              mag-submit, may ticket number para sa follow-up.
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[18px] rounded-[3.5rem] bg-slate-900 p-8 text-white sm:p-11">
            <span className={`${badge} self-start bg-amber-400 text-amber-950`}>May login</span>
            <h3 className={`${display} text-[32px] leading-[1.05]`}>Admin at maintenance staff</h3>
            <p className="text-slate-300">
              Sila ang nagbabantay ng mga report, nag-a-assign ng gawain, nagre-record ng repair at gastos, at gumagawa
              ng QR code para sa bagong facility.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-[1200px] px-6 pb-14 pt-28">
        <div className="flex flex-col items-center gap-7 rounded-[4rem] bg-indigo-600 px-10 py-[72px] text-center text-white">
          <h2 className={`${display} max-w-3xl text-balance text-[clamp(40px,6vw,76px)] leading-[0.98] tracking-[-0.035em]`}>
            Itigil na ang hulihang report.
          </h2>
          <p className="max-w-[540px] text-[19px] text-indigo-100">
            I-print ang QR, idikit sa pinto, at hayaang ang cellphone ng bawat isa ang maging reporting desk.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login" className="rounded-full bg-amber-400 px-9 py-[18px] text-base font-black text-amber-950 transition hover:bg-amber-300 active:scale-95">
              Buksan ang system
            </Link>
            <a
              href="#how"
              onClick={scrollTo('how')}
              className="rounded-full bg-white/15 px-9 py-[18px] text-base font-black text-white transition hover:bg-white/25 active:scale-95"
            >
              Paano ito gumagana
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 pb-12 text-sm font-semibold text-slate-500">
        <span><b className="font-black text-slate-900">FixTrack</b> · School Facility Maintenance and Repair Management</span>
        <span>Capstone project · [Pangalan ng paaralan] · [Taon]</span>
      </footer>
    </div>
  )
}
