import type { MyOrder } from './store'
import { tgUser } from './tg'

export async function postOrder(o: Omit<MyOrder, 'oid'> & { note?: string; when?: string }) {
  const u = tgUser()
  const body = {
    type: 'order', ...o, tg_user_id: u?.id ?? null,
    address: o.addr, delivery_type: o.mode, payment: o.pay, total: o.sum,
  }
  const r = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error('order failed')
  const j = await r.json()
  return j as { ok: boolean; order_id: number; created_at: string }
}

export type ServerOrder = {
  id: number; created_at: string; total: number; status: string; items: string; name: string; phone: string
}

export async function fetchMyOrders(tgId: number): Promise<ServerOrder[]> {
  const r = await fetch(`/api/orders?tg_user_id=${tgId}`)
  if (!r.ok) throw new Error('orders failed')
  const j = await r.json()
  return (j.orders || []) as ServerOrder[]
}

// admin
const KEY = () => localStorage.getItem('tk-admin') || ''
export async function adminLogin(password: string) {
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', password }) })
  const j = await r.json()
  return j.ok === true
}
export async function adminOrders() {
  const r = await fetch('/api/admin?action=orders', { headers: { 'X-Admin-Key': KEY() } })
  if (r.status === 401) throw new Error('unauthorized')
  const j = await r.json()
  return (j.orders || []) as any[]
}
export async function adminSetStatus(id: number, status: string) {
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY() }, body: JSON.stringify({ action: 'status', id, status }) })
  if (r.status === 401) throw new Error('unauthorized')
  const j = await r.json()
  return j.ok === true
}
