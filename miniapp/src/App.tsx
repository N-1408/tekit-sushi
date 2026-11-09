import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './screens/Home'
import Cat from './screens/Cat'
import Product from './screens/Product'
import Cart from './screens/Cart'
import Checkout from './screens/Checkout'
import Orders from './screens/Orders'
import Profile from './screens/Profile'
import Admin from './screens/Admin'
import AdminDash from './screens/admin/AdminDash'
import AdminOrders from './screens/admin/AdminOrders'
import AdminMenu from './screens/admin/AdminMenu'
import AdminItemForm from './screens/admin/AdminItemForm'
import AdminCats from './screens/admin/AdminCats'
import AdminPromos from './screens/admin/AdminPromos'
import { TabBar, ProductSheet } from './components/ui'
import { useStore } from './lib/store'

export default function App() {
  const { initTg, toast } = useStore()
  useEffect(() => { initTg() }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cat/:cat" element={<Cat />} />
        <Route path="/p/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<AdminDash />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/menu" element={<AdminMenu />} />
        <Route path="/admin/menu/new" element={<AdminItemForm />} />
        <Route path="/admin/menu/edit/:id" element={<AdminItemForm />} />
        <Route path="/admin/menu/:cat" element={<AdminMenu />} />
        <Route path="/admin/cats" element={<AdminCats />} />
        <Route path="/admin/promos" element={<AdminPromos />} />
      </Routes>
      <TabBar />
      <ProductSheet />
      {toast && <div className="anim-toast fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-navy-deep text-white text-[13px] font-bold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap">{toast}</div>}
    </>
  )
}
