import React from 'react'
import { useStore } from '../lib/store'

/* ---------- Umumiy yuklanish ekrani (status.tsx) ----------
   Logo tabiiy nisbatda (w-auto — cho'zilib buzilmaydi) + 3 nuqta yuklanish
   effekti. full=true — ilova ochilishidagi to'liq ekran (brend ko'k fon).
   full=false — sahifa ichidagi yengil kutish holati (masalan, buyurtma
   yuborilayotganda). reduced-motion'da nuqtalar turg'un turadi. */
export function LoadingScreen({ full = true }: { full?: boolean }) {
  if (full) {
    return (
      <div className="fixed inset-0 z-[90] bg-[var(--brand-blue)] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-light.png" alt="Tekit Sushi" className="h-16 w-auto anim-pop" />
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-white/90 motion-safe:animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/55 motion-safe:animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 motion-safe:animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="grid place-items-center py-10">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.png" alt="Tekit Sushi" className="h-14 w-auto anim-pop" />
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] motion-safe:animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] opacity-60 motion-safe:animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] opacity-30 motion-safe:animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Xato sahifasi: sabab aniq ko'rinadi, tugma bilan tiklanadi ---------- */
export function ErrorScreen({ title, sub, btn, onRetry }: {
  title: string; sub?: string; btn: string; onRetry: () => void
}) {
  return (
    <div className="fixed inset-0 z-[95] bg-[var(--bg)] grid place-items-center px-6">
      <div className="max-w-[380px] w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--soft)] grid place-items-center text-[var(--mut2)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div className="mt-4 text-[17px] font-extrabold text-[var(--ink)]">{title}</div>
        {sub && <div className="mt-1.5 text-[13.5px] text-[var(--mut2)] leading-relaxed break-words">{sub}</div>}
        <button onClick={onRetry}
          className="press mt-5 h-11 px-6 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] text-[14px] font-extrabold active:scale-[.98] transition-transform">
          {btn}
        </button>
      </div>
    </div>
  )
}

/* Xato sahifasi tilga moslashuvi uchun: do'kon tili bilan chiqadi */
function ErrorPage({ err }: { err: Error | null }) {
  const { t } = useStore()
  return (
    <ErrorScreen
      title={t.errTitle}
      sub={`${t.errSub}: ${(err?.message || '—').slice(0, 220)}`}
      btn={t.errReload}
      onRetry={() => window.location.reload()}
    />
  )
}

/* Ilovaning o'zida kutilmagan xato bo'lsa: ilova yiqilib qolmasdan,
   sababi va "Qayta yuklash" tugmasi bilan to'liq sahifa ko'rsatiladi. */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch() { /* xato brauzer konsolida to'liq ko'rinadi */ }
  render() { return this.state.err ? <ErrorPage err={this.state.err} /> : this.props.children }
}

/* ---------- Internet uzilganda tepada chiqadigan xabar ----------
   Tarmoq qaytganda o'zi yo'qoladi. Faqat haqiqatan uzilganda chiqadi. */
export function OfflineBanner() {
  const { t } = useStore()
  const [off, setOff] = React.useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  React.useEffect(() => {
    const on = () => setOff(false)
    const offFn = () => setOff(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', offFn)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', offFn) }
  }, [])
  if (!off) return null
  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[100] bg-[#b3261e] text-white text-center text-[13px] font-bold px-4"
      style={{ paddingTop: 'calc(8px + var(--sat))', paddingBottom: '8px' }}>
      {t.offlineMsg}
    </div>
  )
}
