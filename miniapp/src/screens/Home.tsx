import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, CATS, type Product } from '../lib/store'
import { ProductCard, QtyPill } from '../components/ui'
import { haptic } from '../lib/tg'
import { CAT_ICON, Search, Heart, Flame, Percent, UtensilsCrossed, Bike, Clock, MapPin, ChevronRight } from '../lib/icons'

/* kgsushi.ru nusxasi: hero video to'liq kenglik, sariq info-strip, yetkazish paneli,
   promo kartalar, kategoriya chiplari, bo'limlar grid. */

function CatChips() {
  const { lang, products } = useStore()
  const nav = useNavigate()
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:flex-wrap lg:overflow-visible">
      {CATS.map(c => {
        const I = CAT_ICON[(c as any).id] || UtensilsCrossed
        const n = products.filter((p: Product) => p.cat === (c as any).id).length
        return (
          <button key={(c as any).id} onClick={() => { haptic(); nav(`/cat/${(c as any).id}`) }}
            className="press shrink-0 flex items-center gap-2 h-10 px-4 bg-[#F2F2F4] rounded-full text-[14.5px] font-bold text-[#111] active:scale-95 active:bg-navy-soft transition-transform">
            <I size={15} strokeWidth={2.2} className="text-navy" />
            {(c as any)[lang] || (c as any).uz}
            {n > 0 && <span className="text-[11.5px] font-extrabold text-[#A2A9C6]">{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

function SectionHead({ icon: I, title, count, accent }: { icon?: any; title: string; count?: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      {I && <span className={`w-7 h-7 rounded-full grid place-items-center ${accent ? 'bg-accent-soft text-accent' : 'bg-navy-soft text-navy'}`}><I size={14} strokeWidth={2.4} /></span>}
      <h2 className="text-[20px] font-extrabold text-[#111] lg:text-[24px]">{title}</h2>
      {count != null && count > 0 && <span className={`text-[12px] font-extrabold rounded-full px-2 py-0.5 ${accent ? 'bg-accent text-white' : 'bg-navy text-white'}`}>{count}</span>}
    </div>
  )
}

const CONT = 'mx-auto w-full max-w-[1020px] px-3 lg:px-4'

export default function Home() {
  const { t, lang, products, favs, showToast, toggleFav, openP, user } = useStore()
  const nav = useNavigate()
  const [q, setQ] = React.useState('')
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const fav = products.filter(p => favs.includes(p.id))
  const found = q.trim() ? products.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase())) : null

  const sets = products.filter(p => p.cat === 'set')
  const stories = [
    { img: pImg(sales[0] || hits[0]), badge: t.aSaleHome, title: t.tileSales, sub: t.tileSalesSub, to: '#sales' },
    { img: pImg(hits[0]), badge: t.hit, title: t.hit, sub: `${hits.length} ${t.stItems}`, to: '/cat/hit' },
    { img: pImg(sets[0]), badge: null, title: (CATS.find(c => (c as any).id === 'set') as any)?.[lang] || t.catNames.set, sub: `${sets.length} ${t.stItems}`, to: '/cat/set' },
    { img: null, badge: null, title: t.tileFree, sub: t.tileFreeSub, to: '#delivery' },
  ]

  return (
    <div className="pb-10 lg:pb-12">
      {/* HERO: to'liq kenglik video (kgsushi) */}
      <div className="relative h-[490px] md:h-[385px] lg:h-[585px] w-full overflow-hidden bg-navy-deep">
        <video src="/hero.mp4" autoPlay muted loop playsInline preload="metadata"
          className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Info strip: sariq matnli tungi lenta */}
      <div className="bg-navy-deep">
        <div className={CONT}>
          <div className="flex items-center gap-2.5 py-3.5 lg:py-4">
            <Clock size={18} strokeWidth={2.4} className="shrink-0 text-[#F5C84B]" />
            <div className="text-[14.5px] leading-snug lg:text-[16.5px]">
              <span className="font-extrabold text-[#F5C84B]">{t.cookNow}</span>{' '}
              <span className="font-medium text-white/85">{t.cookSub}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={CONT}>
        {/* Yetkazish usuli + manzil */}
        <div id="delivery" className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-[#F2F2F4] p-1 md:w-[300px]">
            {(['delivery', 'pickup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); localStorage.setItem('tk-mode', m); haptic('light') }}
                className={`press h-full flex-1 rounded-lg text-[14.5px] font-bold transition-colors ${mode === m ? 'bg-accent text-white shadow-[0_6px_16px_-8px_rgba(255,106,43,.7)]' : 'text-[#111]'}`}>
                {m === 'delivery' ? t.delivery : t.pickupShort}
              </button>
            ))}
          </div>
          <button onClick={() => { haptic(); nav('/checkout') }}
            className="press flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-[#F2F2F4] px-4 text-left">
            <MapPin size={19} strokeWidth={2.2} className="shrink-0 text-[#111]" />
            <span className="min-w-0 flex-1 truncate text-[15.5px] font-semibold text-[#111]">{t.addrCard}</span>
            <ChevronRight size={17} className="shrink-0 text-[#A2A9C6]" />
          </button>
        </div>

        {/* Bonus sariq kartochka */}
        <button onClick={() => { haptic(); nav(user ? '/profile' : '/profile') }}
          className="press mt-2 flex w-full items-center gap-3 rounded-xl bg-[#FFD84D] px-4 py-3 text-left active:scale-[.99] transition-transform">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/60 text-[#111]"><Bike size={18} strokeWidth={2.2} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold leading-tight text-[#111]">{t.bonusTitle}</div>
            <div className="mt-0.5 text-[13px] font-semibold leading-tight text-[#111]/70">{t.bonusSub}</div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#111]/70" />
        </button>

        {/* Storislar (kgsushi uslubi) */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:pb-0">
          {stories.map((x, i) => (
            <button key={i} onClick={() => { haptic(); x.to.startsWith('#') ? document.getElementById(x.to.slice(1))?.scrollIntoView({ behavior: 'smooth' }) : nav(x.to) }}
              className="press relative w-[138px] shrink-0 overflow-hidden rounded-2xl text-left active:scale-[.98] transition-transform lg:w-auto"
              style={{ aspectRatio: '3 / 4' }}>
              {x.img ? (
                <img src={x.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="tekit-pattern absolute inset-0 grid place-items-center">
                  <img src="/logo.png" alt="" className="w-14 h-14 rounded-2xl bg-white/15 shadow-lg" />
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/15 to-transparent" />
              {x.badge && <span className="absolute left-2.5 top-2.5 rounded-lg bg-accent px-2 py-1 text-[12px] font-extrabold uppercase tracking-wide text-white shadow">{x.badge}</span>}
              <span className="absolute bottom-0 left-0 right-0 p-3">
                <span className="block text-[15px] font-extrabold leading-tight text-white">{x.title}</span>
                <span className="mt-0.5 block text-[12.5px] font-semibold leading-tight text-white/80">{x.sub}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Qidiruv */}
        <div className="mt-3.5">
          <div className="relative">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search}
              className="w-full bg-[#F2F2F4] rounded-full py-3 pl-11 pr-4 text-[15.5px] font-medium text-[#111] placeholder:text-[#A2A9C6] outline-none focus:ring-2 focus:ring-navy/15" />
            <Search size={17} strokeWidth={2.2} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A2A9C6]" />
          </div>
        </div>
      </div>

      {found ? (
        <section className={CONT + ' mt-4'}>
          {found.length === 0 ? <div className="py-10 text-center text-[15.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-5">{found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
          )}
        </section>
      ) : (
        <>
          <div className={CONT} id="cats">
            <div className="mt-4"><CatChips /></div>

            {sales.length > 0 && (
              <section className="mt-5 lg:mt-8" id="sales">
                <SectionHead icon={Percent} title={t.aSaleHome} count={sales.length} accent />
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-5">
                  {sales.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
                </div>
              </section>
            )}

            {fav.length > 0 && (
              <section className="mt-5 lg:mt-8">
                <SectionHead icon={Heart} title={t.favTitle} />
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-5">
                  {fav.map(p => {
                    const on = favs.includes(p.id)
                    return (
                      <article key={p.id} onClick={() => { haptic(); openP(p) }}
                        className="press cursor-pointer overflow-hidden rounded-[14px] bg-white active:scale-[.985] transition-transform">
                        <div className="relative aspect-square overflow-hidden rounded-[14px] bg-[#F4F4F6]">
                          <img src={pImg(p)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic() }}
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-sm active:scale-90 transition-transform">
                            <Heart size={15} fill={on ? '#E23B52' : 'none'} color={on ? '#E23B52' : '#8A93B8'} strokeWidth={2} />
                          </button>
                        </div>
                        <div className="px-1.5 pt-2 text-[13.5px] font-bold truncate">{pName(p, lang)}</div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="mt-5 lg:mt-8">
              <SectionHead icon={Flame} title={t.hit} />
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-5">
                {hits.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
              </div>
            </section>

            <section className="mt-6 lg:mt-10">
              <SectionHead icon={Search} title={t.menuT} />
            </section>
            {CATS.map(c => {
              const list = products.filter(p => p.cat === (c as any).id)
              if (!list.length) return null
              return (
                <section className="mt-5 lg:mt-7" key={(c as any).id}>
                  <SectionHead icon={CAT_ICON[(c as any).id]} title={(c as any)[lang] || t.catNames[(c as any).id]} count={list.length} />
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-5">
                    {list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
