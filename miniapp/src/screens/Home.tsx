import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, CATS, type Product } from '../lib/store'
import { TopBar, ProductCard, QtyPill } from '../components/ui'
import { haptic } from '../lib/tg'
import { CAT_ICON, Search, Heart, Flame, Percent, UtensilsCrossed, Bike } from '../lib/icons'

function CatChips() {
  const { lang, products } = useStore()
  const nav = useNavigate()
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 mt-4 pb-1 lg:flex-wrap lg:overflow-visible lg:max-w-[1240px] lg:mx-auto">
      {CATS.map(c => {
        const I = CAT_ICON[(c as any).id] || UtensilsCrossed
        const n = products.filter((p: Product) => p.cat === (c as any).id).length
        return (
          <button key={(c as any).id} onClick={() => { haptic(); nav(`/cat/${(c as any).id}`) }}
            className="press shrink-0 flex items-center gap-2 h-10 pl-3 pr-3.5 bg-white border border-navy-line rounded-full text-[12.5px] font-bold text-navy-ink active:scale-95 active:bg-navy-soft transition-transform shadow-sm">
            <I size={15} strokeWidth={2.2} className="text-navy" />
            {(c as any)[lang] || (c as any).uz}
            {n > 0 && <span className="text-[10px] font-extrabold text-[#A2A9C6]">{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

function SectionHead({ icon: I, title, count, accent }: { icon?: any; title: string; count?: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-4 lg:px-0">
      {I && <span className={`w-7 h-7 rounded-full grid place-items-center ${accent ? 'bg-accent-soft text-accent' : 'bg-navy-soft text-navy'}`}><I size={14} strokeWidth={2.4} /></span>}
      <h2 className="text-[17px] font-extrabold">{title}</h2>
      {count != null && count > 0 && <span className={`text-[10.5px] font-extrabold rounded-full px-2 py-0.5 ${accent ? 'bg-accent text-white' : 'bg-navy text-white'}`}>{count}</span>}
    </div>
  )
}

export default function Home() {
  const { t, lang, products, favs, showToast, toggleFav, openP } = useStore()
  const nav = useNavigate()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const fav = products.filter(p => favs.includes(p.id))
  const found = q.trim() ? products.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase())) : null

  return (
    <div className="pb-28 lg:pb-12">
      <TopBar />
      {/* HERO: video banner (kgsushi uslubi) */}
      <div className="px-4 lg:px-0 pt-3 lg:max-w-[1240px] lg:mx-auto">
        <div className="relative rounded-[24px] lg:rounded-none overflow-hidden bg-navy-deep h-[168px] lg:h-[380px] lg:w-full">
          <video src="/hero.mp4" autoPlay muted loop playsInline preload="metadata"
            className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/25 to-transparent" />
          <div className="absolute inset-0 tekit-pattern opacity-[.16] pointer-events-none" />
          <div className="absolute left-4 bottom-4 lg:left-10 lg:bottom-10 text-white max-w-[70%] lg:max-w-[560px]">
            <div className="text-[22px] lg:text-[42px] font-extrabold leading-tight drop-shadow-sm">{t.brand}</div>
            <div className="mt-1 lg:mt-2 text-[12px] lg:text-[17px] font-semibold text-white/85">{t.tagline}</div>
            <div className="mt-2.5 lg:mt-4 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1.5 lg:px-4 lg:py-2">
              <Bike size={14} className="lg:hidden" />
              <span className="text-[11px] lg:text-[14px] font-extrabold">{t.freeDelivery} · {t.city}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:max-w-[1240px] lg:mx-auto">
      <div className="px-4 lg:px-0 mt-3.5">
        <div className="relative lg:max-w-[560px]">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search}
            className="w-full bg-white border border-navy-line rounded-full py-3 pl-11 pr-4 text-[14px] font-medium placeholder:text-[#A2A9C6] outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm" />
          <Search size={17} strokeWidth={2.2} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A2A9C6]" />
        </div>
      </div>

      {found ? (
        <section className="px-4 lg:px-0 mt-4">
          {found.length === 0 ? <div className="py-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-4">{found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
          )}
        </section>
      ) : (
        <>
          <CatChips />

          {sales.length > 0 && (
            <section className="mt-5 lg:mt-8">
              <SectionHead icon={Percent} title={t.aSaleHome} count={sales.length} accent />
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
                {sales.map((p, i) => <div key={p.id} className="w-[160px] shrink-0 lg:w-auto"><ProductCard p={p} i={i} /></div>)}
              </div>
            </section>
          )}

          {fav.length > 0 && (
            <section className="mt-5 lg:mt-8">
              <SectionHead icon={Heart} title={t.favTitle} />
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
                {fav.map(p => {
                  const on = favs.includes(p.id)
                  return (
                    <article key={p.id} onClick={() => { haptic(); openP(p) }}
                      className="press shrink-0 w-[136px] lg:w-auto bg-white border border-navy-line rounded-[20px] overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-card">
                      <div className="relative">
                        <img src={pImg(p)} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover bg-navy-soft" />
                        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic() }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 grid place-items-center shadow-sm active:scale-90 transition-transform">
                          <Heart size={15} fill={on ? '#E23B52' : 'none'} color={on ? '#E23B52' : '#8A93B8'} strokeWidth={2} />
                        </button>
                        <QtyPill p={p} small />
                      </div>
                      <div className="p-2 text-[12px] font-bold truncate">{pName(p, lang)}</div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          <section className="mt-5 lg:mt-8">
            <SectionHead icon={Flame} title={t.hit} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-4 px-4 lg:px-0 mt-2.5">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-4 px-4 lg:px-0 mt-2.5">
                  {list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
                </div>
              </section>
            )
          })}
        </>
      )}
      </div>
    </div>
  )
}
