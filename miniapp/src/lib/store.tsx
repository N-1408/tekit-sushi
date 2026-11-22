import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { T, type Lang, type Trans } from './i18n'
export type { Lang } from './i18n'
import { tgUser, haptic, TGA, resolveTheme, applyTheme, onSystemThemeChange, type ThemeMode } from './tg'

export type Product = {
  id: string; slug: string; cat: string; price: number; img: string
  t_uz: string; t_ru: string; t_en: string
  d_uz: string; d_ru: string; d_en: string
  pcs: number; weight?: string; hit?: boolean
  spicy?: boolean | null
  kcal?: number | null; protein?: number | null; fat?: number | null; carbs?: number | null
  active?: boolean
  old_price?: number | null; sale_percent?: number; sale_active?: boolean
}
/* Achchiq bo'limi: admin panelda 'spicy' belgisi bor — u qat'iy hukmron.
   Eski qatorlarda belgi hali yo'q (null), shuning uchun nom bo'yicha aniqlanadi
   (chili, spaysi, kimchi, o'tkir). Uchala til nomlari birgalikda tekshiriladi,
   shuning uchun til almashtirsa ham ishlaydi. */
const SPICY_RE = /chili|spaysi|spicy|achchiq|kimchi|кимчи|спайси|остр/i
export function isSpicy(p: Product): boolean {
  if (p.spicy === true) return true
  if (p.spicy === false) return false
  return SPICY_RE.test(`${p.t_uz || ''} ${p.t_ru || ''} ${p.t_en || ''}`)
}

/* Kategoriya bo'yicha filtrlash: 'spicy' — virtual kategoriya (barcha
   achchiq mahsulotlar, o'z cat maydonidan qat'i nazar), qolganlari o'z
   cat maydoni bo'yicha. */
export function inCat(p: Product, cat: string): boolean {
  return cat === 'spicy' ? isSpicy(p) : p.cat === cat
}

