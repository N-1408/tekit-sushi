import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, CATS } from '../lib/store'
import { TopBar, ProductCard, QtyPill } from '../components/ui'
import { haptic } from '../lib/tg'

const CAT_ICON: Record<string, string> = {
  set: '🍱', roll: '🍣', issiq: '🔥', sup: '🍲', wok: '🍜', salat: '🥗', desert: '🍰', ichimlik: '🥤', garnir: '🍚'
}

export default function Home() {
  const { t, lang, products, favs, showToast, toggleFav, openP } = useStore()
  const { add } = useStore()
  const nav = useNavigate()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const sales = products.filter(p => (p as any).sale_active && ((p as any).old_price ?? 0) > p.price)
  const fav = products.filter(p => favs.includes(p.id))
  const found = q.trim() ? products.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase())) : null

  return (
    <div className="pb-28 lg:pb-12">
      <TopBar />
      <div className="lg:max-w-[1240px] lg:mx-auto">
      <div className="px-4 pt-3">
        <div className="relative">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search}
            className="w-full bg-white border border-navy-line rounded-2xl py-3 pl-11 pr-4 text-[14px] font-medium placeholder:text-[#A2A9C6] outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A2A9C6]" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </div>
      </div>

      {found ? (
        <section className="px-4 mt-4">
          {found.length === 0 ? <div className="py-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-4">{found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
          )}
        </section>
      ) : (
        <>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-4 pb-1">
            {CATS.map(c => (
              <button key={c.id} onClick={() => { haptic(); nav(`/cat/${c.id}`) }}
                className="press shrink-0 w-[76px] h-[88px] flex flex-col items-center justify-center gap-1.5 bg-white border border-navy-line rounded-[18px] active:scale-95 transition-transform">
                <span className="text-[24px]">{CAT_ICON[(c as any).id] || '🍽'}</span>
                <span className="text-[11px] font-bold">{(c as any)[lang] || t.catNames[c.id]}</span>
              </button>
            ))}
          </div>

          {sales.length > 0 && (
            <section className="px-4 mt-4">
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="text-[16px]">🔥</span>
                <h2 className="text-[15.5px] font-extrabold">{t.aSaleHome}</h2>
                <span className="text-[10.5px] font-extrabold bg-red-600 text-white rounded-lg px-2 py-0.5">{sales.length}</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:overflow-visible">
                {sales.map((p, i) => <div key={p.id} className="w-[160px] shrink-0 lg:w-auto"><ProductCard p={p} i={i} /></div>)}
              </div>
            </section>
          )}

          <section className="px-4 mt-4">
            <div className="tekit-pattern rounded-[22px] p-4 flex items-center gap-3.5 shadow-[0_12px_28px_-12px_rgba(10,33,148,.5)]">
              <img src="/logo.png" alt="" width={74} height={74} className="w-[74px] h-[74px] rounded-2xl object-cover bg-white/15" />
              <div className="flex-1 text-white">
                <div className="text-[15px] font-extrabold">{t.freeDelivery}</div>
                <div className="text-[12px] font-medium text-white/75 mt-0.5">{t.city} · 🛵</div>
              </div>
            </div>
          </section>

          {fav.length > 0 && (
            <section className="mt-5">
              <h2 className="px-4 text-[17px] font-extrabold">{t.favTitle}</h2>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-2.5 pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:overflow-visible">
                {fav.map(p => {
                  const on = favs.includes(p.id)
                  return (
                    <article key={p.id} onClick={() => { haptic(); openP(p) }}
                      className="press shrink-0 w-[136px] lg:w-auto bg-white border border-navy-line rounded-[18px] overflow-hidden cursor-pointer active:scale-95 transition-transform">
                      <div className="relative">
                        <img src={pImg(p)} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover bg-navy-soft" />
                        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic() }}
                          className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-white/95 grid place-items-center shadow-sm active:scale-90 transition-transform touch-manipulation">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={on ? '#E23B52' : 'none'} stroke={on ? '#E23B52' : '#8A93B8'} strokeWidth="2"><path d="M12 21C7 16.6 3 13.4 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4.1-4 7.3-9 11.7z" /></svg>
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

          <section className="mt-5">
            <h2 className="px-4 text-[17px] font-extrabold">🔥 {t.hit}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 lg:gap-4 px-4 mt-2.5">
              {hits.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
            </div>
          </section>

          {(['sushi', 'roll', 'ichimlik'] as const).map(cid => {
            const list = products.filter(p => p.cat === cid).slice(0, 10)
            if (!list.length) return null
            return (
              <section className="mt-5" key={cid}>
                <div className="flex items-center justify-between pr-4">
                  <h2 className="px-4 text-[17px] font-extrabold">{t.catNames[cid]}</h2>
                  <button onClick={() => { haptic(); nav(`/cat/${cid}`) }} className="text-[12px] font-bold text-navy active:opacity-60">{t.all} →</button>
                </div>
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-2.5 pb-1 lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:gap-4 lg:overflow-visible">
                  {list.map((p, i) => <div key={p.id} className="w-[152px] shrink-0 lg:w-auto"><ProductCard p={p} i={i} /></div>)}
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
