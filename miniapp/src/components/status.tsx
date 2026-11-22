import React from 'react'
import { useStore } from '../lib/store'

/* ---------- Umumiy yuklanish/xato sahifalari (status.tsx) ----------
   Original logo (public/logo.png — shaffof fonli kit, #0F1E9A).
   Yuklanishda: kit ikki qatlamli animatsiya bilan silliq suzadi
   (tashqi qatlam yengil suzish, ichki qatlam ozgina burilish —
   ikki xil tezlik tabiiy suzuv holatini beradi), yonida kichik sushi
   rolli suzib ketadi. Xato sahifasida kit sekin chayqaladi.
   Barcha harakat transform/opacity da: layout siljinmaydi.
   "Kam harakat" yoqilgan qurilmalarda hammasi turg'un turadi. */
const STATUS_CSS = `
@keyframes tk-float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-9px) translateX(3px); }
}
@keyframes tk-roll {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
@keyframes tk-sushi-drift {
  0%, 100% { transform: translateY(3px) rotate(-7deg); }
  50% { transform: translateY(-13px) rotate(9deg); }
}
@keyframes tk-whale-rock {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(-3deg); }
}
@keyframes tk-bubble {
  0% { opacity: 0; transform: translate(0, 10px) scale(.6); }
  35% { opacity: 1; }
  60% { transform: translate(2px, -6px) scale(1); }
  100% { opacity: 0; transform: translate(-1px, -16px) scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .tk-whale-wrap, .tk-whale-rot, .tk-sushi, .tk-whale-anim { animation: none !important; transform: none !important; }
  .tk-bubble { animation: none !important; opacity: .75 !important; transform: none !important; }
}
`
const StatusStyles = () => <style>{STATUS_CSS}</style>

/* Mini sushi roll (maki): nori + guruch + losos. Faqat yuklanish
   ekranidagi illyustratsiya, ikonka emas. */
function Maki({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="#0B1668" />
      <circle cx="32" cy="32" r="20" fill="#FFFFFF" />
      <circle cx="32" cy="16.5" r="2.2" fill="#E9EDF5" />
      <circle cx="45" cy="39" r="2.2" fill="#E9EDF5" />
      <circle cx="20" cy="42" r="2.2" fill="#E9EDF5" />
      <circle cx="32" cy="32" r="10" fill="#FF7043" />
      <ellipse cx="28.4" cy="28.4" rx="2.6" ry="1.8" fill="#FFFFFF" opacity=".35" />
    </svg>
  )
}

/* Kit: tashqi qatlam suzadi, ichki qatlam buriladi (ikki xil tezlik) */
function SwimmingWhale({ src, hcls }: { src: string; hcls: string }) {
  return (
    <span className="inline-block tk-whale-wrap" style={{ animation: 'tk-float 3.4s ease-in-out infinite' }}>
      <img src={src} alt="Tekit Sushi" className={`w-auto block tk-whale-rot ${hcls}`}
        style={{ animation: 'tk-roll 2.55s ease-in-out infinite' }} />
    </span>
  )
}

/* ---------- Yuklanish ekrani ----------
   full=true — ilova ochilishidagi to'liq ekran (brend ko'k fon, oq kit).
   full=false — sahifa ichidagi yengil kutish holati (ko'k kit). */
export function LoadingScreen({ full = true }: { full?: boolean }) {
  const whale = full ? '/logo-light.png' : '/logo.png'
  const hcls = full ? 'h-16' : 'h-14'
  return full ? (
    <div className="fixed inset-0 z-[90] bg-[var(--brand-blue)] grid place-items-center">
      <StatusStyles />
      <div className="flex items-end gap-1.5">
        <SwimmingWhale src={whale} hcls={hcls} />
        <span className="tk-sushi inline-block w-7 mb-1.5"
          style={{ animation: 'tk-sushi-drift 3.4s ease-in-out .35s infinite' }}>
          <Maki className="w-full h-auto" />
        </span>
      </div>
      <div className="flex items-end gap-2 h-6 mt-5" aria-hidden="true">
        <span className="tk-bubble w-2 h-2 rounded-full bg-white/80"
          style={{ animation: 'tk-bubble 1.7s ease-in-out infinite' }} />
        <span className="tk-bubble w-1.5 h-1.5 rounded-full bg-white/60"
          style={{ animation: 'tk-bubble 1.7s ease-in-out .5s infinite' }} />
        <span className="tk-bubble w-2.5 h-2.5 rounded-full bg-white/45"
          style={{ animation: 'tk-bubble 1.7s ease-in-out 1s infinite' }} />
      </div>
    </div>
  ) : (
    <div className="grid place-items-center py-10">
      <StatusStyles />
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-end gap-1">
          <SwimmingWhale src={whale} hcls={hcls} />
          <span className="tk-sushi inline-block w-5 mb-1"
            style={{ animation: 'tk-sushi-drift 3.4s ease-in-out .35s infinite' }}>
            <Maki className="w-full h-auto" />
          </span>
        </div>
        <div className="flex items-end gap-2 h-5" aria-hidden="true">
          <span className="tk-bubble w-2 h-2 rounded-full bg-[var(--brand-blue)]"
            style={{ animation: 'tk-bubble 1.7s ease-in-out infinite' }} />
          <span className="tk-bubble w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)] opacity-60"
            style={{ animation: 'tk-bubble 1.7s ease-in-out .5s infinite' }} />
          <span className="tk-bubble w-2.5 h-2.5 rounded-full bg-[var(--brand-blue)] opacity-40"
            style={{ animation: 'tk-bubble 1.7s ease-in-out 1s infinite' }} />
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
      <StatusStyles />
      <div className="max-w-[380px] w-full text-center">
        {/* Kit sekin chayqaladi — xato bor, lekin ilova tirik */}
        <img src="/logo.png" alt="Tekit Sushi" className="h-16 w-auto mx-auto tk-whale-anim"
          style={{ animation: 'tk-whale-rock 2.8s ease-in-out infinite', transformOrigin: '50% 80%' }} />
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
