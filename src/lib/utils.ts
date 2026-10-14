import type { Facility, Report, Urgency, Status } from '../types'
import { getLocale, tr } from './i18n'

export const peso = (n: number) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'PHP', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2 }).format(n)

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(getLocale(), { year: 'numeric', month: 'short', day: 'numeric' })

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export const facilityLabel = (f?: Facility | null) =>
  f ? [f.name, [f.building, f.floor].filter(Boolean).join(' · ')].filter(Boolean).join(' — ') : tr('common.unknownFacility')

/** The URL that a facility's QR code points to. */
export const reportUrl = (facilityId: string) =>
  `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}#/report/${facilityId}`

export const urgencyStyle: Record<Urgency, string> = {
  Low: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
  Medium: 'bg-amber-100 text-amber-700 ring-amber-300',
  High: 'bg-orange-100 text-orange-700 ring-orange-300',
  Critical: 'bg-rose-100 text-rose-700 ring-rose-300',
}

export const statusStyle: Record<Status, string> = {
  Pending: 'bg-amber-100 text-amber-700 ring-amber-300',
  'In Progress': 'bg-sky-100 text-sky-700 ring-sky-300',
  Resolved: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
}

const urgencyRank: Record<Urgency, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
export const byUrgency = (a: Report, b: Report) => urgencyRank[a.urgency] - urgencyRank[b.urgency]

/** Resize + compress a photo to a small JPEG data URL so it can be stored in the database. */
export function compressImage(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(tr('photo.errRead')))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error(tr('photo.errInvalid')))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
