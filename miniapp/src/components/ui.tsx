import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic, useNativeBack } from '../lib/tg'

export function WhaleMark({ size = 40 }: { size?: number }) {
  return <img src="/logo.png" width={size} height={size} className="rounded-[12px]" alt="" />
}

export function TopBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  const { t } = useStore()
  useNativeBack(!!title)
  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-navy-line"
      style={{ paddingTop: 'calc(10px + var(--sat))' }}>
      <div className="flex items-center gap-2.5 px-4 pb-2.5">
        {title ? (
          <div className="text-[17px] font-extrabold flex-1">{title}</div>
        ) : (
          <>
            <WhaleMark />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[11px] font-semibold text-[#8A93B8] leading-tight">{t.freeDelivery} · {t.city}</div>
            </div>
          </>
        )}
        {right ?? <LangPicker />}
      </div>
    </header>
  )
}

const FLAGS: Record<string, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' }
const LANG_NAME: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' }

function LangPicker() {
  const { t, lang, setLang } = useStore()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="press flex items-center gap-1.5 bg-navy-soft rounded-xl px-2.5 py-2 text-[12px] font-extrabold text-navy-ink active:scale-95 transition-transform">
        <span className="text-[15px] leading-none">{FLAGS[lang]}</span>{lang.toUpperCase()}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.language}>
        <div className="space-y-2 pb-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); setOpen(false) }}
              className={`press w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${lang === l ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-white border-navy-line'}`}>
              <span className="text-[26px]">{FLAGS[l]}</span>
              <span className="text-[15px] font-extrabold flex-1">{LANG_NAME[l]}</span>
              {lang === l && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

const ICONS = (on: boolean): Record<string, React.ReactNode> => ({
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  cart: <><path d="M6 6h15l-1.7 8.5a2 2 0 0 1-2 1.5H9.2a2 2 0 0 1-2-1.6L5.3 3.7A1 1 0 0 0 4.3 3H2" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></>,
  orders: <><path d="M5 3h14v16.3l-1.75 1.3-1.75-1.3-1.75 1.3-1.75-1.3-1.75 1.3-1.75-1.3-1.75 1.3L5 19.3z" /><path d="M8.5 8.5h7M8.5 12.5h7" fill="none" stroke={on ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" /></>,
})

export function TabBar() {
  const { t, cartCount } = useStore()
  const nav = useNavigate()
  const loc = window.location.pathname
  if (loc.startsWith('/p/')) return null
  const tabs = [
    { id: 'home', to: '/', label: t.tabHome, icon: 'home' },
    { id: 'cart', to: '/cart', label: t.tabCart, icon: 'cart' },
    { id: 'orders', to: '/orders', label: t.tabOrders, icon: 'orders' },
    { id: 'profile', to: '/profile', label: t.tabProfile, icon: 'profile' },
  ]
  return (
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex">
        {tabs.map(tb => {
          const on = loc === tb.to
          return (
            <button key={tb.id} onClick={() => { if (!on) { haptic(); nav(tb.to) } }}
              className={`press flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-bold transition-colors ${on ? 'text-navy' : 'text-[#A2A9C6]'}`}>
              <span className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${on ? 'bg-navy-soft px-4 py-1' : 'px-1 py-1'}`}>
                <svg width="23" height="23" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS(on)[tb.icon]}</svg>
                {tb.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-navy text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-white">{cartCount}</span>
                )}
              </span>
              {tb.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { lang, add, favs, toggleFav, showToast, t } = useStore()
  const nav = useNavigate()
  const fav = favs.includes(p.id)
  return (
    <article onClick={() => { haptic(); nav(`/p/${p.id}`) }}
      className="anim-up bg-white border border-navy-line rounded-[18px] overflow-hidden active:scale-[.975] transition-transform duration-200 cursor-pointer"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className="relative aspect-square bg-navy-soft">
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 grid place-items-center shadow-sm active:scale-90 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? '#E23B52' : 'none'} stroke={fav ? '#E23B52' : '#8A93B8'} strokeWidth="2"><path d="M12 21C7 16.6 3 13.4 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4.1-4 7.3-9 11.7z" /></svg>
        </button>
        {p.hit && <span className="absolute top-2 left-2 bg-navy text-white text-[9.5px] font-extrabold tracking-wide uppercase px-2 py-1 rounded-lg">{t.hit}</span>}
        <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium'); showToast(t.added) }}
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-navy text-white grid place-items-center shadow-[0_6px_14px_-4px_rgba(10,33,148,.55)] active:scale-85 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></button>
      </div>
      <div className="p-2.5">
        <div className="text-[13.5px] font-bold leading-snug line-clamp-2 min-h-[36px]">{pName(p, lang)}</div>
        <div className="text-[11px] font-semibold text-[#8A93B8] mt-0.5 min-h-[15px]">{p.pcs ? `${p.pcs} ${t.pcs}` : ''}</div>
        <div className="mt-1.5 text-[15px] font-extrabold tracking-tight">{fmt(p.price)} <span className="text-[11px] font-bold text-[#8A93B8]">UZS</span></div>
      </div>
    </article>
  )
}

export function Sheet({ open, onClose, title, children, foot }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; foot?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-navy-deep/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-sheet absolute left-0 right-0 bottom-0 bg-paper rounded-t-[26px] max-h-[88dvh] flex flex-col shadow-[0_-20px_60px_rgba(10,15,50,.25)]">
        <div className="w-10 h-1.5 rounded-full bg-[#D8DCEA] mx-auto mt-2.5" />
        <div className="flex items-center justify-between px-5 pt-1.5 pb-1">
          <h3 className="text-[18px] font-extrabold">{title}</h3>
          <button onClick={onClose} className="press w-8 h-8 rounded-full bg-navy-soft grid place-items-center text-[#8A93B8]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3 flex-1">{children}</div>
        {foot && <div style={{ paddingBottom: 'calc(14px + var(--sab))' }} className="px-5 pt-2">{foot}</div>}
      </div>
    </div>
  )
}

export function Empty({ emoji, title, sub, action }: { emoji: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      <div className="tekit-pattern w-24 h-24 rounded-[26px] mx-auto grid place-items-center text-[40px] shadow-lg">{emoji}</div>
      <div className="mt-4 text-[17px] font-extrabold">{title}</div>
      {sub && <div className="mt-1 text-[13px] font-medium text-[#8A93B8]">{sub}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function BigButton({ children, onClick, disabled, ghost, type }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`press w-full py-4 rounded-2xl text-[15.5px] font-extrabold flex items-center justify-center gap-2 transition-all
        ${ghost ? 'bg-white text-navy-ink border border-navy-line' : 'bg-navy text-white shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)]'} disabled:opacity-40`}>
      {children}
    </button>
  )
}

export function Qty({ q, onInc, onDec, small }: { q: number; onInc: () => void; onDec: () => void; small?: boolean }) {
  const b = small ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <div className="flex items-center bg-white border border-navy-line rounded-[13px] p-1">
      <button onClick={onDec} className={`${b} rounded-[10px] grid place-items-center text-[18px] font-bold active:bg-navy-soft active:scale-90 transition-transform`}>−</button>
      <span className="min-w-[30px] text-center text-[15px] font-extrabold">{q}</span>
      <button onClick={onInc} className={`${b} rounded-[10px] grid place-items-center text-[18px] font-bold active:bg-navy-soft active:scale-90 transition-transform`}>+</button>
    </div>
  )
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    new: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', cooking: 'bg-purple-100 text-purple-700',
    delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
  }
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${colors[status] || 'bg-navy-soft text-navy-ink'}`}>{label}</span>
}
