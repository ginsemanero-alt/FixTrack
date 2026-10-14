import { useSyncExternalStore } from 'react'
import { en, type TKey } from './locales/en'
import { tl } from './locales/tl'
import { ceb } from './locales/ceb'
import { ja } from './locales/ja'
import { de } from './locales/de'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { zh } from './locales/zh'
import { hi } from './locales/hi'

export type { TKey }
export type Lang = 'ceb' | 'tl' | 'en' | 'ja' | 'de' | 'es' | 'fr' | 'zh' | 'hi'

/** `name` is always shown in the language's own script so people can find theirs. */
export const LANGUAGES: { code: Lang; name: string; locale: string }[] = [
  { code: 'ceb', name: 'Bisaya', locale: 'fil-PH' },
  { code: 'tl', name: 'Tagalog', locale: 'fil-PH' },
  { code: 'en', name: 'English', locale: 'en-PH' },
  { code: 'ja', name: '日本語', locale: 'ja-JP' },
  { code: 'de', name: 'Deutsch', locale: 'de-DE' },
  { code: 'es', name: 'Español', locale: 'es-ES' },
  { code: 'fr', name: 'Français', locale: 'fr-FR' },
  { code: 'zh', name: '中文', locale: 'zh-CN' },
  { code: 'hi', name: 'हिन्दी', locale: 'hi-IN' },
]

const dictionaries: Record<Lang, Record<TKey, string>> = { ceb, tl, en, ja, de, es, fr, zh, hi }

const STORAGE_KEY = 'fixtrack.lang'
const DEFAULT_LANG: Lang = 'tl' // the app's original Taglish copy

function initial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved in dictionaries) return saved as Lang
  } catch {
    // storage unavailable: fall through
  }
  return DEFAULT_LANG
}

let current: Lang = initial()
const listeners = new Set<() => void>()

function applyDocumentLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = current === 'ceb' ? 'ceb' : current
}
applyDocumentLang()

export function setLang(next: Lang) {
  if (next === current) return
  current = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore
  }
  applyDocumentLang()
  listeners.forEach((l) => l())
}

export const getLang = () => current
export const getLocale = () => LANGUAGES.find((l) => l.code === current)?.locale ?? 'en-PH'

function format(template: string, params?: Record<string, string | number>) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`))
}

/** Translate outside React (e.g. error messages thrown from lib code). */
export function tr(key: TKey, params?: Record<string, string | number>) {
  return format(dictionaries[current][key] ?? en[key], params)
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Components that call this re-render when the language changes. */
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getLang)
  return { lang, setLang, t: tr, locale: getLocale() }
}
