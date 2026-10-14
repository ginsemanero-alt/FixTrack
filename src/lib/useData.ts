import { useCallback, useEffect, useState } from 'react'
import { db, onDataChange } from './store'
import type { Facility, Repair, Report, Role } from '../types'

interface Data {
  facilities: Facility[]
  reports: Report[]
  repairs: Repair[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Loads the tables the signed-in role may see and keeps them fresh when data changes.
 * Maintenance staff get only the reports assigned to them and no repairs (they cannot read those).
 */
export function useData(role: Role | null, fullName: string): Data {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!role) {
      setLoading(false)
      return
    }
    try {
      const isAdmin = role === 'admin'
      const [f, r, p] = await Promise.all([
        db.listFacilities(),
        db.listReports(isAdmin ? {} : { assignedTo: fullName || '\u0000' }),
        isAdmin ? db.listRepairs() : Promise.resolve([] as Repair[]),
      ])
      setFacilities(f)
      setReports(r)
      setRepairs(p)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [role, fullName])

  useEffect(() => {
    void refresh()
    return onDataChange(() => void refresh())
  }, [refresh])

  return { facilities, reports, repairs, loading, error, refresh }
}
