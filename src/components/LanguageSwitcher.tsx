import { Globe } from 'lucide-react'
import { LANGUAGES, useI18n, type Lang } from '../lib/i18n'

/** Native-name language picker. `tone` adapts it to light or dark backgrounds. */
export default function LanguageSwitcher({
  tone = 'dark',
  className = '',
}: {
  tone?: 'dark' | 'light'
  className?: string
}) {
  const { lang, setLang, t } = useI18n()
  const look =
    tone === 'dark'
      ? 'bg-white/10 text-white hover:bg-white/20 [&>option]:text-slate-900'
      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
  return (
    <label className={`no-print relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t('common.language')}</span>
      <Globe size={15} className="pointer-events-none absolute left-3.5 opacity-70" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className={`cursor-pointer appearance-none rounded-full py-2.5 pl-9 pr-4 text-sm font-black outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-400 ${look}`}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  )
}
