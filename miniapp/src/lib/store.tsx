import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import menu from '../data/menu.json'
import { T, type Lang, type Trans } from './i18n'
export type { Lang } from './i18n'
import { tgUser, haptic, TGA } from './tg'

export type Product = {
  id: string; slug: string; cat: string; price: number; img: string
  t_uz: string; t_ru: string; t_en: string
  d_uz: string; d_ru: string; d_en: string
  pcs: number; weight?: string; hit?: boolean
  kcal?: number | null; protein?: number | null; fat?: number | null; carbs?: number | null
  active?: boolean
  old_price?: number | null; sale_percent?: number; sale_active?: boolean
}
export const PRODUCTS: Product[] = menu as Product[]

export const CATS = [
  { id: 'hit', uz: 'Xitlar', ru: 'Хиты', en: 'Best sellers', emoji: '🔥' },
  { id: 'set', uz: 'Setlar', ru: 'Сеты', en: 'Sets', emoji: '🍱' },
  { id: 'roll', uz: 'Rollar', ru: 'Роллы', en: 'Rolls', emoji: '🍣' },
  { id: 'sushi', uz: 'Sushi', ru: 'Суши', en: 'Sushi', emoji: '🍥' },
  { id: 'salat', uz: 'Salatlar', ru: 'Салаты', en: 'Salads', emoji: '🥗' },
  { id: 'sup', uz: 'Suplar', ru: 'Супы', en: 'Soups', emoji: '🍲' },
  { id: 'issiq', uz: 'Issiq taomlar', ru: 'Горячее', en: 'Hot dishes', emoji: '🍛' },
  { id: 'wok', uz: 'Wok', ru: 'Вок', en: 'Wok', emoji: '🍜' },
  { id: 'bola', uz: 'Bolalar', ru: 'Детям', en: 'For kids', emoji: '🧸' },
  { id: 'desert', uz: 'Desertlar', ru: 'Десерты', en: 'Desserts', emoji: '🍰' },
  { id: 'garnir', uz: 'Garnirlar', ru: 'Гарниры', en: 'Sides', emoji: '🍚' },
  { id: 'ichimlik', uz: 'Ichimliklar', ru: 'Напитки', en: 'Drinks', emoji: '🥤' },
  { id: 'sous', uz: 'Souslar', ru: 'Соусы', en: 'Sauces', emoji: '🥫' },
] as const
export const CDN = 'https://cdn.delever.uz/delever/'
export const pDesc = (p: Product | CartLine, l: Lang) => (p as any)['d_' + l] || (p as any).d_uz
export const pName = (p: Product | CartLine, l: Lang) => (p as any)['t_' + l] || (p as any).t_uz
export const pImg = (p: Product | CartLine) => {
  const im = String((p as any).img || '')
  if (/^https?:/i.test(im)) return im
  if (im.startsWith('/')) return im
  if (/^up_/i.test(im)) return `/api/img?id=${im}`
  return CDN + im
}

export type CartLine = Product & { q: number }

export type OrderItem = { id: string; slug: string; title: string; q: number; price: number }
export type MyOrder = {
  oid: number; at: string; status: string; items: OrderItem[]
  sum: number; mode: string; pay: string; addr: string; name: string; phone: string
}

export type User = { tg_id?: number; name: string; phone: string; addr: string; lat?: number; lon?: number }

export type Store = {
  lang: Lang; setLang: (l: Lang) => void; t: Trans
  products: Product[]
  cart: CartLine[]; cartCount: number; cartSum: number
  add: (id: string, q?: number) => void; setQty: (id: string, q: number) => void; clearCart: () => void
  favs: string[]; toggleFav: (id: string) => void
  toast: string | null; showToast: (s: string) => void
  myOrders: MyOrder[]; saveMyOrder: (o: MyOrder) => void
  initTg: () => void
  sheetP: Product | null; openP: (p: Product) => void; closeP: () => void
  role: string | null
  roleReady: boolean
  user: User | null
  saveUser: (p: Partial<User>) => void
  refreshOrders: () => void
  ob: boolean
  openOb: () => void
  closeOb: () => void
  mode: 'delivery' | 'pickup'
  setMode: (m: 'delivery' | 'pickup') => void
}

