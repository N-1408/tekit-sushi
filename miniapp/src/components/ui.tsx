import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, CATS, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { pDesc } from '../lib/store'
import { haptic, useNativeBack, tgUser } from '../lib/tg'

const CDN = 'https://cdn.delever.uz/delever/'

/* ---------- ikonkalar (bitta stil: chiziqli, yumaloq uchli) ---------- */
export const IcBurger = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
export const IcBag = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1.1 11.1a2 2 0 0 1-2 1.9H9.1a2 2 0 0 1-2-1.9L6 8Z" /><path d="M9 8V6.5A3 3 0 0 1 12 3.5a3 3 0 0 1 3 3V8" /></svg>
export const IcUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="3.4" /><path d="M5 20c1-3.6 3.8-5.6 7-5.6s6 2 7 5.6" /></svg>
export const IcPin = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
export const IcClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
export const IcTag = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="7.5" r="1.4" /></svg>
export const IcCash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" /></svg>
export const IcSearch = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IcX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
export const IcChevL = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-6 6 6 6" /></svg>
export const IcChevR = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m10 6 6 6-6 6" /></svg>
export const IcPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
export const IcScale = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16M5 8l7-4 7 4" /><path d="M4 20h16" /><path d="M5 8 2.5 13a3 3 0 0 0 5 0L5 8ZM19 8l-2.5 5a3 3 0 0 0 5 0L19 8Z" /></svg>
export const IcSauce = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v4c1.8 1.2 3 3.2 3 5.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7.5C6 10.2 7.2 8.2 9 7V3Z" /><path d="M6 13h12" /></svg>
export const IcPlate = () => <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /></svg>
const Heart = ({ on, s = 16 }: { on: boolean; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={on ? '#E23B52' : 'none'} stroke={on ? '#E23B52' : '#8A93B8'} strokeWidth="2"><path d="M12 21C7 16.6 3 13.4 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4.1-4 7.3-9 11.7z" /></svg>
)

export function WhaleMark({ size = 40 }: { size?: number }) {
  return <img src="/logo.png" width={size} height={size} className="rounded-[12px]" alt="" />
}

function hiName(t: any, user: { name?: string } | null) {
  let h = 12
  try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent' }).format(new Date())) } catch {}
  const g = h >= 5 && h < 12 ? t.greetMorning : h < 18 ? t.greetDay : t.greetEvening
  return `${g}, ${user?.name || tgUser()?.first_name || t.greetGuest}!`
}

/* ---------- savat tugmasi (badge bilan) ---------- */
export function CartBtn() {
  const { cartCount, cartSum } = useStore()
  const nav = useNavigate()
  return (
    <button onClick={() => { haptic(); nav('/cart') }} aria-label="cart"
      className="press relative flex items-center gap-2 h-10 pl-2 pr-1 rounded-xl shrink-0 active:scale-95 transition-transform">
      {cartSum > 0 && <span className="text-[13.5px] font-extrabold whitespace-nowrap">{fmt(cartSum)} <span className="text-[9.5px] font-bold text-[#8B94A3]">UZS</span></span>}
      <IcBag />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8462B] text-white text-[10.5px] font-extrabold grid place-items-center leading-none">{cartCount}</span>
      )}
    </button>
  )
}

/* ---------- til tanlash (bayroqchali) ---------- */
const FLAGS: Record<string, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' }
const LANG_NAME: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' }

