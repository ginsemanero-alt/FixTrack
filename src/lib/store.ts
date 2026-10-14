import { hasSupabase, supabase } from './supabase'
import { addDemoStaff, demoStaffList, removeDemoStaff, resetDemoAccounts } from './auth'
import type {
  Facility,
  NewFacility,
  NewRepair,
  NewReport,
  Repair,
  Report,
  Staff,
  Status,
  TrackedReport,
} from '../types'

/**
 * Data layer. Uses Supabase when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set,
 * otherwise falls back to localStorage with seeded sample data (demo mode).
 */

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const ticket = () => uid().replace(/-/g, '').slice(0, 8).toUpperCase()
const nowIso = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const dateOnly = (iso: string) => iso.slice(0, 10)

/** Tickets are case-insensitive; tolerate spaces and a leading "#". */
export const normalizeTicket = (t: string) => t.trim().replace(/^#/, '').trim().toUpperCase()

export interface ListReportsOptions {
  /** Only reports assigned to this person (maintenance staff). */
  assignedTo?: string
}

const STAFF_ONLY_REMOTE = 'Sa Supabase, ginagawa ang staff accounts sa Authentication → Users.'

// ───────────── Local (demo) backend ─────────────
const KEYS = {
  facilities: 'fixtrack.facilities',
  reports: 'fixtrack.reports',
  repairs: 'fixtrack.repairs',
  seeded: 'fixtrack.seeded',
}

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event('fixtrack:change'))
}

function seed() {
  if (localStorage.getItem(KEYS.seeded)) return

  const f = (name: string, type: Facility['type'], building: string, floor: string, d: number): Facility => ({
    id: uid(),
    name,
    type,
    building,
    floor,
    created_at: daysAgo(d),
  })

  const facilities: Facility[] = [
    f('Grade 12 - Rizal', 'Classroom', 'Main Building', '2nd Floor', 90),
    f('Grade 11 - Bonifacio', 'Classroom', 'Main Building', '2nd Floor', 90),
    f('Computer Laboratory 1', 'Laboratory', 'Tech Building', '1st Floor', 90),
    f('Boys Restroom A', 'Restroom', 'Main Building', 'Ground Floor', 90),
    f('School Library', 'Library', 'Annex', 'Ground Floor', 90),
    f('Gymnasium', 'Gym', 'Sports Complex', 'Ground Floor', 90),
  ]

  const r = (
    fi: number,
    category: Report['category'],
    description: string,
    urgency: Report['urgency'],
    status: Status,
    reporter: string,
    d: number,
    assigned = '',
  ): Report => ({
    id: uid(),
    ticket: ticket(),
    facility_id: facilities[fi].id,
    reporter_name: reporter,
    reporter_contact: '',
    category,
    description,
    urgency,
    photo: null,
    status,
    assigned_to: assigned,
    created_at: daysAgo(d),
    updated_at: daysAgo(Math.max(0, d - 1)),
    resolved_at: status === 'Resolved' ? daysAgo(Math.max(0, d - 2)) : null,
  })

  const reports: Report[] = [
    r(0, 'Electrical', 'Two ceiling fans are not working and one light flickers.', 'High', 'Pending', 'Ms. Reyes', 1),
    r(3, 'Plumbing', 'Faucet is leaking and the floor is wet.', 'Critical', 'In Progress', 'Janitor Roy', 2, 'Mang Tonyo'),
    r(2, 'Equipment', 'Aircon unit is not cooling.', 'Medium', 'In Progress', 'Mr. Santos', 4, 'Electrician Dan'),
    r(1, 'Furniture', 'Three armchairs have broken legs.', 'Low', 'Resolved', 'Student Council', 20, 'Mang Tonyo'),
    r(4, 'Structural', 'Ceiling panel near the entrance is loose.', 'High', 'Resolved', 'Librarian', 35, 'Mang Tonyo'),
    r(5, 'Electrical', 'Two floodlights are out.', 'Medium', 'Resolved', 'PE Dept.', 52, 'Electrician Dan'),
  ]

  const rp = (
    report: Report,
    description: string,
    cost: number,
    technician: string,
    d: number,
  ): Repair => ({
    id: uid(),
    report_id: report.id,
    facility_id: report.facility_id,
    description,
    cost,
    technician,
    repair_date: dateOnly(daysAgo(d)),
    created_at: daysAgo(d),
  })

  const repairs: Repair[] = [
    rp(reports[3], 'Replaced chair legs and re-bolted frames', 1850, 'Mang Tonyo', 18),
    rp(reports[4], 'Re-fastened and repainted ceiling panel', 3200, 'Mang Tonyo', 33),
    rp(reports[5], 'Replaced 2 LED floodlights', 7400, 'Electrician Dan', 50),
  ]

  localStorage.setItem(KEYS.facilities, JSON.stringify(facilities))
  localStorage.setItem(KEYS.reports, JSON.stringify(reports))
  localStorage.setItem(KEYS.repairs, JSON.stringify(repairs))
  localStorage.setItem(KEYS.seeded, '1')
}

