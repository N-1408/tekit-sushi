import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { pDesc } from '../lib/store'
import { haptic, useNativeBack, tgUser } from '../lib/tg'
import { CAT_ICON, Heart, Search, Home, ShoppingCart, User, MapPin, Phone, Clock, Plus, Minus, X, ChevronRight, ChevronLeft, ArrowLeft, Percent, Sparkles, Check, ChefHat, Timer, Bike, Flame, UtensilsCrossed, Info, Receipt } from '../lib/icons'

export function WhaleMark({ size = 40 }: { size?: number }) {
  return <img src="/logo.png" width={size} height={size} className="rounded-[12px]" alt="" />
}

function hiName(t: any, user: { name?: string } | null) {
  let h = 12
  try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent' }).format(new Date())) } catch {}
  const g = h >= 5 && h < 12 ? t.greetMorning : h < 18 ? t.greetDay : t.greetEvening
  return `${g}, ${user?.name || tgUser()?.first_name || t.greetGuest}!`
}

/* ---------- Top bar: kgsushi uslubi — chapda uy/orqaga, markazda logo, o'ngda til va savat ---------- */
export function TopBar({ title, right, back = true }: { title?: string; right?: React.ReactNode; back?: boolean }) {
  const { t, user, cartCount } = useStore()
  const nav = useNavigate()
  useNativeBack(!!title && back)
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-md border-b border-navy-line"
      style={{ paddingTop: 'calc(10px + var(--sat))' }}>
      <div className="flex items-center gap-2.5 px-4 lg:px-6 pb-2.5 lg:max-w-[1240px] lg:mx-auto">
        {title ? (
          <>
            <button onClick={() => nav(-1)} className="press w-10 h-10 rounded-full bg-white border border-navy-line grid place-items-center text-navy-ink shadow-sm active:scale-90 transition-transform">
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
            <div className="text-[19px] font-extrabold flex-1 truncate">{title}</div>
          </>
        ) : (
          <>
            <WhaleMark size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[12.5px] font-semibold text-[#8A93B8] leading-tight truncate">{hiName(t, user)}</div>
            </div>
          </>
        )}
        {right ?? (
          <div className="flex items-center gap-2">
            <LangPicker />
            <button onClick={() => nav('/cart')} className="press relative w-10 h-10 rounded-full bg-white border border-navy-line grid place-items-center text-navy-ink shadow-sm active:scale-90 transition-transform">
              <ShoppingCart size={18} strokeWidth={2.2} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[11.5px] font-extrabold grid place-items-center leading-none border-2 border-paper">{cartCount}</span>}
            </button>
          </div>
        )}
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
        className="press flex items-center gap-1.5 bg-white border border-navy-line rounded-full px-2.5 py-2 text-[13.5px] font-extrabold text-navy-ink shadow-sm active:scale-95 transition-transform">
        <span className="text-[16.5px] leading-none">{FLAGS[lang]}</span>{lang.toUpperCase()}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.language}>
        <div className="space-y-2 pb-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); setOpen(false) }}
              className={`press w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${lang === l ? 'bg-navy text-white border-navy shadow-btn' : 'bg-white border-navy-line'}`}>
              <span className="text-[24px]">{FLAGS[l]}</span>
              <span className="text-[16.5px] font-extrabold flex-1">{LANG_NAME[l]}</span>
              {lang === l && <Check size={18} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}

const ICONS = (on: boolean): Record<string, React.ReactNode> => ({
  home: <Home size={23} strokeWidth={on ? 2.4 : 2} />,
  cart: <ShoppingCart size={23} strokeWidth={on ? 2.4 : 2} />,
  orders: <Receipt size={23} strokeWidth={on ? 2.4 : 2} />,
  profile: <User size={23} strokeWidth={on ? 2.4 : 2} />,
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
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line lg:right-auto lg:top-0 lg:w-[220px] lg:border-t-0 lg:border-r lg:bg-paper"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex lg:flex-col lg:gap-1.5 lg:px-3 lg:pt-4">
        <div className="hidden lg:flex items-center gap-2.5 px-2.5 pt-1 pb-4">
          <WhaleMark size={38} />
          <div>
            <div className="text-[15.5px] font-extrabold leading-tight">{t.brand}</div>
            <div className="text-[11.5px] font-semibold text-[#8A93B8]">{t.city}</div>
          </div>
        </div>
        {tabs.map(tb => {
          const on = loc === tb.to
          return (
            <button key={tb.id} onClick={() => { if (!on) { haptic(); nav(tb.to) } }}
              className={`press hov flex-1 flex flex-col items-center gap-0.5 pt-2 text-[12px] font-bold transition-colors lg:flex-none lg:flex-row lg:gap-3 lg:w-full lg:px-3.5 lg:py-3 lg:rounded-2xl lg:text-[15px] ${on ? 'text-navy lg:bg-navy lg:text-white' : 'text-[#A2A9C6] lg:text-[#5A628A]'}`}>
              <span className="relative flex items-center justify-center">
                {ICONS(on)[tb.icon]}
                {tb.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-accent text-white text-[11.5px] font-extrabold grid place-items-center leading-none border-2 border-white">{cartCount}</span>
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
        ? 'absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-white rounded-full p-0.5 shadow-pop'
        : 'absolute bottom-2 right-2 flex items-center gap-0.5 bg-white rounded-full p-1 shadow-pop'}>
      <button onClick={() => { setQty(p.id, q - 1); haptic('light') }}
        className={`press ${sW} rounded-full bg-navy-soft text-navy grid place-items-center active:scale-90 transition-transform`}>
        <Minus size={13} strokeWidth={2.6} />
      </button>
      <span className={`text-[13.5px] font-extrabold text-navy ${small ? 'w-3.5' : 'w-4'} text-center`}>{q}</span>
      <button onClick={() => { add(p.id); haptic('medium') }}
        className={`press ${sW} rounded-full bg-navy text-white grid place-items-center active:scale-90 transition-transform`}>
        <Plus size={13} strokeWidth={2.6} />
      </button>
    </div>
  )
}

export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, setQty, lang, favs, toggleFav, showToast, t, openP } = useStore()
  const fav = favs.includes(p.id)
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  return (
    <article onClick={() => { haptic(); openP(p) }}
      className="anim-up cursor-pointer overflow-hidden rounded-[14px] bg-white active:scale-[.985] transition-transform duration-200"
      style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}>
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#F4F4F6]">
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm active:scale-90 transition-transform">
          <Heart size={16} strokeWidth={2} fill={fav ? '#E23B52' : 'none'} color={fav ? '#E23B52' : '#8A93B8'} />
        </button>
        {sale ? (
          <span className="absolute left-2 top-2 rounded-lg bg-accent px-2 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-white shadow">−{p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)}%</span>
        ) : p.hit ? <span className="absolute left-2 top-2 rounded-lg bg-navy px-2 py-1 text-[11.5px] font-extrabold uppercase tracking-wide text-white">{t.hit}</span> : null}
      </div>
      <div className="px-1.5 pt-2">
        <div className="line-clamp-2 min-h-[38px] text-[15.5px] font-bold leading-snug text-[#111]">{pName(p, lang)}</div>
        <div className="mt-0.5 min-h-[16px] text-[13.5px] font-medium text-[#8A8FA3]">{p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {q > 0 ? (
            <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 rounded-full bg-[#F2F2F4] p-1">
              <button onClick={() => { setQty(p.id, q - 1); haptic('light') }} className="press grid h-7 w-7 place-items-center rounded-full bg-white text-[#111] active:scale-90 transition-transform"><Minus size={14} strokeWidth={2.6} /></button>
              <span className="w-4 text-center text-[14px] font-extrabold">{q}</span>
              <button onClick={() => { add(p.id); haptic('medium') }} className="press grid h-7 w-7 place-items-center rounded-full bg-accent text-white active:scale-90 transition-transform"><Plus size={14} strokeWidth={2.6} /></button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium'); showToast(t.added) }}
              className="press flex items-center gap-1.5 rounded-full bg-[#F2F2F4] px-3.5 py-2 text-[14.5px] font-extrabold text-[#111] active:scale-95 transition-transform">
              {fmt(p.price)}
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white"><Plus size={12} strokeWidth={2.8} /></span>
            </button>
          )}
          {(p.old_price ?? 0) > p.price && <span className="text-[12.5px] font-bold text-[#A2A9C6] line-through">{fmt(p.old_price)}</span>}
        </div>
      </div>
    </article>
  )
}


/* Sub-sahifa sarlavha qatori: kgsushi breadcrumb uslubi (uy tugmasi + sarlavha) */
export function SubBar({ title, right }: { title?: string; right?: React.ReactNode }) {
  const st = useStore() as any
  const nav = useNavigate()
  return (
    <div className="flex items-center gap-3 px-3 pt-[calc(72px+var(--sat))] lg:pt-[80px]">
      <button onClick={() => { haptic(); nav('/') }}
        className="press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F2F2F4] text-[#111] active:scale-90 transition-transform">
        <Home size={18} strokeWidth={2.2} />
      </button>
      {title ? <h1 className="min-w-0 flex-1 truncate text-[22px] font-extrabold text-[#111] lg:text-[28px]">{title}</h1> : <div className="flex-1" />}
      {right}
    </div>
  )
}

/* ---------- Kategoriya chiplari (ikonali, emojisisiz) ---------- */
export function CatChips({ active, onPick }: { active?: string | null; onPick?: (id: string) => void }) {
  const { lang, t, products } = useStore()
  const nav = useNavigate()
  const cats = (window as any).__CATS__ || []
  return null
}

export function Sheet({ open, onClose, title, children, foot }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; foot?: React.ReactNode
}) {
  React.useEffect(() => {
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

  React.useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 520)
    return () => clearTimeout(id)
  }, [])
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  React.useEffect(() => {
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
      <div className="absolute inset-0 bg-navy-deep/45 backdrop-blur-[2px]" onClick={onClose}
        style={{ opacity: Math.max(0, 1 - dy / 420), transition: drag ? 'none' : 'opacity .3s' }} />
      <div
        className={`${!entered && !moving ? 'anim-sheet ' : ''}absolute left-0 right-0 bottom-0 bg-white rounded-t-[28px] max-h-[90dvh] flex flex-col shadow-pop overscroll-contain select-none lg:top-0 lg:animate-none lg:h-fit lg:w-[520px] lg:mx-auto lg:rounded-[28px] lg:shadow-pop`}
        style={{ transform: `translateY(${dy}px)`, transition: drag ? 'none' : 'transform .32s cubic-bezier(.32,.72,0,1)' }}>
        <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
          style={{ touchAction: 'none' }}>
          <div className="pt-2.5 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-[#D8DCEA] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-5 pt-1.5 pb-1">
            <h3 className="text-[20px] font-extrabold">{title}</h3>
            <button onClick={onClose} className="press w-8 h-8 rounded-full bg-navy-soft grid place-items-center text-[#8A93B8]">
              <X size={15} strokeWidth={2.8} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-3 flex-1 overscroll-contain">{children}</div>
        {foot && <div style={{ paddingBottom: 'calc(14px + var(--sab))' }} className="px-5 pt-2">{foot}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Empty({ emoji, title, sub, action }: { emoji: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="py-14 text-center">
      <div className="relative w-28 h-28 mx-auto">
        <div className="absolute -inset-4 rounded-full bg-navy-soft/70 blur-2xl opacity-80" />
        <div className="relative tekit-pattern w-28 h-28 rounded-[30px] grid place-items-center text-white shadow-pop">
          <UtensilsCrossed size={44} strokeWidth={1.6} />
        </div>
      </div>
      <div className="mt-5 text-[19px] font-extrabold">{title}</div>
      {sub && <div className="mt-1.5 text-[14.5px] font-medium text-[#8A93B8] max-w-[280px] mx-auto leading-relaxed">{sub}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function BigButton({ children, onClick, disabled, ghost, type, accent }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; type?: 'button' | 'submit'; accent?: boolean
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`press w-full py-4 rounded-2xl text-[17px] font-extrabold flex items-center justify-center gap-2 transition-all
        ${ghost ? 'bg-white text-navy-ink border border-navy-line' : accent ? 'bg-accent text-white shadow-[0_10px_22px_-10px_rgba(255,106,43,.65)]' : 'bg-navy text-white shadow-btn'} disabled:opacity-40`}>
      {children}
    </button>
  )
}

export function Qty({ q, onInc, onDec, small }: { q: number; onInc: () => void; onDec: () => void; small?: boolean }) {
  const b = small ? 'w-8 h-8' : 'w-9 h-9'
  return (
    <div className="flex items-center bg-white border border-navy-line rounded-[14px] p-1">
      <button onClick={onDec} className={`${b} rounded-[11px] grid place-items-center text-navy active:bg-navy-soft active:scale-90 transition-transform`}><Minus size={16} strokeWidth={2.6} /></button>
      <span className="min-w-[30px] text-center text-[16.5px] font-extrabold">{q}</span>
      <button onClick={onInc} className={`${b} rounded-[11px] grid place-items-center text-navy active:bg-navy-soft active:scale-90 transition-transform`}><Plus size={16} strokeWidth={2.6} /></button>
    </div>
  )
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    new: 'bg-accent-soft text-accent-deep', confirmed: 'bg-blue-100 text-blue-700', cooking: 'bg-purple-100 text-purple-700',
    delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
  }
  return <span className={`text-[12.5px] font-bold px-2.5 py-1 rounded-full ${colors[status] || 'bg-navy-soft text-navy-ink'}`}>{label}</span>
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

  const infoCol = (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5 overscroll-contain">
        <div className="text-[22px] font-extrabold leading-tight text-[#111] lg:text-[24px]">{pName(p, lang)}</div>
        {p.weight && <div className="mt-1 text-[14.5px] font-medium text-[#8A8FA3]">{p.weight}</div>}
        <p className="mt-2 text-[15px] leading-relaxed text-[#6B6F80] whitespace-pre-line">{pDesc(p, lang)}</p>
        {hasKbju && (
          <div className="mt-4 rounded-[12px] bg-[#F2F2F4] px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#8A8FA3]">КБЖУ</span>
              <span className="text-[12px] font-bold text-[#A2A9C6]">{t.per100}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {([[t.nKcal, p.kcal], [t.nProt, p.protein], [t.nFat, p.fat], [t.nCarb, p.carbs]] as const).map(([label, val]) => (
                <div key={label} className="py-1 text-center">
                  <div className="text-[18px] font-extrabold leading-none text-[#111]">{val != null ? val : '—'}</div>
                  <div className="mt-1 text-[11px] font-bold leading-none text-[#8A8FA3]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {p.cat !== 'sous' && sauces.length > 0 && (
          <div className="mt-3.5 rounded-[12px] bg-[#F2F2F4] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-navy shadow-sm"><UtensilsCrossed size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold leading-tight text-navy">{t.sAsk}</div>
                <div className="mt-0.5 text-[12px] font-semibold leading-tight text-[#8A8FA3]">{t.sSub}</div>
              </div>
            </div>
            <div className="-mx-3.5 mt-3 flex snap-x gap-2 overflow-x-auto px-3.5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              {sauces.map(sa => {
                const sq = qtyOf(sa.id)
                return (
                  <div key={sa.id} className={'flex shrink-0 snap-start items-center gap-2 rounded-full border bg-white py-1.5 pl-1.5 pr-2 ' + (sq > 0 ? 'border-navy' : 'border-transparent')}>
                    <img src={pImg(sa)} alt={pName(sa, lang)} loading="lazy" className="h-9 w-9 rounded-full bg-[#F4F4F6] object-cover" />
                    <div className="pr-0.5">
                      <div className="whitespace-nowrap text-[13px] font-extrabold leading-none">{pName(sa, lang)}</div>
                      <div className="mt-1 text-[11.5px] font-bold leading-none text-[#8A8FA3]">{fmt(sa.price)}</div>
                    </div>
                    {sq > 0 && (
                      <div className="ml-0.5 flex items-center gap-1">
                        <button onClick={() => { setQty(sa.id, sq - 1); haptic() }} className="press grid h-6 w-6 place-items-center rounded-full border border-navy-line bg-white text-navy active:scale-90 transition-transform"><Minus size={12} strokeWidth={2.6} /></button>
                        <span className="w-3.5 text-center text-[13px] font-extrabold">{sq}</span>
                      </div>
                    )}
                    <button onClick={() => { if (sq > 0) { setQty(sa.id, sq + 1); haptic() } else { add(sa.id, 1); haptic('light'); showToast(t.added) } }}
                      className="press grid h-7 w-7 place-items-center rounded-full bg-accent text-white active:scale-90 transition-transform"><Plus size={14} strokeWidth={2.6} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 lg:px-6" style={{ paddingBottom: 'calc(16px + var(--sab))' }}>
        <div className="flex items-center gap-2.5">
          <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
          <button onClick={() => { add(p.id, q); haptic('medium'); showToast(t.added); closeP() }}
            className="press flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-accent py-3.5 text-[18px] font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(255,106,43,.7)] active:scale-[.98] transition-transform">
            {fmt(p.price * q)}
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-navy-deep/45" onClick={closeP} />
      {/* Mobil: pastdan chiqadigan varaq */}
      <div className="anim-sheet absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-pop overscroll-contain select-none lg:hidden"
        style={{ paddingBottom: 0 }}>
        <div className="pt-2.5 pb-1">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-[#D8DCEA]" />
        </div>
        <div className="relative aspect-square overflow-hidden bg-[#F4F4F6]">
          <img src={pImg(p)} alt={pName(p, lang)} className="h-full w-full object-cover" />
          <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md active:scale-90 transition-transform">
            <Heart size={19} strokeWidth={2} fill={fav ? '#E23B52' : 'none'} color={fav ? '#E23B52' : '#8A93B8'} />
          </button>
        </div>
        {infoCol}
      </div>
      {/* Desktop: kgsushi split modal (rasm chapda, ma'lumot o'ngda) */}
      <div className="absolute left-1/2 top-1/2 hidden w-[860px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] bg-white shadow-pop lg:flex lg:h-[560px]">
        <button onClick={closeP} className="press absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-[#F4F4F4] text-[#111] active:scale-90 transition-transform"><X size={17} strokeWidth={2.4} /></button>
        <div className="relative w-[55%] shrink-0 bg-[#F4F4F6]">
          <img src={pImg(p)} alt={pName(p, lang)} className="h-full w-full object-cover" />
          <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
            className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md active:scale-90 transition-transform">
            <Heart size={19} strokeWidth={2} fill={fav ? '#E23B52' : 'none'} color={fav ? '#E23B52' : '#8A93B8'} />
          </button>
        </div>
        {infoCol}
      </div>
    </div>,
    document.body
  )
}
