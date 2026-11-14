import React from 'react'
import { useStore, pName, CATS, type Product } from '../lib/store'
import { Header, CatalogNav, CityBanner, HeroSlider, ProductCard } from '../components/ui'

const SEC = (id: string) => `cat-${id}`

function Section({ id, title, items }: { id?: string; title: string; items: Product[] }) {
  if (!items.length) return null
  const list = items
  return (
    <section id={id} className="mt-7">
      <div className="px-4 lg:px-6 mb-3">
        <h2 className="text-[26px] lg:text-[34px] font-extrabold tracking-tight">{title}</h2>
      </div>
      <div className="px-4 lg:px-6 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7">
        {list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
      </div>
    </section>
  )
}

/* Katalog bo'limlarini kuzatib, faol kategoriyani aniqlaydi.
   IntersectionObserver sticky qator ostidagi ingichka chegara chizig'ini kesib
   o'tgan bo'limlarni xabar qiladi; faol holat faqat o'zgarganda yangilanadi.
   Skroll listeneri yo'q, takroriy o'lchash yo'q. */
function useCatalogTracking(ids: string[], paused: boolean, wide: boolean) {
  const navRef = React.useRef<HTMLDivElement>(null)
  const hdrRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState<string | null>(null)
  const lockRef = React.useRef<string | null>(null)
  const rafRef = React.useRef(0)
  const idsKey = ids.join('|')

  const computeActive = React.useCallback(() => {
    if (lockRef.current) return
    const list = idsKey ? idsKey.split('|') : []
    if (!list.length) { setActive(null); return }
    let boundary = 0
    if (wide) {
      const nav = navRef.current
      boundary = (nav ? nav.getBoundingClientRect().bottom : 0) + 1
    } else {
      // Mobil: chiplar endi sticky emas, chegara — pinlangan sarlavhaning pasti
      const hdr = hdrRef.current
      if (hdr) boundary = (parseFloat(getComputedStyle(hdr).top) || 0) + hdr.offsetHeight + 1
    }
    let cur: string | null = null
    for (const id of list) {
      const el = document.getElementById(SEC(id))
      if (!el) continue
      if (el.getBoundingClientRect().top <= boundary) cur = id
      else break
    }
    const doc = document.documentElement
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) cur = list[list.length - 1]
    setActive(prev => (prev === cur ? prev : cur))
  }, [idsKey])

  const onSelect = React.useCallback((id: string) => {
    const el = document.getElementById(SEC(id))
    if (!el) return
    // Skroll ofseti: mobil — pinlangan sarlavha (sat + balandligi), desktop —
    // sticky katalog qatori. Computed top var() ni PX ga hal qiladi.
    let off = 0
    if (wide) {
      const nav = navRef.current
      off = (nav ? nav.offsetHeight : 0) + (nav ? (parseFloat(getComputedStyle(nav).top) || 0) : 0) + 10
    } else {
      const hdr = hdrRef.current
      off = (hdr ? hdr.offsetHeight : 0) + (hdr ? (parseFloat(getComputedStyle(hdr).top) || 0) : 0) + 10
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // programmatik skroll davomida kuzatuv bloklanadi; yakunlangach haqiqiy joy bilan kelishiladi
    lockRef.current = id
    setActive(id)
    window.scrollTo({
      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - off),
      behavior: reduced ? 'auto' : 'smooth',
    })
    cancelAnimationFrame(rafRef.current)
    const t0 = performance.now()
    let last = -1
    let stable = 0
    const tick = () => {
      const y = window.scrollY
      if (y === last) stable++
      else { stable = 0; last = y }
      if (stable >= 3 || performance.now() - t0 > 900) {
        lockRef.current = null
        computeActive()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [computeActive, wide])

  React.useEffect(() => {
    if (paused) { setActive(null); return }
    const nav = navRef.current
    if (!nav) return
    let io: IntersectionObserver | null = null
    let endIo: IntersectionObserver | null = null
    const list = idsKey ? idsKey.split('|') : []
    const setup = () => {
      io?.disconnect()
      const vh = window.innerHeight
      let band = 0
      if (wide) band = nav.offsetHeight + (parseFloat(getComputedStyle(nav).top) || 0)
      else {
        const hdr = hdrRef.current
        if (hdr) band = (parseFloat(getComputedStyle(hdr).top) || 0) + hdr.offsetHeight
      }
      io = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) computeActive()
      }, { rootMargin: `-${band}px 0px -${Math.max(0, vh - band - 4)}px 0px`, threshold: 0 })
      for (const id of list) {
        const el = document.getElementById(SEC(id))
        if (el) io.observe(el)
      }
      computeActive()
    }
    setup()
    const onResize = () => setup()
    window.addEventListener('resize', onResize)
    // sahifa eng pastki qismiga yetganda oxirgi kategoriya faol bo'ladi
    const end = document.getElementById('catalog-end')
    if (end) {
      endIo = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting) && !lockRef.current && list.length) {
          setActive(list[list.length - 1])
        }
      })
      endIo.observe(end)
    }
    return () => {
      io?.disconnect()
      endIo?.disconnect()
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [idsKey, paused, computeActive])

  return { navRef, hdrRef, active, onSelect }
}

