import type { MyOrder } from './store'

/* Barcha API so'rovlari shu bazadan o'tadi.
   Vercel'da VITE_API_URL bo'sh (xuddi shu manzil) — hozirgi xatti-harakat saqlanadi.
   VPSda to'liq URL beriladi (masalan https://tekit.uz). */
export const API_BASE: string = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
import { tgUser, tgInitData } from './tg'

/* Server tekshiruvi uchun imzo sarlavhasi (mavjud bo'lsa) */
function authHeaders(): Record<string, string> {
  const d = tgInitData()
  return d ? { 'X-Init-Data': d } : {}
}

export async function postOrder(o: Omit<MyOrder, 'oid'> & { note?: string; when?: string }) {
  const u = tgUser()
  const body = {
    type: 'order', ...o, tg_user_id: u?.id ?? null,
    address: o.addr, delivery_type: o.mode, payment: o.pay, total: o.sum,
  }
  const r = await fetch(`${API_BASE}/api/order`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error('order failed')
  const j = await r.json()
  return j as { ok: boolean; order_id: number; created_at: string }
}

export type ServerOrder = {
  id: number; created_at: string; total: number; status: string; items: string; name: string; phone: string
}

export async function fetchMyOrders(tgId: number): Promise<ServerOrder[]> {
  const r = await fetch(`${API_BASE}/api/orders?tg_user_id=${tgId}`)
  if (!r.ok) throw new Error('orders failed')
  const j = await r.json()
  return (j.orders || []) as ServerOrder[]
}

// admin
const KEY = () => localStorage.getItem('tk-admin') || ''
export async function adminOrders() {
  const r = await fetch(`${API_BASE}/api/admin?action=orders`, { headers: { 'X-Admin-Key': KEY() } })
  if (r.status === 401) throw new Error('unauthorized')
  const j = await r.json()
  return (j.orders || []) as any[]
}
export async function adminSetStatus(id: number, status: string) {
  const r = await fetch(`${API_BASE}/api/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY() }, body: JSON.stringify({ action: 'status', id, status }) })
  if (r.status === 401) throw new Error('unauthorized')
  const j = await r.json()
  return j.ok === true
}

/* Telegram orqali admin kirish (Telegram Login, OIDC) */
export async function adminSession(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/auth?action=me`)
    if (!r.ok) return false
    return ((await r.json()) as any)?.ok === true
  } catch { return false }
}

export async function tgLogin(code: string, verifier: string, redirectUri: string): Promise<{ ok: boolean; pending?: boolean }> {
  const r = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'tg-login', code, code_verifier: verifier, redirect_uri: redirectUri }),
  })
  return (await r.json().catch(() => ({ ok: false }))) as { ok: boolean; pending?: boolean }
}

/* Telegram Login Widget (rasmiy skript) natijasi bilan kirish */
export async function tgWidgetLogin(user: any, scope?: 'user'): Promise<{ ok: boolean; pending?: boolean; role?: string; tg_id?: number; name?: string }> {
  const r = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'widget-login', user, scope }),
  })
  return (await r.json().catch(() => ({ ok: false }))) as { ok: boolean; pending?: boolean; role?: string; tg_id?: number; name?: string }
}

/* Ruxsatlar sahifasi: adminlar + tasdiqlanmagan so'rovlar */
export async function adminAccess(): Promise<{ admins: any[]; requests: any[] } | null> {
  const r = await fetch(`${API_BASE}/api/auth?action=access`, { headers: { 'X-Admin-Key': KEY() } })
  if (!r.ok) return null
  const j = await r.json()
  return { admins: j.admins || [], requests: j.requests || [] }
}

export async function adminAccessDecide(tgId: number, approve: boolean): Promise<boolean> {
  const r = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY() },
    body: JSON.stringify({ action: 'access-decide', tg_id: tgId, approve }),
  })
  if (r.status === 401) throw new Error('unauthorized')
  const j = await r.json().catch(() => ({ ok: false }))
  return j.ok === true
}