const Ctx = createContext<Store>(null as any)
export const useStore = () => useContext(Ctx)

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangS] = useState<Lang>(() => load<Lang>('tk-lang', 'uz'))
  const [cartMap, setCartMap] = useState<Record<string, number>>(() => load('tk-cart', {} as Record<string, number>))
  const [favs, setFavs] = useState<string[]>(() => load('tk-favs', [] as string[]))
  const [toast, setToast] = useState<string | null>(null)
  const [myOrders, setMyOrders] = useState<MyOrder[]>(() => load('tk-orders', [] as MyOrder[]))
  const [sheetP, setSheetP] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>(() => load<Product[]>('tk-menu-v2', PRODUCTS))
  const [role, setRole] = useState<string | null>(null)
  const [roleReady, setRoleReady] = useState(false)
  const [user, setUser] = useState<User | null>(() => {
    const saved = load<User | null>('tk-user', null)
    if (saved) return saved
    // preview: ?demo=1 — faqat brauzerda ko'rish uchun mahalliy mehmon foydalanuvchisi
    try {
      if (new URLSearchParams(window.location.search).has('demo')) {
        const d = { tg_id: undefined, name: 'Demo mijoz', phone: '+998901234567', addr: 'Toshkent' } as any
        localStorage.setItem('tk-user', JSON.stringify(d))
        return d
      }
    } catch {}
    return null
  })
  const [ob, setOb] = useState(false)
  const [mode, setModeS] = useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))

  useEffect(() => { localStorage.setItem('tk-lang', JSON.stringify(lang)) }, [lang])
  useEffect(() => { localStorage.setItem('tk-cart', JSON.stringify(cartMap)) }, [cartMap])
  useEffect(() => { localStorage.setItem('tk-favs', JSON.stringify(favs)) }, [favs])
  useEffect(() => { localStorage.setItem('tk-orders', JSON.stringify(myOrders.slice(0, 30))) }, [myOrders])
  useEffect(() => { if (user) localStorage.setItem('tk-user', JSON.stringify(user)) }, [user])

  const setLang = useCallback((l: Lang) => setLangS(l), [])
  const setMode = useCallback((m: 'delivery' | 'pickup') => { setModeS(m); try { localStorage.setItem('tk-mode', m) } catch {} }, [])
  const add = useCallback((id: string, q = 1) => setCartMap(c => ({ ...c, [id]: (c[id] || 0) + q })), [])
  const setQty = useCallback((id: string, q: number) => setCartMap(c => {
    const copy = { ...c }
    if (q <= 0) delete copy[id]; else copy[id] = q
    return copy
  }), [])
  const clearCart = useCallback(() => setCartMap({}), [])
  const toggleFav = useCallback((id: string) => setFavs(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id])), [])
  const showToast = useCallback((s: string) => { setToast(s); setTimeout(() => setToast(null), 1800) }, [])
  const saveMyOrder = useCallback((o: MyOrder) => setMyOrders(a => [o, ...a].slice(0, 30)), [])
  const openP = useCallback((p: Product) => setSheetP(p), [])
  const saveUser = useCallback((p: Partial<User>) => setUser(u => ({ ...(u || {}), ...p } as User)), [])
  const refreshOrders = useCallback(() => {
    const u = tgUser()
    if (!u) return
    fetch('/api/orders', { headers: { 'X-Init-Data': TGA?.initData || '' } }).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.orders) return
      const mapped: MyOrder[] = (j.orders as any[]).map(o => ({
        oid: o.id, at: o.created_at, status: o.status || 'new',
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        sum: Number(o.total) || 0, mode: o.delivery_type || 'delivery', pay: o.payment || 'cash',
        addr: o.address || '', name: o.name || '', phone: o.phone || '',
      }))
      setMyOrders(prev => {
        const ids = new Set(mapped.map(x => x.oid))
        const localOnly = prev.filter(x => !ids.has(x.oid))
        return [...mapped, ...localOnly].slice(0, 30)
      })
    }).catch(() => {})
  }, [])
  const openOb = useCallback(() => setOb(true), [])
  const closeOb = useCallback(() => setOb(false), [])
  const closeP = useCallback(() => setSheetP(null), [])

  useEffect(() => {
    let dead = false
    fetch('/api/menu').then(r => r.ok ? r.json() : null).then(j => {
      if (dead || !j?.ok || !Array.isArray(j.items) || !j.items.length) return
      setProducts(j.items)
      try { localStorage.setItem('tk-menu-v2', JSON.stringify(j.items)) } catch {}
    }).catch(() => {})
    return () => { dead = true }
  }, [])

  const initTg = useCallback(() => {
    const u = tgUser()
    if (!u) return
    fetch('/api/me', { headers: { 'X-Init-Data': TGA?.initData || '' } }).then(r => r.ok ? r.json() : null).then(j => { setRole(j?.role || null); setRoleReady(true) }).catch(() => { setRoleReady(true) })
    refreshOrders()
  }, [refreshOrders])

  const value = useMemo<Store>(() => {
    const lines: CartLine[] = Object.entries(cartMap)
      .map(([id, q]) => { const p = products.find(x => x.id === id); return p ? { ...p, q } : null })
      .filter(Boolean) as CartLine[]
    const count = lines.reduce((s, l) => s + l.q, 0)
    const sum = lines.reduce((s, l) => s + l.q * l.price, 0)
    return { lang, setLang, t: T[lang] as Trans, products, cart: lines, cartCount: count, cartSum: sum, add, setQty, clearCart, favs, toggleFav, toast, showToast, myOrders, saveMyOrder, initTg, refreshOrders, sheetP, openP, closeP, role, roleReady, user, saveUser, ob, openOb, closeOb, mode, setMode }
  }, [lang, cartMap, favs, toast, myOrders, sheetP, role, roleReady, products, user, ob, setLang, add, setQty, clearCart, toggleFav, showToast, saveMyOrder, initTg, refreshOrders, openP, closeP, saveUser, openOb, closeOb, mode, setMode])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
