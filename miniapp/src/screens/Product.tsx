import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pName, pImg, pDesc } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, Qty } from '../components/ui'

export default function Product() {
  const { id } = useParams()
  const { products, lang, t, add, favs, toggleFav, showToast } = useStore()
  const nav = useNavigate()
  const p = products.find(x => x.id === id)
  const [q, setQ] = React.useState(1)
  if (!p) return <div className="pb-28"><TopBar title="…" /></div>
  const fav = favs.includes(p.id)
  const rel = products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4)

  return (
    <div className="pb-32">
      <TopBar title={pName(p, lang)} />
      <div className="relative">
        <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover bg-navy-soft" />
        <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-3 right-4 w-10 h-10 rounded-full bg-white grid place-items-center shadow-md active:scale-90 transition-transform">
          <svg width="19" height="19" viewBox="0 0 24 24" fill={fav ? '#E23B52' : 'none'} stroke={fav ? '#E23B52' : '#8A93B8'} strokeWidth="2"><path d="M12 21C7 16.6 3 13.4 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4.1-4 7.3-9 11.7z" /></svg>
        </button>
        {p.pcs ? <span className="absolute bottom-3 left-4 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
      </div>
      <div className="px-4 mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[21px] font-extrabold leading-tight flex-1">{pName(p, lang)}</h1>
          <div className="text-[20px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[#8A93B8]"> UZS</span></div>
        </div>
        {p.weight ? (
          <div className="mt-3 flex items-center gap-1.5 bg-white border border-navy-line rounded-xl px-3 py-2.5 w-fit">
            <span className="text-[15px]">⚖️</span>
            <span className="text-[13px] font-bold">{p.weight}</span>
          </div>
        ) : null}
        <p className="mt-3 text-[14px] leading-relaxed text-[#4A5270] font-medium whitespace-pre-line">{pDesc(p, lang)}</p>
      </div>

      {rel.length > 0 && (
        <section className="mt-6">
          <h2 className="px-4 text-[15px] font-extrabold">{t.similar}</h2>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 mt-2.5 pb-1">
            {rel.map(r => (
              <button key={r.id} onClick={() => { haptic(); nav(`/p/${r.id}`); setQ(1) }}
                className="press shrink-0 w-[124px] bg-white border border-navy-line rounded-[16px] overflow-hidden text-left active:scale-95 transition-transform">
                <img src={pImg(r)} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover bg-navy-soft" />
                <div className="p-2">
                  <div className="text-[11.5px] font-bold truncate">{pName(r, lang)}</div>
                  <div className="text-[12px] font-extrabold mt-0.5">{fmt(r.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line px-4 pt-3"
        style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
        <div className="flex gap-2.5 items-center">
          <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
          <button onClick={() => { add(p.id, q); haptic('medium'); showToast(t.added); nav(-1) }}
            className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.checkout} · {fmt(p.price * q)}
          </button>
        </div>
      </div>
    </div>
  )
}
