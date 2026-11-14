import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import menu from '../data/menu.json'
import { T, type Lang, type Trans } from './i18n'
export type { Lang } from './i18n'
import { tgUser, haptic, TGA, resolveTheme, applyTheme, onSystemThemeChange, type ThemeMode } from './tg'

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

/* Olib ketish: filial + kun (YYYY-MM-DD) + vaqt (HH:MM). Filiallar va ish vaqti
   hali loyihada konfiguratsiya qilinmagan — Fulfillment.tsx dagi BRANCHES/PICKUP_CFG. */
export type PickupSel = { branch: string; date?: string; time?: string }

/* Toshkent vaqti: saqlangan olib-ketish jadvalining muddati o'tganini tekshirish */
function tkNowParts() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)?.value || ''
  return { ymd: `${g('year')}-${g('month')}-${g('day')}`, hm: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}` }
}

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
  mode: 'delivery' | 'pickup' | null
  setMode: (m: 'delivery' | 'pickup') => void
  pickup: PickupSel | null
  setPickup: (p: PickupSel | null) => void
  navOpen: boolean
  setNavOpen: (v: boolean) => void
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  deliveryCfg: { fee: number; threshold: number }
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
  const [theme, setThemeS] = useState<ThemeMode>(() => resolveTheme())
  const setTheme = useCallback((next: ThemeMode) => {
    try { localStorage.setItem('tk-theme', next) } catch {}
    applyTheme(next)
    setThemeS(next)
  }, [])
  useEffect(() => {
    applyTheme(theme)
    const onSys = () => {
      try { if (localStorage.getItem('tk-theme')) return } catch {}
      setThemeS(resolveTheme())
    }
    onSystemThemeChange(onSys)
  }, [theme])
  const [mode, setModeS] = useState<'delivery' | 'pickup' | null>(() => {
    try {
      const v = localStorage.getItem('tk-ff')
      if (v === 'delivery' || v === 'pickup') return v
      /* eski kalit 'tk-mode' standart sifatida avtomatik yozilgan edi
         ('delivery' fallback), shuning uchun u tasdiqlangan tanlov emas — o'chiriladi */
      localStorage.removeItem('tk-mode')
    } catch {}
    return null
  })
  const [pickup, setPickupS] = useState<PickupSel | null>(() => {
    const p = load<PickupSel | null>('tk-pickup', null)
    if (!p || !p.branch) return null
    if (p.date && p.time) {
      const n = tkNowParts()
      if (p.date < n.ymd || (p.date === n.ymd && p.time <= n.hm)) return { branch: p.branch }
    }
    return p
  })
  const [navOpen, setNavOpenS] = useState(false)
  const [deliveryCfg, setDeliveryCfg] = useState<{ fee: number; threshold: number }>(() => ({ fee: 15000, threshold: 200000 }))

  useEffect(() => { localStorage.setItem('tk-lang', JSON.stringify(lang)) }, [lang])
  useEffect(() => { localStorage.setItem('tk-cart', JSON.stringify(cartMap)) }, [cartMap])
  useEffect(() => { localStorage.setItem('tk-favs', JSON.stringify(favs)) }, [favs])
  useEffect(() => { localStorage.setItem('tk-orders', JSON.stringify(myOrders.slice(0, 30))) }, [myOrders])
  useEffect(() => { if (user) localStorage.setItem('tk-user', JSON.stringify(user)) }, [user])

  const setLang = useCallback((l: Lang) => setLangS(l), [])
  const setPickup = useCallback((p: PickupSel | null) => { setPickupS(p); try { if (p) localStorage.setItem('tk-pickup', JSON.stringify(p)); else localStorage.removeItem('tk-pickup') } catch {} }, [])
  const setNavOpen = useCallback((v: boolean) => setNavOpenS(v), [])
  const setMode = useCallback((m: 'delivery' | 'pickup') => { setModeS(m); try { localStorage.setItem('tk-ff', m) } catch {} }, [])
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
      if (j.delivery) setDeliveryCfg({ fee: Number(j.delivery.fee) || 15000, threshold: Number(j.delivery.threshold) || 200000 })
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
    return { lang, setLang, t: T[lang] as Trans, products, cart: lines, cartCount: count, cartSum: sum, add, setQty, clearCart, favs, toggleFav, toast, showToast, myOrders, saveMyOrder, initTg, refreshOrders, sheetP, openP, closeP, role, roleReady, user, saveUser, ob, openOb, closeOb, mode, setMode, pickup, setPickup, navOpen, setNavOpen, theme, setTheme, deliveryCfg }
  }, [lang, cartMap, favs, toast, myOrders, sheetP, role, roleReady, products, user, ob, setLang, add, setQty, clearCart, toggleFav, showToast, saveMyOrder, initTg, refreshOrders, openP, closeP, saveUser, openOb, closeOb, mode, setMode, pickup, setPickup, navOpen, setNavOpen, theme, setTheme, deliveryCfg])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