/* lg+ breakpoint kuzatuvi: sarlavha sticky faqat mobilda, desktopda eskicha */
function useWideScreen() {
  const [wide, setWide] = React.useState(() => window.matchMedia('(min-width: 1024px)').matches)
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const fn = (e: MediaQueryListEvent) => setWide(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return wide
}

export default function Home() {
  const { t, lang, products } = useStore()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const query = q.trim().toLowerCase()
  const found = query ? products.filter(p => pName(p, lang).toLowerCase().includes(query)) : null
  const searching = found != null

  // chiplar: faqat haqiqatan bo'limi bor kategoriyalar
  const chips = React.useMemo(() => CATS
    .filter(c => products.some(p => p.cat === c.id))
    .map(c => ({ id: c.id, label: (c as any)[lang] || t.catNames[c.id] })), [products, lang, t])

  const wide = useWideScreen()
  // Skroll bo'lganda sarlavha yon tugmalari yashirinadi, faqat markaziy logo qoladi
  const [stuck, setStuck] = React.useState(false)
  React.useEffect(() => {
    let raf = 0
    const fn = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setStuck(window.scrollY > 24))
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(raf) }
  }, [])
  const { navRef, hdrRef, active, onSelect } = useCatalogTracking(chips.map(c => c.id), searching, wide)

  return (
    <div className="pb-28 lg:pb-12">
      {/* Skroll qilinganda kontent notch/Telegram boshqaruvlari ostida ko'rinmasin:
          xavfsiz hudud fon bilan qoplanadi (sticky blok o'zi sat+6 ostida pinlanadi). */}
      <div className="tk-safe-cover" aria-hidden="true" />
      {/* Mobil: sarlavhaning o'zi sticky — safe-zone chegarasida (sat) pinlanadi.
          Skroll bo'lganda yon tugmalar yashirinadi, FAQAT markaziy logo qoladi. */}
      {wide ? (
        <div className="relative z-20 bg-[var(--bg)]" style={{ paddingTop: 'calc(6px + var(--sat))' }}>
          <Header />
        </div>
      ) : (
        <div ref={hdrRef} className="sticky z-30 bg-[var(--bg)] tk-hdr-sticky">
          <Header stuck={stuck} />
        </div>
      )}
      {/* Burger/qidiruv/kategoriyalar endi sticky EMAS: skroll qilinganda faqat
          markaziy logo qoladi. Sticky sarlavha oqim o'rnidan yuqorida render
          bo'lgani uchun pastdagi kontent sat+2 bilan kompensatsiya qilinadi. */}
      <div ref={navRef} className={`bg-[var(--bg)] ${wide ? 'sticky z-30 tk-sticky-catalog' : ''}`}
        style={wide ? undefined : { paddingTop: 'calc(2px + var(--sat))' }}>
        <CatalogNav q={q} setQ={setQ} chips={chips} active={searching ? null : active} onSelect={onSelect} />
      </div>
      <div className="lg:max-w-[1240px] lg:mx-auto">
        <CityBanner />
        {found ? (
          <section className="px-4 lg:px-6 mt-4">
            {found.length === 0 ? (
              <div className="py-10 text-center text-[14px] font-semibold text-[var(--mut2)]">— {t.noResults} —</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7">
                {found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            <HeroSlider />
            <Section title={t.aSaleHome} items={sales} />
            <Section title={t.hit} items={hits} />
            {CATS.map(c => {
              const list = products.filter(p => p.cat === c.id)
              return <Section key={c.id} id={SEC(c.id)} title={(c as any)[lang] || t.catNames[c.id]} items={list} />
            })}
            <div id="catalog-end" aria-hidden="true" className="h-px" />
          </>
        )}
      </div>
    </div>
  )
}