if (!hasSupabase) seed()

const sortNewest = <T extends { created_at: string }>(rows: T[]) =>
  [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))

const local = {
  async listFacilities() {
    return read<Facility>(KEYS.facilities).sort((a, b) => a.name.localeCompare(b.name))
  },
  async getFacility(id: string) {
    return read<Facility>(KEYS.facilities).find((x) => x.id === id) ?? null
  },
  async addFacility(input: NewFacility) {
    const row: Facility = { ...input, id: uid(), created_at: nowIso() }
    write(KEYS.facilities, [...read<Facility>(KEYS.facilities), row])
    return row
  },
  async deleteFacility(id: string) {
    write(KEYS.facilities, read<Facility>(KEYS.facilities).filter((x) => x.id !== id))
    write(KEYS.reports, read<Report>(KEYS.reports).filter((x) => x.facility_id !== id))
    write(KEYS.repairs, read<Repair>(KEYS.repairs).filter((x) => x.facility_id !== id))
  },
  async listReports(opts: ListReportsOptions = {}) {
    const rows = read<Report>(KEYS.reports)
    return sortNewest(opts.assignedTo !== undefined ? rows.filter((x) => x.assigned_to === opts.assignedTo) : rows)
  },
  async trackReport(code: string): Promise<TrackedReport | null> {
    const want = normalizeTicket(code)
    const r = read<Report>(KEYS.reports).find((x) => x.ticket.toUpperCase() === want)
    if (!r) return null
    const f = read<Facility>(KEYS.facilities).find((x) => x.id === r.facility_id)
    // Explicitly pick safe fields only: never expose reporter info, description, or photo.
    return {
      ticket: r.ticket,
      facility_name: f?.name ?? 'Unknown facility',
      facility_building: f?.building ?? '',
      facility_floor: f?.floor ?? '',
      category: r.category,
      urgency: r.urgency,
      status: r.status,
      assigned_to: r.assigned_to,
      created_at: r.created_at,
      updated_at: r.updated_at,
      resolved_at: r.resolved_at,
    }
  },
  async listStaff(): Promise<Staff[]> {
    return demoStaffList()
  },
  async addStaff(input: { email: string; password: string; fullName: string }) {
    addDemoStaff(input)
  },
  async removeStaff(email: string) {
    removeDemoStaff(email)
  },
  async addReport(input: NewReport) {
    const row: Report = {
      ...input,
      id: uid(),
      ticket: ticket(),
      status: 'Pending',
      assigned_to: '',
      created_at: nowIso(),
      updated_at: nowIso(),
      resolved_at: null,
    }
    write(KEYS.reports, [...read<Report>(KEYS.reports), row])
    return row
  },
  async updateReport(id: string, patch: Partial<Pick<Report, 'status' | 'assigned_to' | 'urgency'>>) {
    const rows = read<Report>(KEYS.reports).map((x) => {
      if (x.id !== id) return x
      const next = { ...x, ...patch, updated_at: nowIso() }
      if (next.status === 'Resolved' && x.status !== 'Resolved') next.resolved_at = nowIso()
      if (next.status !== 'Resolved') next.resolved_at = null
      return next
    })
    write(KEYS.reports, rows)
  },
  async deleteReport(id: string) {
    write(KEYS.reports, read<Report>(KEYS.reports).filter((x) => x.id !== id))
  },
  async listRepairs() {
    return read<Repair>(KEYS.repairs).sort((a, b) => b.repair_date.localeCompare(a.repair_date))
  },
  async addRepair(input: NewRepair) {
    const row: Repair = { ...input, id: uid(), created_at: nowIso() }
    write(KEYS.repairs, [...read<Repair>(KEYS.repairs), row])
    return row
  },
  async deleteRepair(id: string) {
    write(KEYS.repairs, read<Repair>(KEYS.repairs).filter((x) => x.id !== id))
  },
}

