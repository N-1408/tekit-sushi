import React, { useEffect } from 'react'
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
import AdminOrders from './screens/admin/AdminOrders'
import AdminMenu from './screens/admin/AdminMenu'
import AdminItemForm from './screens/admin/AdminItemForm'
import AdminCats from './screens/admin/AdminCats'
import AdminPromos from './screens/admin/AdminPromos'
import { AdminShell, AdminGate } from './screens/admin/common'
import { TabBar, ProductSheet, FloatingCart, ScrollTop, GiftProgress, FloatingBonus } from './components/ui'
import Onboarding from './screens/Onboarding'
import { useStore } from './lib/store'

export default function App() {
  const { initTg, toast, user, ob } = useStore()
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')
  useEffect(() => { initTg() }, [])

  const wide = !isAdmin && !loc.pathname.startsWith('/p/')
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
        <Route path="/admin/promos" element={<AdminShell><AdminPromos /></AdminShell>} />
      </Routes>
      </div>
      {!isAdmin && (!user || ob) && <Onboarding />}
      {!isAdmin && <><TabBar /><FloatingBonus /><FloatingCart /><ScrollTop /><GiftProgress /></>}
      {!isAdmin && <ProductSheet />}
      {toast && <div className="anim-toast fixed bottom-28 left-1/2 -translate-x-1/2 lg:left-1/2 z-[60] bg-navy text-white text-[13px] font-bold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">{toast}</div>}
    </>
  )
}
