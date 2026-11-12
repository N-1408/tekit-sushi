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
            <div className="text-[17px] font-extrabold flex-1 truncate">{title}</div>
          </>
        ) : (
          <>
            <WhaleMark size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[11px] font-semibold text-[#8A93B8] leading-tight truncate">{hiName(t, user)}</div>
            </div>
          </>
        )}
        {right ?? (
          <div className="flex items-center gap-2">
            <LangPicker />
            <button onClick={() => nav('/cart')} className="press relative w-10 h-10 rounded-full bg-white border border-navy-line grid place-items-center text-navy-ink shadow-sm active:scale-90 transition-transform">
              <ShoppingCart size={18} strokeWidth={2.2} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-paper">{cartCount}</span>}
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
        className="press flex items-center gap-1.5 bg-white border border-navy-line rounded-full px-2.5 py-2 text-[12px] font-extrabold text-navy-ink shadow-sm active:scale-95 transition-transform">
        <span className="text-[15px] leading-none">{FLAGS[lang]}</span>{lang.toUpperCase()}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.language}>
        <div className="space-y-2 pb-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); setOpen(false) }}
              className={`press w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${lang === l ? 'bg-navy text-white border-navy shadow-btn' : 'bg-white border-navy-line'}`}>
              <span className="text-[22px]">{FLAGS[l]}</span>
              <span className="text-[15px] font-extrabold flex-1">{LANG_NAME[l]}</span>
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
            <div className="text-[14px] font-extrabold leading-tight">{t.brand}</div>
            <div className="text-[10px] font-semibold text-[#8A93B8]">{t.city}</div>
          </div>
        </div>
        {tabs.map(tb => {
          const on = loc === tb.to
          return (
            <button key={tb.id} onClick={() => { if (!on) { haptic(); nav(tb.to) } }}
              className={`press hov flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-bold transition-colors lg:flex-none lg:flex-row lg:gap-3 lg:w-full lg:px-3.5 lg:py-3 lg:rounded-2xl lg:text-[13.5px] ${on ? 'text-navy lg:bg-navy lg:text-white' : 'text-[#A2A9C6] lg:text-[#5A628A]'}`}>
              <span className="relative flex items-center justify-center">
                {ICONS(on)[tb.icon]}
                {tb.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-accent text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-white">{cartCount}</span>
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
      <span className={`text-[12px] font-extrabold text-navy ${small ? 'w-3.5' : 'w-4'} text-center`}>{q}</span>
      <button onClick={() => { add(p.id); haptic('medium') }}
        className={`press ${sW} rounded-full bg-navy text-white grid place-items-center active:scale-90 transition-transform`}>
        <Plus size={13} strokeWidth={2.6} />
      </button>
    </div>
  )
}

export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, lang, favs, toggleFav, showToast, t, openP } = useStore()
  const fav = favs.includes(p.id)
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  return (
    <article onClick={() => { haptic(); openP(p) }}
      className="anim-up bg-white border border-navy-line rounded-[20px] overflow-hidden active:scale-[.975] transition-transform duration-200 cursor-pointer shadow-card"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className="relative aspect-square bg-navy-soft">
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 grid place-items-center shadow-sm active:scale-90 transition-transform">
          <Heart size={16} strokeWidth={2} fill={fav ? '#E23B52' : 'none'} color={fav ? '#E23B52' : '#8A93B8'} />
        </button>
        {sale ? (
          <span className="absolute top-2 left-2 bg-accent text-white text-[9.5px] font-extrabold tracking-wide uppercase px-2 py-1 rounded-lg shadow">−{p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)}%</span>
        ) : p.hit ? <span className="absolute top-2 left-2 bg-navy text-white text-[9.5px] font-extrabold tracking-wide uppercase px-2 py-1 rounded-lg">{t.hit}</span> : null}
        {(() => {
          const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
          return q > 0 ? <QtyPill p={p} /> : (
            <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium'); showToast(t.added) }}
              className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-navy text-white grid place-items-center shadow-btn active:scale-90 transition-transform">
              <Plus size={16} strokeWidth={2.6} />
            </button>
          )
        })()}
      </div>
      <div className="p-2.5">
        <div className="text-[13.5px] font-bold leading-snug line-clamp-2 min-h-[36px]">{pName(p, lang)}</div>
        <div className="text-[11px] font-semibold text-[#8A93B8] mt-0.5 min-h-[15px]">{p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')}</div>
        <div className="mt-1.5 text-[15px] font-extrabold tracking-tight flex items-baseline gap-1.5">
          {fmt(p.price)} <span className="text-[11px] font-bold text-[#8A93B8]">UZS</span>
          {(p.old_price ?? 0) > p.price && <span className="text-[11px] font-bold text-[#8A93B8] line-through">{fmt(p.old_price)}</span>}
        </div>
      </div>
    </article>
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
            <h3 className="text-[18px] font-extrabold">{title}</h3>
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
      <div className="mt-5 text-[17px] font-extrabold">{title}</div>
      {sub && <div className="mt-1.5 text-[13px] font-medium text-[#8A93B8] max-w-[280px] mx-auto leading-relaxed">{sub}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function BigButton({ children, onClick, disabled, ghost, type, accent }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; type?: 'button' | 'submit'; accent?: boolean
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`press w-full py-4 rounded-2xl text-[15.5px] font-extrabold flex items-center justify-center gap-2 transition-all
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
      <span className="min-w-[30px] text-center text-[15px] font-extrabold">{q}</span>
      <button onClick={onInc} className={`${b} rounded-[11px] grid place-items-center text-navy active:bg-navy-soft active:scale-90 transition-transform`}><Plus size={16} strokeWidth={2.6} /></button>
    </div>
  )
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    new: 'bg-accent-soft text-accent-deep', confirmed: 'bg-blue-100 text-blue-700', cooking: 'bg-purple-100 text-purple-700',
    delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
  }
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors[status] || 'bg-navy-soft text-navy-ink'}`}>{label}</span>
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
            className="press flex-1 py-3.5 rounded-2xl bg-accent text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-10px_rgba(255,106,43,.7)] active:scale-[.98] transition-transform">
            {t.addCart} · {fmt(p.price * q)}
          </button>
        </div>
      }>
      <div>
        <div className="relative rounded-[20px] overflow-hidden bg-navy-soft">
          <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover" />
          <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
            className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full bg-white grid place-items-center shadow-md active:scale-90 transition-transform">
            <Heart size={19} strokeWidth={2} fill={fav ? '#E23B52' : 'none'} color={fav ? '#E23B52' : '#8A93B8'} />
          </button>
          {p.weight ? <span className="absolute bottom-2.5 left-3 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.weight}</span> : null}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="text-[19px] font-extrabold leading-tight flex-1">{pName(p, lang)}</div>
          <div className="text-right">
            {(p.old_price ?? 0) > p.price && <div className="text-[12px] font-bold text-[#8A93B8] line-through">{fmt(p.old_price)} UZS</div>}
            <div className="text-[18px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[#8A93B8]"> UZS</span></div>
          </div>
        </div>
        {p.cat !== 'sous' && sauces.length > 0 && (
          <div className="mt-3 bg-navy-soft/60 rounded-3xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-white grid place-items-center text-navy shrink-0 shadow-sm"><UtensilsCrossed size={15} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-navy leading-tight">{t.sAsk}</div>
                <div className="text-[10.5px] font-semibold text-[#8A93B8] leading-tight mt-0.5">{t.sSub}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-3.5 px-3.5 snap-x">
              {sauces.map(sa => {
                const sq = qtyOf(sa.id)
                return (
                  <div key={sa.id} className={'shrink-0 snap-start flex items-center gap-2 rounded-full bg-white border pl-1.5 pr-2 py-1.5 ' + (sq > 0 ? 'border-navy shadow-btn' : 'border-navy-line')}>
                    <img src={pImg(sa)} alt={pName(sa, lang)} loading="lazy" className="w-9 h-9 rounded-full object-cover bg-navy-soft" />
                    <div className="pr-0.5">
                      <div className="text-[11.5px] font-extrabold leading-none whitespace-nowrap">{pName(sa, lang)}</div>
                      <div className="text-[10px] font-bold text-[#8A93B8] mt-1 leading-none">{fmt(sa.price)}</div>
                    </div>
                    {sq > 0 && (
                      <div className="flex items-center gap-1 ml-0.5">
                        <button onClick={() => { setQty(sa.id, sq - 1); haptic() }}
                          className="press w-6 h-6 rounded-full bg-white border border-navy-line text-navy grid place-items-center active:scale-90 transition-transform"><Minus size={12} strokeWidth={2.6} /></button>
                        <span className="w-3.5 text-center text-[11.5px] font-extrabold">{sq}</span>
                      </div>
                    )}
                    <button onClick={() => { if (sq > 0) { setQty(sa.id, sq + 1); haptic() } else { add(sa.id, 1); haptic('light'); showToast(t.added) } }}
                      className="press w-7 h-7 rounded-full bg-navy text-white grid place-items-center shadow-btn active:scale-90 transition-transform"><Plus size={14} strokeWidth={2.6} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {hasKbju && (
          <div className="mt-3.5 bg-white border border-navy-line rounded-2xl px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold text-[#8A93B8] uppercase tracking-widest">КБЖУ</span>
              <span className="text-[10.5px] font-bold text-[#A2A9C6]">{t.per100}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {([[t.nKcal, p.kcal], [t.nProt, p.protein], [t.nFat, p.fat], [t.nCarb, p.carbs]] as const).map(([label, val]) => (
                <div key={label} className="bg-navy-soft/70 rounded-xl py-2 text-center">
                  <div className="text-[15px] font-extrabold text-navy leading-none">{val != null ? val : '—'}</div>
                  <div className="mt-1 text-[9.5px] font-bold text-[#8A93B8] leading-none">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#4A5270] font-medium whitespace-pre-line">{pDesc(p, lang)}</p>
      </div>
    </Sheet>
  )
}