// ───────────── Supabase backend ─────────────
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const remote = {
  async listFacilities() {
    return unwrap(await supabase!.from('facilities').select('*').order('name')) as Facility[]
  },
  async getFacility(id: string) {
    const res = await supabase!.from('facilities').select('*').eq('id', id).maybeSingle()
    return unwrap(res) as Facility | null
  },
  async addFacility(input: NewFacility) {
    return unwrap(await supabase!.from('facilities').insert(input).select().single()) as Facility
  },
  async deleteFacility(id: string) {
    unwrap(await supabase!.from('facilities').delete().eq('id', id))
  },
  async listReports(opts: ListReportsOptions = {}) {
    // RLS already limits maintenance staff to their own reports; the filter just makes it explicit.
    let q = supabase!.from('reports').select('*').order('created_at', { ascending: false })
    if (opts.assignedTo !== undefined) q = q.eq('assigned_to', opts.assignedTo)
    return unwrap(await q) as Report[]
  },
  async trackReport(code: string): Promise<TrackedReport | null> {
    const res = await supabase!.rpc('track_report', { p_ticket: normalizeTicket(code) })
    const rows = unwrap(res) as TrackedReport[] | null
    return rows && rows.length > 0 ? rows[0] : null
  },
  async listStaff(): Promise<Staff[]> {
    const rows = unwrap(
      await supabase!.from('profiles').select('id, email, full_name, role').order('full_name'),
    ) as Staff[]
    return rows
  },
  async addStaff(_input: { email: string; password: string; fullName: string }): Promise<void> {
    throw new Error(STAFF_ONLY_REMOTE)
  },
  async removeStaff(_email: string): Promise<void> {
    throw new Error(STAFF_ONLY_REMOTE)
  },
  async addReport(input: NewReport) {
    // Anonymous users cannot read rows back (RLS), so don't chain .select() here.
    const id = uid()
    const code = ticket()
    unwrap(await supabase!.from('reports').insert({ ...input, id, ticket: code }))
    return { ...input, id, ticket: code } as unknown as Report
  },
  async updateReport(id: string, patch: Partial<Pick<Report, 'status' | 'assigned_to' | 'urgency'>>) {
    unwrap(await supabase!.from('reports').update(patch).eq('id', id))
  },
  async deleteReport(id: string) {
    unwrap(await supabase!.from('reports').delete().eq('id', id))
  },
  async listRepairs() {
    return unwrap(
      await supabase!.from('repairs').select('*').order('repair_date', { ascending: false }),
    ) as Repair[]
  },
  async addRepair(input: NewRepair) {
    // Maintenance staff may insert but not read repairs (RLS), so don't chain .select().
    const row: Repair = { ...input, id: uid(), created_at: nowIso() }
    unwrap(await supabase!.from('repairs').insert(row))
    return row
  },
  async deleteRepair(id: string) {
    unwrap(await supabase!.from('repairs').delete().eq('id', id))
  },
}

export const db = hasSupabase ? remote : local

/** Subscribe to data changes (same-tab events, other tabs, and polling in Supabase mode). */
export function onDataChange(cb: () => void) {
  const handler = () => cb()
  window.addEventListener('fixtrack:change', handler)
  window.addEventListener('storage', handler)
  const timer = hasSupabase ? window.setInterval(cb, 15_000) : undefined
  return () => {
    window.removeEventListener('fixtrack:change', handler)
    window.removeEventListener('storage', handler)
    if (timer) window.clearInterval(timer)
  }
}

export function resetDemoData() {
  if (hasSupabase) return
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  resetDemoAccounts()
  seed()
  window.dispatchEvent(new Event('fixtrack:change'))
}
