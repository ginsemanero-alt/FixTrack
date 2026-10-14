import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Info, Trash2, UserPlus } from 'lucide-react'
import { db, onDataChange } from '../lib/store'
import { useAdminData } from '../lib/useAdminData'
import { hasSupabase } from '../lib/supabase'
import { useI18n, type TKey } from '../lib/i18n'

import { Badge, Button, Card, Empty, Field, Modal, PageTitle, inputClass } from '../components/ui'
import type { Staff as StaffRow } from '../types'

const roleStyle: Record<StaffRow['role'], string> = {
  admin: 'bg-indigo-100 text-indigo-700 ring-indigo-300',
  maintenance: 'bg-sky-100 text-sky-700 ring-sky-300',
}

export default function Staff() {
  const { reports } = useAdminData()
  const { t } = useI18n()
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      setStaff(await db.listStaff())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
    return onDataChange(() => void load())
  }, [load])

  const openCount = (name: string) => reports.filter((r) => r.assigned_to === name && r.status !== 'Resolved').length

  async function remove(s: StaffRow) {
    if (!confirm(t('staff.removeConfirm', { name: s.full_name }))) return
    try {
      await db.removeStaff(s.email)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    }
  }

  return (
    <>
      <PageTitle
        title={t('staff.title')}
        subtitle={t('staff.subtitle')}
        action={
          !hasSupabase && (
            <Button onClick={() => setAdding(true)}>
              <UserPlus size={16} /> {t('staff.add')}
            </Button>
          )
        }
      />

      {hasSupabase && (
        <Card className="mb-6 !rounded-[2.5rem] bg-indigo-50 ring-indigo-200">
          <div className="flex items-start gap-3 text-sm font-medium text-indigo-900">
            <Info className="mt-0.5 shrink-0" size={20} />
            <p>{t('staff.supabaseNote')}</p>
          </div>
        </Card>
      )}

      {error && <Card className="mb-6 !rounded-[2rem] bg-rose-50 text-sm font-bold text-rose-600">{error}</Card>}

      {loading ? (
        <div className="font-bold text-slate-400">{t('common.loading')}</div>
      ) : staff.length === 0 ? (
        <Empty>{t('staff.empty')}</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <Card key={s.id} className="!p-5 sm:!p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-slate-900">{s.full_name || s.email}</h3>
                  <p className="truncate text-xs font-bold text-slate-400">{s.email}</p>
                </div>
                <Badge className={roleStyle[s.role]}>{t(`role.${s.role}` as TKey)}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {s.role === 'maintenance' ? (
                  <span className="text-sm font-bold text-slate-500">{t('staff.openCount', { n: openCount(s.full_name) })}</span>
                ) : (
                  <span className="text-sm font-bold text-slate-400">{t('staff.fullAccess')}</span>
                )}
                {!hasSupabase && s.role === 'maintenance' && (
                  <Button variant="danger" onClick={() => void remove(s)} className="!px-4 !py-2" aria-label={t('staff.remove')}>
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddStaffModal open={adding} onClose={() => setAdding(false)} onSaved={load} />
    </>
  )
}

function AddStaffModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const { t } = useI18n()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('staff123')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await db.addStaff({ fullName, email, password })
      setFullName('')
      setEmail('')
      setError(null)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('staff.addTitle')}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm font-medium text-slate-500">
          {t('staff.modalNote')}
        </p>
        <Field label={t('staff.fullName')}>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label={t('staff.email')}>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label={t('staff.password')}>
          <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</div>}
        <Button type="submit" className="w-full">
          {t('staff.save')}
        </Button>
      </form>
    </Modal>
  )
}