function LangPicker({ dark }: { dark?: boolean }) {
  const { t, lang, setLang } = useStore()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`press flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-extrabold active:scale-95 transition-transform ${dark ? 'bg-[#1B2330] text-[#F2F5F9]' : 'bg-navy-soft text-navy-ink'}`}>
        <span className="text-[15px] leading-none">{FLAGS[lang]}</span>{lang.toUpperCase()}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.language}>
        <div className="space-y-2 pb-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); setOpen(false) }}
              className={`press w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${lang === l ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-[#1B2330] border-navy-line'}`}>
              <span className="text-[22px]">{FLAGS[l]}</span>
              <span className="text-[15px] font-extrabold flex-1">{LANG_NAME[l]}</span>
              {lang === l && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

/* ---------- ichki sahifalar uchun yuqori panel (tungi) ---------- */
export function TopBar({ title, right, flat }: { title?: string; right?: React.ReactNode; back?: boolean; flat?: boolean }) {
  const { t, user } = useStore()
  useNativeBack(!!title)
  const inner = (
    <div className="bg-[#0F1720] text-[#F2F5F9] border-b border-[#1E2631]">
      <div className="max-w-[1240px] mx-auto flex items-center gap-2 px-4 lg:px-6 pb-2.5 pt-1">
        {title ? (
          <>
            <div className="text-[16px] font-extrabold flex-1 truncate">{title}</div>
          </>
        ) : (
          <>
            <WhaleMark />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[10.5px] font-semibold text-[#8B94A3] leading-tight truncate">{hiName(t, user)}</div>
            </div>
          </>
        )}
        {right ?? (
          <div className="flex items-center gap-2">
            <CartBtn />
            <LangPicker dark />
          </div>
        )}
      </div>
    </div>
  )
  if (flat) return inner
  return <header className="sticky top-0 z-30 bg-[#0F1720]" style={{ paddingTop: 'calc(6px + var(--sat))' }}>{inner}</header>
}

/* ---------- hamburger menyu ---------- */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang, user } = useStore()
  const nav = useNavigate()
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[302px] lg:w-[340px] bg-[#101821] text-[#F2F5F9] flex flex-col anim-drawer shadow-2xl"
        style={{ paddingTop: 'calc(16px + var(--sat))', paddingBottom: 'calc(16px + var(--sab))' }}>
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-10 h-10 rounded-[12px]" />
            <span className="text-[15px] font-extrabold tracking-[0.08em]">TEKIT SUSHI</span>
          </div>
          <button onClick={onClose} className="press w-9 h-9 rounded-xl bg-[#1B2330] grid place-items-center text-[#9AA3B2] active:scale-95 transition-transform"><IcX /></button>
        </div>

        <div className="px-5 mt-4 flex gap-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic('light') }}
              className={`press flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-extrabold transition-colors ${lang === l ? 'bg-white text-[#101821]' : 'bg-[#1B2330] text-[#9AA3B2] active:scale-95'}`}>
              <span className="text-[15px] leading-none">{FLAGS[l]}</span>{l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="px-5 mt-5 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[#6E7787] font-extrabold">{t.menuT}</div>
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3">
          {CATS.map(c => (
            <button key={c.id} onClick={() => { haptic(); onClose(); nav(`/cat/${c.id}`) }}
              className="press w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-bold text-[#F2F5F9] active:bg-[#1B2330] transition-colors">
              {(c as any)[lang] || t.catNames[c.id]}
              <span className="text-[#3A4454]"><IcChevR /></span>
            </button>
          ))}
        </nav>

        <div className="px-5 pt-3 mt-2 border-t border-[#1E2631] space-y-0.5">
          <button onClick={() => { onClose(); nav('/orders') }} className="press w-full flex items-center gap-2.5 py-2.5 text-[13.5px] font-bold text-[#F2F5F9] active:opacity-70">
            <IcBag /> {t.tabOrders}
          </button>
          <button onClick={() => { onClose(); nav('/profile') }} className="press w-full flex items-center gap-2.5 py-2.5 text-[13.5px] font-bold text-[#F2F5F9] active:opacity-70">
            <IcUser /> {t.tabProfile}{user?.name ? ` · ${user.name.split(' ')[0]}` : ''}
          </button>
          <a href="tel:+998951550549" className="flex items-center gap-2.5 py-2.5 text-[13.5px] font-bold text-[#F2F5F9]">
            <IcCash /> {t.ctPhoneVal}
          </a>
          <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 py-2.5 text-[13.5px] font-bold text-[#F2F5F9]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.25.25-.45.45-.9.45l.3-4.6L18.2 6.8c.35-.3-.1-.5-.55-.2L7.7 13.1l-4.4-1.4c-1-.3-1-1 .2-1.45L20.6 3.3c.8-.3 1.5.2 1.3 1.3Z" /></svg>
            {t.ctTgVal}
          </a>
        </div>
      </aside>
    </div>,
    document.body
  )
}

/* ---------- bosh sahifa headeri ---------- */
export function Header() {
  const { t, mode, setMode, user } = useStore()
  const nav = useNavigate()
  const [drawer, setDrawer] = useState(false)
  return (
    <>
      <header className="bg-[#0F1720] text-[#F2F5F9] border-b border-[#1E2631]">
        <div className="max-w-[1240px] mx-auto flex items-center gap-2 px-4 lg:px-6 pb-2.5 pt-1">
          <button aria-label="menu" onClick={() => { haptic(); setDrawer(true) }}
            className="press w-12 h-12 rounded-2xl bg-[#E9EDF1] text-[#101821] grid place-items-center shrink-0 active:scale-95 transition-transform">
            <IcBurger />
          </button>
          <button onClick={() => nav('/')} className="press flex items-center gap-2 min-w-0 active:opacity-80 transition-opacity">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-[10px]" />
            <span className="text-[14.5px] font-extrabold tracking-[0.08em] whitespace-nowrap hidden min-[400px]:block">TEKIT SUSHI</span>
          </button>
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            {(['delivery', 'pickup'] as const).map(m => (
              <button key={m} onClick={() => { if (m !== mode) { setMode(m); haptic('light') } }}
                className={`px-4 py-2 rounded-full text-[12.5px] font-extrabold transition-colors ${mode === m ? 'bg-white text-[#0F1720]' : 'bg-[#1B2330] text-[#C7CFDB] hover:text-white'}`}>
                {m === 'delivery' ? t.deliveryMode : t.pickup}
              </button>
            ))}
          </div>
          <button onClick={() => nav('/profile')} className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-bold text-[#F2F5F9] active:opacity-80 transition-opacity">
            <IcPin /> {t.city}
          </button>
          <button onClick={() => nav('/profile')} className="hidden lg:flex items-center gap-1.5 border border-[#2A3442] rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold text-[#F2F5F9] active:opacity-80 transition-opacity">
            <IcPin /> {t.spAddr}
          </button>
          <div className="flex-1" />
          <button onClick={() => nav('/profile')} className="hidden lg:flex items-center gap-2 px-3 py-2.5 text-[12.5px] font-bold active:opacity-80 transition-opacity">
            <IcUser /> {user?.name ? user.name.split(' ')[0] : t.tabProfile}
          </button>
          <CartBtn />
        </div>
      </header>
      <Drawer open={drawer} onClose={() => setDrawer(false)} />
    </>
  )
}

/* ---------- bir martalik shahar banneri ---------- */
export function CityBanner() {
  const { t } = useStore()
  const [ok, setOk] = useState(() => { try { return localStorage.getItem('tk-city-ok') === '1' } catch { return false } })
  if (ok) return null
  const close = () => { try { localStorage.setItem('tk-city-ok', '1') } catch {}; setOk(true) }
  return (
    <>
      <div className="fixed inset-0 z-[44]" onClick={close} />
      <div className="fixed left-1/2 -translate-x-1/2 z-[45] w-[calc(100%-24px)] max-w-[420px]" style={{ top: 'calc(66px + var(--sat))' }}>
      <div className="flex items-center gap-3 bg-[#1B2330] border border-[#2A3442] rounded-2xl px-4 py-3 shadow-[0_18px_44px_-14px_rgba(0,0,0,.6)]">
        <span className="text-[#29A8E0] shrink-0"><IcPin /></span>
        <div className="flex-1 text-[12.5px] font-bold text-[#F2F5F9] leading-snug">{t.cityNote}</div>
        <button onClick={close}
          className="press shrink-0 bg-white text-[#0F1720] text-[12px] font-extrabold px-3.5 py-2 rounded-xl active:scale-95 transition-transform">
          {t.cityOk}
        </button>
      </div>
    </div>
    </>
  )
}

/* ---------- qidiruv + kategoriya chip-lari ---------- */
export const IcSort = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v13M8 18l-3.2-3.2M8 18l3.2-3.2M16 19V6M16 6l-3.2 3.2M16 6l3.2 3.2" /></svg>

export function SearchChips({ q, setQ, sort, setSort }: { q: string; setQ: (s: string) => void; sort: 'none' | 'asc' | 'desc'; setSort: (s: 'none' | 'asc' | 'desc') => void }) {
  const { t, lang } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const loc = window.location.pathname
  const activeCat = loc.startsWith('/cat/') ? loc.slice(5) : null
  const chip = (on: boolean) => `press shrink-0 px-4 h-10 rounded-full text-[12.5px] font-extrabold whitespace-nowrap transition-colors active:scale-95 ${on ? 'bg-white text-[#0F1720]' : 'bg-[#1B2330] text-[#C7CFDB]'}`
  return (
    <div className="bg-paper/95 backdrop-blur-md border-b border-navy-line">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-2.5 pb-2">
        {open && (
          <div className="relative mb-2.5">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t.search}
              className="w-full bg-[#1B2330] border border-[#2A3442] rounded-full py-2.5 pl-10 pr-10 text-[13.5px] font-medium text-[#F2F5F9] placeholder:text-[#6E7787] outline-none focus:border-[#29A8E0] focus:ring-2 focus:ring-[#29A8E0]/15" />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E7787]"><IcSearch /></span>
            <button onClick={() => { setOpen(false); setQ('') }} className="press absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center text-[#6E7787] active:scale-90 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(v => !v)} aria-label="search"
            className="press w-9 h-9 grid place-items-center shrink-0 text-[#29A8E0] active:scale-95 transition-transform"><IcSearch /></button>
          <span className="w-px h-5 bg-[#2A3442] shrink-0" />
          <button onClick={() => setSort(sort === 'none' ? 'asc' : sort === 'asc' ? 'desc' : 'none')} aria-label="sort"
            className={`press w-9 h-9 grid place-items-center shrink-0 active:scale-95 transition-transform ${sort !== 'none' ? 'text-[#29A8E0]' : 'text-[#6E7787]'}`}><IcSort /></button>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mr-4 pr-4 lg:mr-0 lg:pr-0">
          <button className={chip(!activeCat)} onClick={() => { if (loc !== '/') { haptic(); nav('/') } else window.scrollTo({ top: 0 }) }}>{t.all}</button>
          {CATS.map(c => (
            <button key={c.id} className={chip(activeCat === c.id)} onClick={() => { haptic(); nav(`/cat/${c.id}`) }}>
              {(c as any)[lang] || t.catNames[c.id]}
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- vaqtinchalik rating qiymatlari (ma'lumot kelganda almashtiriladi) ---------- */
const RSEED = (id: string) => {
  let h = 0
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) % 997
  return (85 + (h % 16)) / 10
}
const IcStar = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" /></svg>

/* ---------- promo slayder ---------- */
const SLIDES: { img: string; b: 'heroB1' | 'heroB2' | 'heroB3' | 'heroB4'; ti: 'heroT1' | 'heroT2' | 'heroT3' | 'heroT4'; s: 'heroS1' | 'heroS2' | 'heroS3' | 'heroS4'; to: string }[] = [
  { img: CDN + '2705b64b-3608-4b1b-bd69-adeb50ff7151', b: 'heroB1', ti: 'heroT1', s: 'heroS1', to: '/' },
  { img: CDN + '0c72e513-3fb1-43e1-9577-f89b156d45eb', b: 'heroB2', ti: 'heroT2', s: 'heroS2', to: '/' },
  { img: CDN + '4f6ef42a-e6ed-424d-80d2-8ae96078d201', b: 'heroB3', ti: 'heroT3', s: 'heroS3', to: '/cat/hit' },
  { img: CDN + '4dd85d27-a179-4483-816e-99ddede741e8', b: 'heroB4', ti: 'heroT4', s: 'heroS4', to: '/cat/set' },
]

export function HeroSlider() {
  const { t } = useStore()
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const n = SLIDES.length
  const timer = useRef<number | null>(null)
  const step = () => {
    const el = ref.current
    if (!el || el.children.length < 2) return 0
    return (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
  }
  const goTo = (k: number) => { const el = ref.current; if (el) el.scrollTo({ left: k * step(), behavior: 'smooth' }) }
  const start = () => { if (timer.current) clearInterval(timer.current); timer.current = window.setInterval(() => {
    const el = ref.current; if (!el) return
    const max = el.scrollWidth - el.clientWidth - 4
    if (el.scrollLeft >= max) el.scrollTo({ left: 0, behavior: 'smooth' })
    else el.scrollBy({ left: step(), behavior: 'smooth' })
  }, 5200) }
  useEffect(() => { start(); return () => { if (timer.current) clearInterval(timer.current) } }, [])
  const onScroll = () => {
    const el = ref.current; if (!el) return
    const st = step(); if (!st) return
    setI(Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / st))))
  }
  return (
    <div className="mt-3 lg:mt-5 select-none">
      <div className="relative">
        <div ref={ref} onScroll={onScroll}
          className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory px-3 lg:px-5"
          style={{ scrollbarWidth: 'none' }}>
          {SLIDES.map((sl, k) => (
            <div key={k} onClick={() => { haptic(); nav(sl.to) }}
              className="snap-center shrink-0 w-[88%] lg:w-[calc(100%-30px)] relative h-[196px] lg:h-[250px] rounded-[20px] overflow-hidden cursor-pointer bg-[#141B26]">
              <img src={sl.img} alt="" loading={k === 0 ? 'eager' : 'lazy'} decoding="async"
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/85 via-[#0B1220]/40 to-transparent" />
              <div className="relative h-full flex items-end lg:items-center pl-5 lg:pl-10 pr-4 lg:pr-6 pb-4 lg:pb-0">
                <div className="max-w-[75%] lg:max-w-[55%]">
                  <span className="inline-block bg-[#29A8E0] text-white px-2.5 py-1 rounded-full text-[9.5px] lg:text-[11.5px] font-extrabold uppercase tracking-[0.14em]">{(t as any)[sl.b]}</span>
                  <div className="mt-2 lg:mt-3.5 text-[20px] lg:text-[34px] font-extrabold leading-[1.1] tracking-tight text-white">{(t as any)[sl.ti]}</div>
                  <div className="mt-1.5 text-[11.5px] lg:text-[14px] font-medium text-white/75 leading-snug">{(t as any)[sl.s]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={e => { e.stopPropagation(); goTo((i - 1 + n) % n); start() }} className="press hidden lg:grid place-items-center absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-[#191919] shadow-[0_8px_24px_rgba(0,0,0,.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,.18)] transition-shadow"><IcChevL /></button>
        <button onClick={e => { e.stopPropagation(); goTo((i + 1) % n); start() }} className="press hidden lg:grid place-items-center absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-[#191919] shadow-[0_8px_24px_rgba(0,0,0,.12)] hover:shadow-[0_10px_28px_rgba(0,0,0,.18)] transition-shadow"><IcChevR /></button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={e => { e.stopPropagation(); goTo(k); start() }}
            className={`h-2 rounded-full transition-all duration-300 ${k === i ? 'w-5 bg-navy' : 'w-2 bg-[#D9D9DE]'}`} />
        ))}
      </div>
    </div>
  )
}

/* ---------- informer kartochkalar ---------- */
export function InfoTiles() {
  const { t } = useStore()
  const tiles = [
    { icon: <IcClock />, title: t.freeDelivery, sub: `${t.city} · ${t.dpTimeVal}`, cls: 'bg-[#1B2330] text-[#F2F5F9]', iconCls: 'bg-[#29A8E0]/15 text-[#29A8E0]' },
    { icon: <IcTag />, title: 'TEKIT10', sub: t.promoTileSub, cls: 'bg-[#1B2330] text-[#F2F5F9]', iconCls: 'bg-[#29A8E0]/15 text-[#29A8E0]' },
    { icon: <IcCash />, title: t.cash, sub: t.dpSoon, cls: 'bg-[#1B2330] text-[#F2F5F9]', iconCls: 'bg-[#29A8E0]/15 text-[#29A8E0]' },
  ]
  return (
    <div className="px-4 lg:px-0 mt-3 lg:mt-5 flex gap-2.5 overflow-x-auto no-scrollbar snap-x lg:grid lg:grid-cols-3 lg:overflow-visible">
      {tiles.map((x, k) => (
        <div key={k} className={`shrink-0 w-[290px] lg:w-auto snap-start rounded-[20px] px-4 py-4 flex items-center gap-3.5 ${x.cls}`}>
          <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${x.iconCls}`}>{x.icon}</span>
          <div className="min-w-0">
            <div className="text-[14.5px] font-extrabold leading-tight">{x.title}</div>
            <div className="text-[11.5px] font-medium opacity-70 leading-snug mt-0.5">{x.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- pastki tab-bar (faqat mobil) ---------- */
const ICONS = (on: boolean): Record<string, React.ReactNode> => ({
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  cart: <><path d="M6 6h15l-1.7 8.5a2 2 0 0 1-2 1.5H9.2a2 2 0 0 1-2-1.6L5.3 3.7A1 1 0 0 0 4.3 3H2" /><circle cx="9.5" cy="20" r="1.3" /><circle cx="17.5" cy="20" r="1.3" /></>,
  orders: <><path d="M5 3h14v16.3l-1.75 1.3-1.75-1.3-1.75 1.3-1.75-1.3-1.75 1.3-1.75-1.3-1.75 1.3L5 19.3z" /><path d="M8.5 8.5h7M8.5 12.5h7" fill="none" stroke={on ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" /></>,
  profile: <><circle cx="12" cy="7.7" r="3.7" /><path d="M4.6 20.6c1-4 3.9-6.4 7.4-6.4s6.4 2.4 7.4 6.4z" /></>,
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
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-[#0F1720] border-t border-[#1E2631] lg:hidden"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex">
        {tabs.map(tb => {
          const on = loc === tb.to
          return (
            <button key={tb.id} onClick={() => { if (!on) { haptic(); nav(tb.to) } }}
              className={`press flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-bold transition-colors ${on ? 'text-white' : 'text-[#6E7787]'}`}>
              <span className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${on ? 'bg-navy-soft px-4 py-1' : 'px-1 py-1'}`}>
                <svg width="23" height="23" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS(on)[tb.icon]}</svg>
                {tb.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-[#E8462B] text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-[#0F1720]">{cartCount}</span>
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

export function QtyPill({ p, small }: { p: { id: string }; small?: boolean }) {
  const { cart, add, setQty } = useStore()
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  const sW = small ? 'w-6 h-6' : 'w-7 h-7'
  return (
    <div onClick={e => e.stopPropagation()}
      className={small
        ? 'absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-white rounded-full p-0.5 shadow-[0_6px_14px_-4px_rgba(10,33,148,.45)]'
        : 'absolute bottom-2 right-2 flex items-center gap-0.5 bg-white rounded-full p-1 shadow-[0_6px_14px_-4px_rgba(10,33,148,.45)]'}>
      <button onClick={() => { setQty(p.id, q - 1); haptic('light') }}
        className={`press ${sW} rounded-full bg-navy-soft text-[#29A8E0] grid place-items-center active:scale-90 transition-transform`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 12h14" /></svg>
      </button>
      <span className={`text-[12px] font-extrabold text-[#29A8E0] ${small ? 'w-3.5' : 'w-4'} text-center`}>{q}</span>
      <button onClick={() => { add(p.id); haptic('medium') }}
        className={`press ${sW} rounded-full bg-navy text-white grid place-items-center active:scale-90 transition-transform`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  )
}

/* ---------- mahsulot kartochkasi ---------- */
export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, setQty, lang, favs, toggleFav, showToast, t, openP } = useStore()
  const fav = favs.includes(p.id)
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  return (
    <article onClick={() => { haptic(); openP(p) }}
      className="anim-up cursor-pointer"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className="relative aspect-[11/10] rounded-[12px] overflow-hidden bg-[#141B26]">
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-[#101821]/80 grid place-items-center active:scale-90 transition-transform">
          <Heart on={fav} s={15} />
        </button>
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#101821]/85 text-white text-[10.5px] font-extrabold px-1.5 py-1 rounded-[8px]">
          <IcStar /> {((p as any).rating ?? RSEED(p.id)).toFixed(1)}
        </span>
        {sale && (
          <span className="absolute top-11 left-2 bg-gradient-to-r from-[#FF8A3C] to-[#F5493D] text-white text-[10.5px] font-extrabold tracking-wide px-2 py-1 rounded-[8px]">−{p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)}%</span>
        )}
        {!sale && p.hit && <span className="absolute top-11 left-2 bg-[#101821]/85 text-white text-[10.5px] font-extrabold tracking-wide px-2 py-1 rounded-[8px]">{t.hit}</span>}
      </div>
      <div className="mt-2.5 text-[14.5px] font-bold leading-snug text-[#F2F5F9] line-clamp-2">{pName(p, lang)}</div>
      <div className="text-[12px] font-medium text-[#7A8494] mt-0.5 min-h-[16px]">{p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')}</div>
      {q > 0 ? (
        <div className="mt-2.5 w-full h-[44px] rounded-[12px] bg-[#E9EDF1] text-[#101821] flex items-center justify-between px-1.5">
          <button onClick={e => { e.stopPropagation(); setQty(p.id, q - 1); haptic('light') }}
            className="press w-9 h-9 rounded-[9px] grid place-items-center active:scale-90 transition-transform">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <span className="text-[14px] font-extrabold">{q}</span>
          <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium') }}
            className="press w-9 h-9 rounded-[9px] grid place-items-center active:scale-90 transition-transform">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      ) : (
        <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium'); showToast(t.added) }}
          className="press mt-2.5 w-full h-[44px] rounded-[12px] bg-[#E9EDF1] text-[#101821] flex items-center justify-center gap-2 text-[14.5px] font-extrabold active:scale-[.98] transition-transform">
          <IcBag /> {fmt(p.price)} <span className="text-[11px] font-bold text-[#5A6472]">UZS</span>
        </button>
      )}
      {sale && <div className="mt-1 text-[11px] font-bold text-[#7A8494] line-through">{fmt(p.old_price)} UZS</div>}
    </article>
  )
}

export function Sheet({ open, onClose, title, children, foot }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; foot?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Pastga surib yopish (surgich zonasi: dastak + sarlavha)
  const [dy, setDy] = React.useState(0)
  const [drag, setDrag] = React.useState(false)
  const [entered, setEntered] = React.useState(false)
  const st = React.useRef<{ y0: number; y: number; t: number } | null>(null)
  const vel = React.useRef(0)
  const timer = React.useRef<number | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 520)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  // Surib yopilganda holat tozalanadi: aks holda qayta ochilganda modal ko'rinmas va tegmas bo'lib qolardi
  useEffect(() => {
    if (open) return
    setDy(0); setDrag(false); st.current = null
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [open])

  const onDown = (e: React.TouchEvent) => {
    if (timer.current) return
    st.current = { y0: e.touches[0].clientY, y: e.touches[0].clientY, t: performance.now() }
    vel.current = 0
    setDrag(true)
  }
  const onMove = (e: React.TouchEvent) => {
    if (!st.current) return
    const y = e.touches[0].clientY
    const now = performance.now()
    const dt = now - st.current.t
    if (dt >= 8) vel.current = ((y - st.current.y) / dt) * 0.35 + vel.current * 0.65
    st.current = { ...st.current, y, t: now }
    let d = y - st.current.y0
    if (d < 0) d = 0
    else if (d > 260) d = 260 + (d - 260) * 0.15
    setDy(d)
  }
  const onEnd = () => {
    if (!st.current) return
    const d = dy
    st.current = null
    setDrag(false)
    const fast = vel.current > 1.0
    if (d > 130 || (fast && d > 36)) {
      setDy(window.innerHeight + 80)
      timer.current = window.setTimeout(onClose, 300)
    } else {
      setDy(0)
    }
  }

  if (!open) return null
  const moving = drag || dy > 0
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose}
        style={{ opacity: Math.max(0, 1 - dy / 420), transition: drag ? 'none' : 'opacity .3s' }} />
      <div
        className={`${!entered && !moving ? 'anim-sheet ' : ''}absolute left-0 right-0 bottom-0 bg-[#141B26] rounded-t-[26px] max-h-[90dvh] flex flex-col shadow-[0_-20px_60px_rgba(10,15,50,.25)] overscroll-contain select-none lg:top-0 lg:animate-none lg:h-fit lg:w-[480px] lg:mx-auto lg:rounded-[26px] lg:shadow-[0_24px_60px_rgba(10,15,50,.3)]`}
        style={{ transform: `translateY(${dy}px)`, transition: drag ? 'none' : 'transform .32s cubic-bezier(.32,.72,0,1)' }}>
        <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
          style={{ touchAction: 'none' }}>
          <div className="pt-2.5 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-[#2A3442] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-5 pt-1.5 pb-1">
            <h3 className="text-[18px] font-extrabold">{title}</h3>
            <button onClick={onClose} className="press w-8 h-8 rounded-full bg-navy-soft grid place-items-center text-[#7A8494]"><IcX /></button>
          </div>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 py-3 flex-1 overscroll-contain">{children}</div>
        {foot && <div style={{ paddingBottom: 'calc(14px + var(--sab))' }} className="px-5 pt-2">{foot}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Empty({ emoji, title, sub, action }: { emoji?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="py-14 text-center">
      <div className="relative w-28 h-28 mx-auto">
        <div className="absolute -inset-4 rounded-full bg-navy-soft/70 blur-2xl opacity-80" />
        <div className="relative tekit-pattern w-28 h-28 rounded-[30px] grid place-items-center text-white shadow-[0_16px_34px_-14px_rgba(10,33,148,.45)]"><IcPlate /></div>
      </div>
      <div className="mt-5 text-[17px] font-extrabold">{title}</div>
      {sub && <div className="mt-1.5 text-[13px] font-medium text-[#7A8494] max-w-[280px] mx-auto leading-relaxed">{sub}</div>}
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
    <div className="flex items-center bg-[#1B2330] border border-navy-line rounded-[13px] p-1">
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

export function ProductSheet() {
  const { sheetP, closeP, lang, t, add, setQty, cart, products, favs, toggleFav, showToast } = useStore()
  const [q, setQ] = React.useState(1)
  React.useEffect(() => { setQ(1) }, [sheetP?.id])
  if (!sheetP) return null
  const p = sheetP
  const fav = favs.includes(p.id)
  const sauces = products.filter(x => x.cat === 'sous' && x.id !== p.id && x.active !== false)
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  const hasKbju = [p.kcal, p.protein, p.fat, p.carbs].some(v => v != null && (v as number) > 0)
  return (
    <Sheet open onClose={closeP} title={pName(p, lang)}
      foot={
        <div className="flex gap-2.5 items-center">
          <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
          <button onClick={() => { add(p.id, q); haptic('medium'); showToast(t.added); closeP() }}
            className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.addCart} · {fmt(p.price * q)}
          </button>
        </div>
      }>
      <div>
        <div className="relative rounded-[18px] overflow-hidden bg-navy-soft">
          <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover" />
          <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
            className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full bg-[#101821]/80 grid place-items-center active:scale-90 transition-transform">
            <Heart on={fav} s={19} />
          </button>
          {p.pcs ? <span className="absolute bottom-2.5 left-3 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="text-[19px] font-extrabold leading-tight flex-1">{pName(p, lang)}</div>
          <div className="text-right">
            {(p.old_price ?? 0) > p.price && <div className="text-[12px] font-bold text-[#7A8494] line-through">{fmt(p.old_price)} UZS</div>}
            <div className="text-[18px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[#7A8494]"> UZS</span></div>
          </div>
        </div>
        {p.weight ? (
          <div className="mt-2 flex items-center gap-1.5 bg-[#1B2330] border border-navy-line rounded-xl px-3 py-2 w-fit text-[#29A8E0]">
            <IcScale />
            <span className="text-[12.5px] font-bold">{p.weight}</span>
          </div>
        ) : null}
        {p.cat !== 'sous' && sauces.length > 0 && (
          <div className="mt-3 bg-navy-soft/60 rounded-3xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-white grid place-items-center text-[#29A8E0] shrink-0 shadow-sm"><IcSauce /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-[#29A8E0] leading-tight">{t.sAsk}</div>
                <div className="text-[10.5px] font-semibold text-[#7A8494] leading-tight mt-0.5">{t.sSub}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-3.5 px-3.5 snap-x">
              {sauces.map(sa => {
                const sq = qtyOf(sa.id)
                return (
                  <div key={sa.id} className={'shrink-0 snap-start flex items-center gap-2 rounded-full bg-[#1B2330] border pl-1.5 pr-2 py-1.5 ' + (sq > 0 ? 'border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.35)]' : 'border-navy-line')}>
                    <img src={pImg(sa)} alt={pName(sa, lang)} loading="lazy" className="w-9 h-9 rounded-full object-cover bg-navy-soft" />
                    <div className="pr-0.5">
                      <div className="text-[11.5px] font-extrabold leading-none whitespace-nowrap">{pName(sa, lang)}</div>
                      <div className="text-[10px] font-bold text-[#7A8494] mt-1 leading-none">{fmt(sa.price)}</div>
                    </div>
                    {sq > 0 && (
                      <div className="flex items-center gap-1 ml-0.5">
                        <button onClick={() => { setQty(sa.id, sq - 1); haptic() }}
                          className="press w-6 h-6 rounded-full bg-[#1B2330] border border-navy-line text-[#29A8E0] text-[12px] font-extrabold grid place-items-center active:scale-90 transition-transform">−</button>
                        <span className="w-3.5 text-center text-[11.5px] font-extrabold">{sq}</span>
                      </div>
                    )}
                    <button onClick={() => { if (sq > 0) { setQty(sa.id, sq + 1); haptic() } else { add(sa.id, 1); haptic('light'); showToast(t.added) } }}
                      className="press w-7 h-7 rounded-full bg-navy text-white text-[15px] font-extrabold grid place-items-center shadow-[0_4px_10px_-3px_rgba(10,33,148,.5)] active:scale-90 transition-transform">+</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {hasKbju && (
          <div className="mt-3.5 bg-[#1B2330] border border-navy-line rounded-2xl px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold text-[#7A8494] uppercase tracking-widest">КБЖУ</span>
              <span className="text-[10.5px] font-bold text-[#6E7787]">{t.per100}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {([[t.nKcal, p.kcal], [t.nProt, p.protein], [t.nFat, p.fat], [t.nCarb, p.carbs]] as const).map(([label, val]) => (
                <div key={label} className="bg-navy-soft/70 rounded-xl py-2 text-center">
                  <div className="text-[15px] font-extrabold text-[#29A8E0] leading-none">{val != null ? val : '—'}</div>
                  <div className="mt-1 text-[9.5px] font-bold text-[#7A8494] leading-none">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#8B94A3] font-medium whitespace-pre-line">{pDesc(p, lang)}</p>
      </div>
    </Sheet>
  )
}
