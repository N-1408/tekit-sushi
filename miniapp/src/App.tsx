import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './screens/Home'
import Cat from './screens/Cat'
import Product from './screens/Product'
import Cart from './screens/Cart'
import Checkout from './screens/Checkout'
import Orders from './screens/Orders'
import History from './screens/History'
import Profile from './screens/Profile'
import AdminDash from './screens/admin/AdminDash'
import AdminCustomers from './screens/admin/AdminCustomers'
import AdminAccess from './screens/admin/AdminAccess'
import AdminOrders from './screens/admin/AdminOrders'
import AdminMenu from './screens/admin/AdminMenu'
import AdminItemForm from './screens/admin/AdminItemForm'
import AdminCats from './screens/admin/AdminCats'
import AdminPromos from './screens/admin/AdminPromos'
import { AdminShell, AdminGate } from './screens/admin/common'
import { TabBar, ProductSheet, FloatingCart, ScrollTop, GiftProgress, SideThemeToggle, useIsWide, useCartPanelOpen, setCartPanelOpen, useOrdersPanelOpen, setOrdersPanelOpen, useProfilePanelOpen, setProfilePanelOpen, IcX } from './components/ui'
import Onboarding from './screens/Onboarding'
import { useStore } from './lib/store'
import { TGA } from './lib/tg'

/* Boot splash: server foydalanuvchini tekshirguncha (Telegram sessiyasida) */
function BootSplash() {
  return (
    <div className="fixed inset-0 z-[90] bg-[var(--brand-blue)] grid place-items-center">
      <img src="/logo-light.png" alt="Tekit Sushi" className="w-16 h-16 anim-pop" />
    </div>
  )
}

/* Desktop savat yon paneli (lg+): FloatingCart ochadi. Yopish: overlay,
   Escape yoki Telegramning native BackButton tugmasi (tarixga qaytmaydi). */
function CartDrawer() {
  const open = useCartPanelOpen()
  const isWide = useIsWide()
  const loc = useLocation()
  const { t } = useStore()
  React.useEffect(() => { setCartPanelOpen(false) }, [loc.pathname])
  /* Tana skrolli qulflanadi + Escape bilan yopiladi */
  React.useEffect(() => {
    if (!open || !isWide) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartPanelOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, isWide])
  /* Native BackButton: panelni yopadi (useNativeBack history.back() emas) */
  React.useEffect(() => {
    if (!open || !isWide) return
    const bb = TGA?.BackButton as any
    if (!bb?.show) return
    const close = () => setCartPanelOpen(false)
    try { bb.onClick(close); bb.show() } catch {}
    return () => { try { bb.offClick?.(close); bb.hide() } catch {} }
  }, [open, isWide])
  if (!isWide) return null
  return (
    <div className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open || undefined}>
      <div className={`absolute inset-0 bg-black/45 motion-safe:transition-opacity motion-safe:duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setCartPanelOpen(false)} />
      <aside role="dialog" aria-label={t.tabCart}
        className={`absolute right-0 top-0 bottom-0 w-[460px] max-w-[94vw] bg-[var(--bg)] border-l border-[var(--line)] shadow-[-24px_0_60px_-30px_rgba(0,0,0,.6)] flex flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] shrink-0">
          <div className="text-[16px] font-extrabold">{t.tabCart}</div>
          <button onClick={() => setCartPanelOpen(false)} aria-label="close-cart"
            className="press w-9 h-9 rounded-xl grid place-items-center text-[var(--mut2)] hover:bg-[var(--soft)] active:scale-95 transition-colors"><IcX s={15} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{open && <Cart variant="panel" />}</div>
      </aside>
    </div>
  )
}

/* Desktop buyurtmalar yon paneli (lg+): headerdagi "Buyurtmalar" tugmasi ochadi.
   Yopish: X (orqaga), overlay, Escape yoki Telegramning native BackButton tugmasi. */
function OrdersDrawer() {
  const open = useOrdersPanelOpen()
  const isWide = useIsWide()
  const loc = useLocation()
  const { t } = useStore()
  React.useEffect(() => { setOrdersPanelOpen(false) }, [loc.pathname])
  /* Tana skrolli qulflanadi + Escape bilan yopiladi */
  React.useEffect(() => {
    if (!open || !isWide) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOrdersPanelOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, isWide])
  /* Native BackButton: panelni yopadi (useNativeBack history.back() emas) */
  React.useEffect(() => {
    if (!open || !isWide) return
    const bb = TGA?.BackButton as any
    if (!bb?.show) return
    const close = () => setOrdersPanelOpen(false)
    try { bb.onClick(close); bb.show() } catch {}
    return () => { try { bb.offClick?.(close); bb.hide() } catch {} }
  }, [open, isWide])
  if (!isWide) return null
  return (
    <div className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open || undefined}>
      <div className={`absolute inset-0 bg-black/45 motion-safe:transition-opacity motion-safe:duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOrdersPanelOpen(false)} />
      <aside role="dialog" aria-label={t.tabOrders}
        className={`absolute right-0 top-0 bottom-0 w-[560px] max-w-[94vw] bg-[var(--bg)] border-l border-[var(--line)] shadow-[-24px_0_60px_-30px_rgba(0,0,0,.6)] flex flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] shrink-0">
          <div className="text-[16px] font-extrabold">{t.tabOrders}</div>
          <button onClick={() => setOrdersPanelOpen(false)} aria-label="close-orders"
            className="press w-9 h-9 rounded-xl grid place-items-center text-[var(--mut2)] hover:bg-[var(--soft)] active:scale-95 transition-colors"><IcX s={15} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{open && <Orders variant="panel" />}</div>
      </aside>
    </div>
  )
}