export const CATS = [
  { id: 'hit', uz: 'Xitlar', ru: 'Хиты', en: 'Best sellers', emoji: '🔥' },
  { id: 'spicy', uz: 'Achchiq', ru: 'Острое', en: 'Spicy' },
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

export type CatDef = { id: string; uz: string; ru: string; en?: string; emoji?: string | null }

export type CartLine = Product & { q: number }

export type OrderItem = { id: string; slug: string; title: string; q: number; price: number }
export type MyOrder = {
  oid: number; at: string; status: string; items: OrderItem[]
  sum: number; mode: string; pay: string; addr: string; name: string; phone: string
  branch?: string | null; when?: string | null  // olib ketish: filial + 'YYYY-MM-DD HH:MM'
  fee?: number | null; discount?: number | null  // yetkazib berish narxi / chegirma
  payStatus?: string | null
}

export type User = { tg_id?: number; name: string; phone: string; addr: string; lat?: number; lon?: number }

/* Olib ketish tanlovi: filial + rejim. asap=true — imkon qadar tezroq
   (date/time bo'sh); aks holda kun (YYYY-MM-DD) + vaqt (HH:MM). */
export type PickupSel = { branch: string; asap?: boolean; date?: string; time?: string }

/* Filial yozuvi (tasdiqlangan faktlar): server /api/branches ham shu ma'lumotni beradi.
   Bu faqat o'zgaruvchi emas: server javob kelmaganda ham ishonchli fallback. */
export type Branch = { id: string; name: { uz: string; ru: string; en?: string }; hours_24_7: boolean; address: string | null; lat: number | null; lon: number | null }
export type FF = {
  branches: Branch[]
  pickup_cfg: { prep_minutes?: number; slot_minutes?: number; days_ahead?: number } | null
  delivery: { fee: number; threshold: number; eta_minutes: number | null }
}

/* Toshkent vaqti: saqlangan olib-ketish jadvalining muddati o'tganini tekshirish */
function tkNowParts() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)?.value || ''
  return { ymd: `${g('year')}-${g('month')}-${g('day')}`, hm: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}` }
}

export type Store = {
  lang: Lang; setLang: (l: Lang) => void; t: Trans
  products: Product[]
  cats: CatDef[]
  cart: CartLine[]; cartCount: number; cartSum: number
  add: (id: string, q?: number) => void; setQty: (id: string, q: number) => void; clearCart: () => void
  favs: string[]; toggleFav: (id: string) => void
  toast: string | null; showToast: (s: string) => void
  myOrders: MyOrder[]; saveMyOrder: (o: MyOrder) => void
  menuLoading: boolean
  ordersLoaded: boolean
  userChecked: boolean
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
  deliveryCfg: { fee: number; threshold: number }
  ff: FF
}

const Ctx = createContext<Store>(null as any)
export const useStore = () => useContext(Ctx)

/* Sidebar holati alohida kontekstda: uning o'zgarishi faqat burger/sidebar/brend
   bilan bog'liq UI ni qayta render qiladi; menyudagi yuzlab kartochka tegmaydi. */
export type NavState = { navOpen: boolean; setNavOpen: (v: boolean) => void }
const NavCtx = createContext<NavState>(null as any)
export const useNav = () => useContext(NavCtx)

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangS] = useState<Lang>(() => load<Lang>('tk-lang', 'uz'))
  const [cartMap, setCartMap] = useState<Record<string, number>>(() => load('tk-cart', {} as Record<string, number>))
  const [favs, setFavs] = useState<string[]>(() => load('tk-favs', [] as string[]))
  const [toast, setToast] = useState<string | null>(null)
  const [myOrders, setMyOrders] = useState<MyOrder[]>([])
  const [sheetP, setSheetP] = useState<Product | null>(null)
  /* Menyu KESHLANMAYDI: serverdan yuklanadi, kelguncha skelet ko'rsatiladi.
     Server javob bermasa — ilova ichidagi asosiy menyu ishlaydi. */
  const [products, setProducts] = useState<Product[]>([])
  const [cats, setCats] = useState<CatDef[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [roleReady, setRoleReady] = useState(false)
  /* Foydalanuvchi profili Telegram sessiyasida KESHLANMAYDI: ochilishida
     server (/api/me) darhol tekshiradi — u yerda bo'lsa profili qaytadi,
     bo'lmasa onboarding. Brauzerda (Telegram tashqarisida) mehmon profili
     mahalliy qoladi — bu faqat UI holati. ?demo=1 — ko'rish uchun demo. */
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (TGA?.initData && tgUser()) return null
      const g = load<User | null>('tk-guest', null)
      if (g) return g
      if (new URLSearchParams(window.location.search).has('demo')) {
        const d = { tg_id: undefined, name: 'Demo mijoz', phone: '+998901234567', addr: 'Toshkent' } as any
        localStorage.setItem('tk-guest', JSON.stringify(d))
        return d
      }
    } catch {}
    return null
  })
  /* Server tekshiruvi tugaguncha (Telegram sessiyasida) boot splash ko'rsatiladi */
  const [userChecked, setUserChecked] = useState(() => !TGA?.initData)
  const [ob, setOb] = useState(false)
  /* Tema holati kontekstdan chiqarildi (tg.ts moduli). Sabab: theme
     kontekst qiymatida turganda har almashtirish butun daraxtni qayta
     render qilardi — bu qotishning asosiy sababi. */
  useEffect(() => {
    applyTheme(resolveTheme())
    const onSys = () => {
      try { if (localStorage.getItem('tk-theme')) return } catch {}
      applyTheme(resolveTheme())
    }
    onSystemThemeChange(onSys)
  }, [])
  /* Yangi tashrif: tanlov nolga teng — saqlangan afzallik yoki eski
     buyurtma hech qachon tugmani avtomatik yondirmaydi (so'rov bo'yicha).
     Dastlabki tanlov dialogi faqat birinchi tashrifda so'raladi
     ('tk-onboarded' bayrog'i) va tanlov faqat shu sessiya uchun yashaydi. */
  const [mode, setModeS] = useState<'delivery' | 'pickup' | null>(() => {
    try { localStorage.removeItem('tk-mode'); localStorage.removeItem('tk-ff') } catch {}
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
  // Filiallar va fulfillment sozlamalari: server /api/branches (yagona manba).
  // Fallback: server javob bermasa tasdiqlangan faktlar (2 filial, 24/7).
  const [ff, setFF] = useState<FF>(() => ({
    branches: [
      { id: 'nukus', name: { uz: 'Nukus ko\u2018cha filiali', ru: 'Филиал на Нукус коча' }, hours_24_7: true, address: null, lat: null, lon: null },
      { id: 'sampi', name: { uz: 'Sampi filiali', ru: 'Филиал Сампи' }, hours_24_7: true, address: null, lat: null, lon: null },
    ],
    pickup_cfg: null,
    delivery: { fee: 0, threshold: 200000, eta_minutes: null },
  }))

  useEffect(() => { localStorage.setItem('tk-lang', JSON.stringify(lang)) }, [lang])
  useEffect(() => { localStorage.setItem('tk-cart', JSON.stringify(cartMap)) }, [cartMap])
  useEffect(() => { localStorage.setItem('tk-favs', JSON.stringify(favs)) }, [favs])

  const setLang = useCallback((l: Lang) => setLangS(l), [])
  const setPickup = useCallback((p: PickupSel | null) => { setPickupS(p); try { if (p) localStorage.setItem('tk-pickup', JSON.stringify(p)); else localStorage.removeItem('tk-pickup') } catch {} }, [])
  const setNavOpen = useCallback((v: boolean) => setNavOpenS(v), [])
  const setMode = useCallback((m: 'delivery' | 'pickup') => { setModeS(m) }, [])
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
  const saveUser = useCallback((p: Partial<User>) => setUser(u => {
    const merged = { ...(u || {}), ...p } as User
    /* Profil o'zgartirilganda serverga yoziladi (Telegram sessiyasida):
       keyingi yuklanishda u yerdan qaytadi. Brauzerda — UI holati sifatida. */
    try {
      if (TGA?.initData && merged.tg_id) {
        fetch('/api/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Init-Data': TGA.initData },
          body: JSON.stringify({ name: merged.name || '', phone: merged.phone || '', addr: merged.addr || '', lat: merged.lat ?? null, lon: merged.lon ?? null }),
        }).catch(() => {})
      } else {
        localStorage.setItem('tk-guest', JSON.stringify(merged))
      }
    } catch {}
    return merged
  }), [])
  const refreshOrders = useCallback(() => {
    const u = tgUser()
    if (!u) { setOrdersLoaded(true); return }
    fetch('/api/orders', { headers: { 'X-Init-Data': TGA?.initData || '' } }).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.orders) return
      const mapped: MyOrder[] = (j.orders as any[]).map(o => ({
        oid: o.id, at: o.created_at, status: o.status || 'new',
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        sum: o.grand_total != null ? Number(o.grand_total) : Number(o.total) || 0,
        mode: o.delivery_type || 'delivery', pay: o.payment || 'cash',
        addr: o.address || '', name: o.name || '', phone: o.phone || '',
        branch: o.branch || null, when: o.delivery_time || null,
        fee: o.delivery_fee != null ? Number(o.delivery_fee) : null,
        discount: o.discount != null ? Number(o.discount) : null,
        payStatus: o.payment_status || null,
      }))
      setMyOrders(prev => {
        const ids = new Set(mapped.map(x => x.oid))
        const localOnly = prev.filter(x => !ids.has(x.oid))
        const next = [...mapped, ...localOnly].slice(0, 30)
        // O'zgarish bo'lmasa holat yangilanmaydi — keraksiz render bo'lmaydi
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      })
      setOrdersLoaded(true)
    }).catch(() => setOrdersLoaded(true))
  }, [])
  const openOb = useCallback(() => setOb(true), [])
  const closeOb = useCallback(() => setOb(false), [])
  const closeP = useCallback(() => setSheetP(null), [])

  /* Boot sinxronizatsiyasi: ilova ochilishi bilan server bilan bog'lanadi.
     1) Foydalanuvchi mavjudligi (/api/me): u yerda bo'lsa profili keladi,
        bo'lmasa onboarding ko'rsatiladi.
     2) Menyu: serverdan, kelguncha skelet.
     3) Filiallar va yetkazib berish sozlamalari: server yagona manba.
     4) Buyurtmalar: serverdan.
     Keshda faqat UI holati qoladi (til, tema, savat, saralanganlar, rejim). */
  useEffect(() => {
    let dead = false
    // eski ma'lumot-keshlari tozalanadi (endi faqat UI holati keshlanadi)
    try { localStorage.removeItem('tk-user'); localStorage.removeItem('tk-menu-v2'); localStorage.removeItem('tk-orders') } catch {}
    if (TGA?.initData && tgUser()) {
      fetch('/api/me', { headers: { 'X-Init-Data': TGA.initData } })
        .then(r => r.ok ? r.json() : null).then((j: any) => {
          if (dead) return
          setRole(j?.role || null); setRoleReady(true); setUserChecked(true)
          if (j?.ok && j.exists && j.user) {
            const u = tgUser()
            setUser({ tg_id: u?.id, name: j.user.name || u?.first_name || '', phone: j.user.phone || '', addr: j.user.addr || '', lat: j.user.lat ?? undefined, lon: j.user.lon ?? undefined })
          } else {
            setUser(null) // serverda yo'q — onboarding ko'rsatiladi
          }
        }).catch(() => { if (!dead) { setRoleReady(true); setUserChecked(true) } })
    }
    fetch('/api/menu').then(r => r.ok ? r.json() : null).then((j: any) => {
      if (dead) return
      if (j?.ok && Array.isArray(j.items) && j.items.length) {
        setProducts(j.items)
        // Kategoriyalar serverdan: iiko bilan sinxronlangan ro'yxat.
        if (Array.isArray(j.cats) && j.cats.length) {
          setCats(j.cats.map((c: any) => ({ id: String(c.slug), uz: c.title_uz || '', ru: c.title_ru || '', en: c.title_en || undefined, emoji: c.emoji || null })))
        } else {
          setCats([...new Set(j.items.map((x: any) => String(x.cat)))].map(id => ({ id, uz: id, ru: id, en: undefined, emoji: null })))
        }
        if (j.delivery) setDeliveryCfg({ fee: Number(j.delivery.fee) || 15000, threshold: Number(j.delivery.threshold) || 200000 })
      } else {
        setProducts([]) // server javob bermasa: bo'sh menyu (iiko manba)
      }
      setMenuLoading(false)
    }).catch(() => { if (!dead) { setMenuLoading(false) } })
    fetch('/api/branches').then(r => r.ok ? r.json() : null).then(j => {
      if (dead || !j?.ok || !Array.isArray(j.branches) || !j.branches.length) return
      setFF(prev => ({
        branches: j.branches.map((b: any) => ({
          id: String(b.id), name: { uz: b.name?.uz || '', ru: b.name?.ru || '', en: b.name?.en || undefined },
          hours_24_7: !!b.hours_24_7, address: b.address ?? null, lat: b.lat ?? null, lon: b.lon ?? null,
        })),
        pickup_cfg: j.pickup_cfg || null,
        delivery: {
          fee: Number(j.delivery?.fee) || 15000,
          threshold: Number(j.delivery?.threshold) || 200000,
          eta_minutes: j.delivery?.eta_minutes ?? null,
        },
      }))
    }).catch(() => {})
    refreshOrders()
    return () => { dead = true }
  }, [])

  /* Jim sinxronizatsiya: sahifa ko'rinayotganda har 30 soniyada backend
     tekshiriladi. Javob joriy holatdan FARQ qilsagina UI yangilanadi —
     tab almashinuvi yoki kutish paytida qayta render va qayta yuklash
     bo'lmaydi (foydalanuvchi talabi: faqat belgilangan vaqtda tekshirish). */
  useEffect(() => {
    let dead = false
    let lastMenu = ''
    let lastBranches = ''
    const tick = () => {
      if (document.visibilityState !== 'visible' || dead) return
      fetch('/api/menu').then(r => r.ok ? r.json() : null).then((j: any) => {
        if (dead || !j) return
        const items = (j.ok && Array.isArray(j.items) && j.items.length) ? j.items : null
        const sig = items ? JSON.stringify(items) + '|' + JSON.stringify(j.delivery || null) : ''
        if (!sig || sig === lastMenu) return
        lastMenu = sig
        setProducts(prev => (JSON.stringify(prev) === JSON.stringify(items) ? prev : items))
        if (j.delivery) setDeliveryCfg(prev => {
          const next = { fee: Number(j.delivery.fee) || 15000, threshold: Number(j.delivery.threshold) || 200000 }
          return (prev.fee === next.fee && prev.threshold === next.threshold) ? prev : next
        })
      }).catch(() => {})
      fetch('/api/branches').then(r => r.ok ? r.json() : null).then((j: any) => {
        if (dead || !j?.ok || !Array.isArray(j.branches) || !j.branches.length) return
        setFF(prev => {
          const next = {
            branches: j.branches.map((b: any) => ({
              id: String(b.id), name: { uz: b.name?.uz || '', ru: b.name?.ru || '', en: b.name?.en || undefined },
              hours_24_7: !!b.hours_24_7, address: b.address ?? null, lat: b.lat ?? null, lon: b.lon ?? null,
            })),
            pickup_cfg: j.pickup_cfg || null,
            delivery: {
              fee: Number(j.delivery?.fee) || 15000,
              threshold: Number(j.delivery?.threshold) || 200000,
              eta_minutes: j.delivery?.eta_minutes ?? null,
            },
          }
          return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        })
      }).catch(() => {})
      if (tgUser()) refreshOrders()
    }
    const id = window.setInterval(tick, 30000)
    const onVis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { dead = true; window.clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [refreshOrders])

  const value = useMemo<Store>(() => {
    const lines: CartLine[] = Object.entries(cartMap)
      .map(([id, q]) => { const p = products.find(x => x.id === id); return p ? { ...p, q } : null })
      .filter(Boolean) as CartLine[]
    // Badge savat xaritasidan: menyu hali yuklanmagan bo'lsa ham to'g'ri
    const count = Object.values(cartMap).reduce((s, q) => s + (q || 0), 0)
    const sum = lines.reduce((s, l) => s + l.q * l.price, 0)
    return { lang, setLang, t: T[lang] as Trans, products, cats, cart: lines, cartCount: count, cartSum: sum, add, setQty, clearCart, favs, toggleFav, toast, showToast, myOrders, saveMyOrder, refreshOrders, sheetP, openP, closeP, role, roleReady, user, saveUser, ob, openOb, closeOb, mode, setMode, pickup, setPickup, deliveryCfg, ff, menuLoading, ordersLoaded, userChecked }
  }, [lang, cartMap, favs, toast, myOrders, sheetP, role, roleReady, products, cats, user, ob, setLang, add, setQty, clearCart, toggleFav, showToast, saveMyOrder, refreshOrders, openP, closeP, saveUser, openOb, closeOb, mode, setMode, pickup, setPickup, deliveryCfg, ff, menuLoading, ordersLoaded, userChecked])

  const navValue = useMemo<NavState>(() => ({ navOpen, setNavOpen }), [navOpen, setNavOpen])
  return (
    <Ctx.Provider value={value}>
      <NavCtx.Provider value={navValue}>{children}</NavCtx.Provider>
    </Ctx.Provider>
  )
}
