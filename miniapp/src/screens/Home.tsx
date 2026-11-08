import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, CATS } from '../lib/store'
import { TopBar, ProductCard } from '../components/ui'
import { haptic } from '../lib/tg'

const CAT_ICON: Record<string, string> = {
  set: '🍱', roll: '🍣', issiq: '🔥', sup: '🍲', wok: '🍜', salat: '🥗', desert: '🍰', ichimlik: '🥤', garnir: '🍚'
}

export default function Home() {
  const { t, lang, products, favs, showToast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = React.useState('')
  const hits = products.filter(p => p.hit)
  const fav = products.filter(p => favs.includes(p.id))
  const found = q.trim() ? products.filter(p => pName(p, lang).toLowerCase().includes(q.trim().toLowerCase())) : null

  return (
    <div className="pb-28">
      <TopBar />
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
            <div className="grid grid-cols-2 gap-2.5">{found.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
          )}
        </section>
      ) : (
        <>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-4 pb-1">
            {CATS.map(c => (
              <button key={c.id} onClick={() => { haptic(); nav(`/cat/${c.id}`) }}
                className="press shrink-0 flex flex-col items-center gap-1.5 bg-white border border-navy-line rounded-[18px] px-3.5 py-2.5 active:scale-95 transition-transform">
                <span className="text-[24px]">{CAT_ICON[(c as any).id] || '🍽'}</span>
                <span className="text-[11px] font-bold">{(c as any)[lang] || t.catNames[c.id]}</span>
              </button>
            ))}
          </div>

          <section className="px-4 mt-4">
            <div className="tekit-pattern rounded-[22px] p-4 flex items-center gap-3.5 shadow-[0_12px_28px_-12px_rgba(10,33,148,.5)]">
              <img src="/box.png" alt="" className="w-[74px] h-[74px] rounded-2xl object-cover bg-white/15" onError={e => (e.currentTarget.style.display = 'none')} />
              <div className="flex-1 text-white">
                <div className="text-[15px] font-extrabold">{t.freeDelivery}</div>
                <div className="text-[12px] font-medium text-white/75 mt-0.5">{t.city} · {t.payLater}</div>
              </div>
            </div>
          </section>

          {fav.length > 0 && (
            <section className="mt-5">
              <h2 className="px-4 text-[17px] font-extrabold">{t.favTitle}</h2>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-2.5 pb-1">
                {fav.map(p => (
                  <button key={p.id} onClick={() => { haptic(); nav(`/p/${p.id}`) }}
                    className="press shrink-0 w-[136px] bg-white border border-navy-line rounded-[18px] overflow-hidden text-left active:scale-95 transition-transform">
                    <img src={`/img/${p.img}.jpg`} alt="" loading="lazy" className="w-full aspect-square object-cover bg-navy-soft" />
                    <div className="p-2 text-[12px] font-bold truncate">{pName(p, lang)}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-5">
            <h2 className="px-4 text-[17px] font-extrabold">🔥 {t.hit}</h2>
            <div className="grid grid-cols-2 gap-2.5 px-4 mt-2.5">
              {hits.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
