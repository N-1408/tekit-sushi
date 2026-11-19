import React from 'react'
import { useStore, pName, CATS, inCat, type Product } from '../lib/store'
import { Header, CatalogNav, CityBanner, HeroSlider, ProductCard } from '../components/ui'
import { useScrollHide } from '../lib/scrollHide'

const SEC = (id: string) => `cat-${id}`

/* Menyu serverdan kelguncha skelet: joyi va tartibi real bo'limlarga mos */
function HomeSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="px-4 lg:px-6 mt-4"><div className="skel h-[150px] lg:h-[210px]" /></div>
      {[0, 1].map(r => (
        <div key={r} className="px-4 lg:px-6 mt-7">
          <div className="skel h-7 w-40 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skel aspect-square" />
                <div className="skel h-4 w-3/4" />
                <div className="skel h-9" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({ id, title, items }: { id?: string; title: string; items: Product[] }) {
  if (!items.length) return null
  const list = items
  return (
    <section id={id} className="mt-7" style={{ scrollMarginTop: 'calc(var(--hdr-h, 0px) + 8px)' }}>
      <div className="px-4 lg:px-6 pt-2 pb-1.5">
        <h2 className="text-[26px] lg:text-[34px] font-extrabold tracking-tight leading-none">{title}</h2>
      </div>
      <div className="px-4 lg:px-6 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7">
        {list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
      </div>
    </section>
  )
}

/* Katalog bo'limlarini kuzatib, faol kategoriyani aniqlaydi.
   IntersectionObserver sticky qator ostidagi ingichka chegara chizig'ini kesib
   o'tgan bo'limlarni xabar qiladi; faol holat faqat o'zgarganda yangilanadi.
   Skroll listeneri yo'q, takroriy o'lchash yo'q. */
function useCatalogTracking(ids: string[], paused: boolean) {
  const navRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState<string | null>(null)
  const lockRef = React.useRef<string | null>(null)
  const animRef = React.useRef<{ cancel: () => void } | null>(null)
  const resumeT = React.useRef(0)
  const idsKey = ids.join('|')

  /* Yopishqoq header blokining PASTKI chizig'i: onSelect va computeActive
     BIR XIL chegara bilan ishlaydi (avvalgi xato shu edida edi — ikki xil
     hisob, shuning uchun chip boshqasini ko'rsatardi). Order-type overlayi
     bu o'lchovga KIRMAYDI: u absolute, blok balandligini o'zgartirmaydi. */
  const getStickyBottom = React.useCallback(() => {
    const nav = navRef.current
    return nav ? nav.getBoundingClientRect().bottom : 0
  }, [])

  /* Faol kategoriya har skroll hodisasida (rAF bilan cheklangan) hisoblanadi:
     IntersectionObserver moslashtirilmaydigan holatlarda (sarlavha yig'ilib
     ochilganda, tez skrollda) faol nom belgisi shovqinli almashtirardi. */
  const computeActive = React.useCallback(() => {
    if (lockRef.current) return
    const list = idsKey ? idsKey.split('|') : []
    if (!list.length) { setActive(null); return }
    const boundary = getStickyBottom() + 1
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
  }, [idsKey, getStickyBottom])

  /* Foydalanuvchi aralashuvi: touch/pointer/wheel/keyboard — animatsiya darhol
     to'xtaydi, foydalanuvchi g'olib bo'ladi. Har biri bir marta eshitiladi. */
  const USER_EVENTS = ['touchstart', 'pointerdown', 'wheel', 'keydown']
  const listenUser = (fn: () => void) => {
    const h = () => fn()
    USER_EVENTS.forEach(ev => window.addEventListener(ev, h, { capture: true, passive: true } as AddEventListenerOptions))
    return () => { USER_EVENTS.forEach(ev => window.removeEventListener(ev, h, { capture: true } as EventListenerOptions)) }
  }
  const onSelect = React.useCallback((id: string) => {
    const el = document.getElementById(SEC(id))
    if (!el) return
    // Avvalgi animatsiyani to'xtat (tez ketma-ket bosishlar)
    if (animRef.current) { animRef.current.cancel(); animRef.current = null }
    window.clearTimeout(resumeT.current)
    // Faol chip DARHOL belgilanadi; kuzatuv (scroll-spy) animatsiya davomida bloklangan
    lockRef.current = id
    setActive(id)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /* Maqsad HAR KADRDA qayta o'qiladi: yuqorida rasm/skelet yuklanib joy
       siljisa ham aynan maqsadga boradi. Sarlavha header ostiga AYNAN tekislanadi
       (top == chegara), shuning uchun computeActive ham shu chipni ko'rsatadi. */
    const readTarget = () => {
      const bottom = getStickyBottom()
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY - bottom + 1)
    }
    const scheduleResume = () => {
      // Faol chip saqlanadi: kuzatuv faqat keyingi FOYDALANUVCHI harakatida yoki
      // xavfsizlik taymeri (1.2s) bilan davom etadi
      let off2: () => void = () => {}
      const resume = () => {
        window.clearTimeout(resumeT.current); off2()
        lockRef.current = null
        computeActive()
      }
      off2 = listenUser(resume)
      resumeT.current = window.setTimeout(resume, 1200)
    }
    let raf = 0
    let done = false
    let off = () => {}
    const interrupt = () => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      off()
      animRef.current = null
      scheduleResume()
    }
    const finish = () => {
      if (done) return
      done = true
      window.scrollTo(0, readTarget())
      off()
      animRef.current = null
      scheduleResume()
    }
    if (reduced) {
      window.scrollTo(0, readTarget())
      finish()
      return
    }
    const startY = window.scrollY
    const dist0 = Math.abs(readTarget() - startY)
    // Masofaga mos davomiylik (380-750ms), ease-in-out kub
    const dur = Math.min(750, Math.max(380, 380 + dist0 * 0.18))
    const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    const t0 = performance.now()
    const tick = (now: number) => {
      if (done) return
      const p = Math.min(1, (now - t0) / dur)
      const y = startY + (readTarget() - startY) * easeInOut(p)
      window.scrollTo(0, y)
      if (p < 1) raf = requestAnimationFrame(tick)
      else finish()
    }
    off = listenUser(interrupt)
    raf = requestAnimationFrame(tick)
    animRef.current = { cancel: interrupt }
  }, [computeActive, getStickyBottom])

  React.useEffect(() => {
    if (paused) { setActive(null); return }
    let raf = 0
    const fn = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(computeActive)
    }
    window.addEventListener('scroll', fn, { passive: true })
    window.addEventListener('resize', fn)
    computeActive()
    // layout barqarorlashgach bir marta qayta hisoblash (skelet/rasm almashinuvi)
    const t = window.setTimeout(computeActive, 350)
    return () => {
      window.removeEventListener('scroll', fn)
      window.removeEventListener('resize', fn)
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [idsKey, paused, computeActive])

  return { navRef, active, onSelect }
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
  const { t, lang, products, menuLoading } = useStore()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const query = q.trim().toLowerCase()
  const found = query ? products.filter(p => pName(p, lang).toLowerCase().includes(query)) : null
  const searching = found != null
  // menyu serverdan kelguncha skelet ko'rsatiladi
  const loading = menuLoading && products.length === 0

  // chiplar: faqat haqiqatan bo'limi bor kategoriyalar
  const chips = React.useMemo(() => CATS
    .filter(c => products.some(p => inCat(p, c.id)))
    .map(c => ({ id: c.id, label: (c as any)[lang] || t.catNames[c.id] })), [products, lang, t])

  const wide = useWideScreen()
  // Yo'nalishga sezgir brend qatori: pastga skroll — yig'iladi, yuqoriga —
  // darhol qaytadi (faqat tepada emas, istalgan joyda). Kategoriyalar qatori qoladi.
  const { atTop: scrolledTop } = useScrollHide()
  const { navRef, active, onSelect } = useCatalogTracking(chips.map(c => c.id), searching)

  // Kategoriya qatori balandligi: yopishqoq bo'lim sarlavhalari uning OSTIDA
  // qotishi uchun (skroll holatida aniq chiziqda turadi).
  const catRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const el = catRef.current
    if (!el) return
    const set = () => { try { document.documentElement.style.setProperty('--catnav-h', el.offsetHeight + 'px') } catch { /* noop */ } }
    set()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(set) : null
    ro?.observe(el)
    document.fonts?.ready?.then(set).catch(() => {})
    return () => { ro?.disconnect() }
  }, [])

  // BUTUN header bloki balandligi (--hdr-h): logo + burger/qator + panel
  // (ochilganda) + chips. ResizeObserver bilan har o'zgarishda yangilanadi.
  React.useEffect(() => {
    const el = navRef.current
    if (!el) return
    const set = () => { try { document.documentElement.style.setProperty('--hdr-h', el.offsetHeight + 'px') } catch { /* noop */ } }
    set()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(set) : null
    ro?.observe(el)
    document.fonts?.ready?.then(set).catch(() => {})
    return () => { ro?.disconnect() }
  }, [])

  return (
    <div className="pb-28 lg:pb-12">
      {/* Bitta sticky blok: mobil — brend qatori (skroll bo'lganda silliq
          yig'iladi, faqat logo qatori ko'chib ketadi) + burger/qidiruv/kategoriyalar
          birgalikda safe-zone chegarasida (sat) pinlanadi. Blok oqim o'rnidan
          yuqorida render bo'lgani uchun pastdagi kontent sat bilan kompensatsiya. */}
      {(() => {
        const catalogNav = <CatalogNav q={q} setQ={setQ} chips={chips} active={searching ? null : active} onSelect={onSelect} />
        return wide ? (
          <>
            <div className="relative z-20" style={{ paddingTop: 'calc(6px + var(--sat))' }}>
              <Header />
            </div>
            <div ref={navRef} className="sticky z-30 tk-sticky-catalog">
              <div ref={catRef}>{catalogNav}</div>
            </div>
          </>
        ) : (
          /* Ko'k header bloki EKRAN TEPASIDAN boshlanadi: xavfsiz hudud
             (Telegram tugmalari) ham ko'k fon ortida qoladi, kontent esa
             paddingTop: var(--sat) bilan inset ostidan boshlanadi. */
          <div ref={navRef} className="sticky z-30 tk-hdr-sticky">
            <div className="tk-hdr-blue" style={{ paddingTop: 'var(--sat)' }}>
              <Header floating={scrolledTop} />
              <div ref={catRef}>{catalogNav}</div>
            </div>
          </div>
        )
      })()}
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
        ) : loading ? (
          <HomeSkeleton />
        ) : (
          <>
            <HeroSlider />
            <Section title={t.aSaleHome} items={sales} />
            <Section title={t.hit} items={hits} />
            {CATS.map(c => {
              const list = products.filter(p => inCat(p, c.id))
              return <Section key={c.id} id={SEC(c.id)} title={(c as any)[lang] || t.catNames[c.id]} items={list} />
            })}
            <div id="catalog-end" aria-hidden="true" className="h-px" />
          </>
        )}
      </div>
    </div>
  )
}
