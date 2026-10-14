export const FACILITY_TYPES = [
  'Classroom',
  'Laboratory',
  'Restroom',
  'Library',
  'Office',
  'Gym',
  'Canteen',
  'Other',
] as const

export const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Furniture',
  'Equipment',
  'Structural',
  'Cleanliness',
  'Other',
] as const

export const URGENCIES = ['Low', 'Medium', 'High', 'Critical'] as const
export const STATUSES = ['Pending', 'In Progress', 'Resolved'] as const

export const ROLES = ['admin', 'maintenance'] as const

export type FacilityType = (typeof FACILITY_TYPES)[number]
export type Category = (typeof CATEGORIES)[number]
export type Urgency = (typeof URGENCIES)[number]
export type Status = (typeof STATUSES)[number]
export type Role = (typeof ROLES)[number]

export interface Facility {
  id: string
  name: string
  type: FacilityType
  building: string
  floor: string
  created_at: string
}

export interface Report {
  id: string
  ticket: string
  facility_id: string
  reporter_name: string
  reporter_contact: string
  category: Category
  description: string
  urgency: Urgency
  photo: string | null
  status: Status
  assigned_to: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface Repair {
  id: string
  report_id: string | null
  facility_id: string
  description: string
  cost: number
  technician: string
  repair_date: string // YYYY-MM-DD
  created_at: string
}

export type NewFacility = Pick<Facility, 'name' | 'type' | 'building' | 'floor'>

export type NewReport = Pick<
  Report,
  'facility_id' | 'reporter_name' | 'reporter_contact' | 'category' | 'description' | 'urgency' | 'photo'
>

export type NewRepair = Pick<
  Repair,
  'report_id' | 'facility_id' | 'description' | 'cost' | 'technician' | 'repair_date'
>

/** A staff account (a row of `profiles` in Supabase, or a demo account). */
export interface Staff {
  id: string
  email: string
  full_name: string
  role: Role
}

/** The only fields the public ticket-tracking page may ever see. */
export interface TrackedReport {
  ticket: string
  facility_name: string
  facility_building: string
  facility_floor: string
  category: Category
  urgency: Urgency
  status: Status
  assigned_to: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}
