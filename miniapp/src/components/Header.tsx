import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, CATS, pName } from '../lib/store'
import { haptic, useNativeBack, tgUser } from '../lib/tg'
import { Menu, ShoppingCart, User, Home as HomeIcon, X, ChevronRight, Receipt, Bike } from '../lib/icons'
import { WhaleMark } from './ui'

const FLAGS: Record<string, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' }
const LANG_NAME: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' }

/* kgsushi uslubi: chapda hamburger, markazda logo, o'ngda profil va savat.
   Bosh sahifada hero ustida shaffof, scroll yoki boshqa sahifada oq fonda. */
export function Header({ overHero }: { overHero?: boolean }) {
  const { t, lang, setLang, user, cartCount, favs } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > (overHero ? 40 : 0))
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [overHero])
  const solid = !overHero || scrolled
  const dark = solid
  const isSub = loc.pathname !== '/'

  return (
    <>
      <header className={`fixed left-0 right-0 top-0 z-40 transition-colors duration-300 ${solid ? 'bg-white shadow-[0_1px_0_rgba(14,24,57,.08)]' : 'bg-transparent'}`}
        style={{ paddingTop: 'calc(8px + var(--sat))', paddingBottom: 8 }}>
        <div className="mx-auto flex max-w-[1020px] items-center gap-2 px-3 lg:px-4">
          <button onClick={() => { haptic(); setDrawer(true) }}
            className={`press grid h-10 w-10 place-items-center rounded-full active:scale-90 transition-transform ${dark ? 'bg-[#F2F2F4] text-[#111]' : 'bg-black/25 text-white backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,.18)]'}`}>
            <Menu size={20} strokeWidth={2.2} />
          </button>
          <button onClick={() => { if (loc.pathname !== '/') { haptic(); nav('/') } }} className="press flex flex-1 items-center justify-center gap-2">
            <WhaleMark size={34} />
            <span className={`text-[14px] font-extrabold uppercase tracking-wide ${dark ? 'text-[#111]' : 'text-white'} lg:text-[15px]`}>{t.brand}</span>
          </button>
          <button onClick={() => { haptic(); nav('/profile') }}
            className={`press grid h-10 w-10 place-items-center rounded-full active:scale-90 transition-transform ${dark ? 'bg-[#F2F2F4] text-[#111]' : 'bg-black/25 text-white backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,.18)]'}`}>
            <User size={20} strokeWidth={2.2} />
          </button>
          <button onClick={() => { haptic(); nav('/cart') }}
            className={`press relative grid h-10 w-10 place-items-center rounded-full active:scale-90 transition-transform ${dark ? 'bg-[#F2F2F4] text-[#111]' : 'bg-black/25 text-white backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,.18)]'}`}>
            <ShoppingCart size={20} strokeWidth={2.2} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-accent text-[10px] font-extrabold leading-none text-white">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Hamburger drawer: kategoriyalar + asosiy bo'limlar */}
      {drawer && <Drawer open={drawer} onClose={() => setDrawer(false)} />}
      {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
    </>
  )
}

function LangSheet({ onClose }: { onClose: () => void }) {
  const { t, lang, setLang } = useStore()
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-navy-deep/45" onClick={onClose} />
      <div className="anim-sheet absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white p-5 shadow-pop"
        style={{ paddingBottom: 'calc(20px + var(--sab))' }}>
        <div className="mb-3 text-[18px] font-extrabold">{t.language}</div>
        <div className="space-y-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); onClose() }}
              className={`press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${lang === l ? 'border-navy bg-navy text-white' : 'border-navy-line bg-white'}`}>
              <span className="text-[22px]">{FLAGS[l]}</span>
              <span className="flex-1 text-[15px] font-extrabold">{LANG_NAME[l]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, products, user, role } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [langOpen, setLangOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  const links = [
    { to: '/', label: t.toHome, icon: <HomeIcon size={18} strokeWidth={2.2} /> },
    { to: '/cart', label: t.tabCart, icon: <ShoppingCart size={18} strokeWidth={2.2} /> },
    { to: '/orders', label: t.tabOrders, icon: <Receipt size={18} strokeWidth={2.2} /> },
    { to: '/profile', label: t.tabProfile, icon: <User size={18} strokeWidth={2.2} /> },
  ]
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-navy-deep/45" onClick={onClose} />
      <aside className="absolute left-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-pop"
        style={{ paddingTop: 'calc(16px + var(--sat))', animation: 'drawerIn .32s cubic-bezier(.32,.72,0,1)' }}>
        <div className="flex items-center gap-2.5 px-4 pb-4">
          <WhaleMark size={40} />
          <div className="flex-1">
            <div className="text-[15px] font-extrabold">{t.brand}</div>
            <div className="text-[11px] font-semibold text-[#8A93B8]">{t.city}</div>
          </div>
          <button onClick={onClose} className="press grid h-9 w-9 place-items-center rounded-full bg-[#F2F2F4] text-[#111]"><X size={16} strokeWidth={2.6} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {links.map(l => (
            <button key={l.to} onClick={() => { haptic(); onClose(); nav(l.to) }}
              className={`press flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[14px] font-bold ${loc.pathname === l.to ? 'bg-navy text-white' : 'text-[#111] hover:bg-[#F7F7F9]'}`}>
              {l.icon}{l.label}
            </button>
          ))}
          <div className="mt-4 px-3.5 pb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#A2A9C6]">{t.navMenu}</div>
          {CATS.map(c => {
            const n = products.filter(p => p.cat === (c as any).id).length
            if (!n) return null
            return (
              <button key={(c as any).id} onClick={() => { haptic(); onClose(); nav(`/cat/${(c as any).id}`) }}
                className="press flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[14px] font-semibold text-[#111] hover:bg-[#F7F7F9]">
                <span className="flex-1 truncate">{(c as any)[lang] || t.catNames[(c as any).id]}</span>
                <span className="text-[11px] font-bold text-[#A2A9C6]">{n}</span>
                <ChevronRight size={15} className="text-[#C4C9DB]" />
              </button>
            )
          })}
        </div>
        <div className="border-t border-navy-line px-4 py-3 flex items-center gap-2" style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
          <button onClick={() => setLangOpen(true)} className="press flex items-center gap-2 rounded-full bg-[#F2F2F4] px-3 py-2 text-[12px] font-extrabold text-[#111]">
            <span className="text-[15px]">{FLAGS[lang]}</span>{lang.toUpperCase()}
          </button>
          {role === 'admin' && <button onClick={() => { onClose(); nav('/admin') }} className="press ml-auto text-[12px] font-bold text-navy">{t.admin}</button>}
        </div>
        {langOpen && <LangSheet onClose={() => setLangOpen(false)} />}
      </aside>
    </div>,
    document.body
  )
}