/* Desktop profil yon paneli (lg+): headerdagi "Profil" tugmasi ochadi.
   Yopish: X, overlay, Escape yoki Telegramning native BackButton tugmasi. */
function ProfileDrawer() {
  const open = useProfilePanelOpen()
  const isWide = useIsWide()
  const loc = useLocation()
  const { t } = useStore()
  React.useEffect(() => { setProfilePanelOpen(false) }, [loc.pathname])
  /* Tana skrolli qulflanadi + Escape bilan yopiladi */
  React.useEffect(() => {
    if (!open || !isWide) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProfilePanelOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, isWide])
  /* Native BackButton: panelni yopadi */
  React.useEffect(() => {
    if (!open || !isWide) return
    const bb = TGA?.BackButton as any
    if (!bb?.show) return
    const close = () => setProfilePanelOpen(false)
    try { bb.onClick(close); bb.show() } catch {}
    return () => { try { bb.offClick?.(close); bb.hide() } catch {} }
  }, [open, isWide])
  if (!isWide) return null
  return (
    <div className={`fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open || undefined}>
      <div className={`absolute inset-0 bg-black/45 motion-safe:transition-opacity motion-safe:duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setProfilePanelOpen(false)} />
      <aside role="dialog" aria-label={t.tabProfile}
        className={`absolute right-0 top-0 bottom-0 w-[480px] max-w-[94vw] bg-[var(--bg)] border-l border-[var(--line)] shadow-[-24px_0_60px_-30px_rgba(0,0,0,.6)] flex flex-col motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] shrink-0">
          <div className="text-[16px] font-extrabold">{t.tabProfile}</div>
          <button onClick={() => setProfilePanelOpen(false)} aria-label="close-profile"
            className="press w-9 h-9 rounded-xl grid place-items-center text-[var(--mut2)] hover:bg-[var(--soft)] active:scale-95 transition-colors"><IcX s={15} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{open && <Profile variant="panel" />}</div>
      </aside>
    </div>
  )
}

export default function App() {
  const { toast, user, ob, userChecked } = useStore()
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')
  const booting = !isAdmin && !userChecked

  const wide = !isAdmin && !loc.pathname.startsWith('/p/')

  /* Bepul yetkazib berish halqasi va suzuvchi savat DOIM ko'rinadi va joyida
     qotadi: skroll yo'nalishi bo'yicha yashirish (html[data-floats]) bekor
     qilindi — foydalanuvchi talabi, 2026-11-20. */

  return (
    <>
      <div className={wide ? 'lg:max-w-[1240px] lg:mx-auto' : undefined}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cat/:cat" element={<Cat />} />
        <Route path="/p/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminShell><AdminOrders /></AdminShell>} />
        <Route path="/admin/orders" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/dash" replace />} />
        <Route path="/admin/dash" element={<AdminShell><AdminDash /></AdminShell>} />
        <Route path="/admin/menu" element={<AdminShell><AdminMenu /></AdminShell>} />
        <Route path="/admin/menu/:cat" element={<AdminShell><AdminMenu /></AdminShell>} />
        <Route path="/admin/menu/new" element={<AdminGate><AdminItemForm /></AdminGate>} />
        <Route path="/admin/menu/edit/:id" element={<AdminGate><AdminItemForm /></AdminGate>} />
        <Route path="/admin/cats" element={<AdminGate><AdminCats /></AdminGate>} />
        <Route path="/admin/customers" element={<AdminShell><AdminCustomers /></AdminShell>} />
        <Route path="/admin/access" element={<AdminShell><AdminAccess /></AdminShell>} />
        <Route path="/admin/promos" element={<AdminShell><AdminPromos /></AdminShell>} />
      </Routes>
      </div>
      {!isAdmin && booting && <BootSplash />}
      {!isAdmin && !booting && (!user || ob) && <Onboarding />}
      {!isAdmin && <>
        <TabBar />
        {/* uchala suzuvchi boshqaruv bitta qatorda, o'lchamlari bir xil */}
        <div className="floating-row-left"><ScrollTop /></div>
        <SideThemeToggle />
        <div className="floating-row-right"><GiftProgress /><FloatingCart /></div>
      </>}
      {!isAdmin && <ProductSheet />}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <OrdersDrawer />}
      {!isAdmin && <ProfileDrawer />}
      {toast && <div className="anim-toast fixed bottom-28 left-1/2 -translate-x-1/2 lg:left-1/2 z-[60] bg-navy text-white text-[13px] font-bold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">{toast}</div>}
    </>
  )
}
