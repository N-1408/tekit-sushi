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

  return (
    <div className="pb-32">
      <TopBar title={pName(p, lang)} />
      <div className="lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-8 lg:pt-6">
      <div className="relative lg:rounded-[26px] lg:overflow-hidden">
        <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover bg-navy-soft" />
        <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-3 right-4 w-10 h-10 rounded-full bg-white grid place-items-center shadow-md active:scale-90 transition-transform">
          <svg width="19" height="19" viewBox="0 0 24 24" fill={fav ? '#E23B52' : 'none'} stroke={fav ? '#E23B52' : '#8A93B8'} strokeWidth="2"><path d="M12 21C7 16.6 3 13.4 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4.1-4 7.3-9 11.7z" /></svg>
        </button>
        {p.pcs ? <span className="absolute bottom-3 left-4 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
      </div>
      <div className="px-4 mt-4 lg:px-0 lg:mt-0">
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

      </div>
      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line px-4 pt-3 lg:left-[220px]"
        style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
        <div className="flex gap-2.5 items-center lg:max-w-[1240px] lg:mx-auto">
          <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
          <button onClick={() => { add(p.id, q); haptic('medium'); showToast(t.added); nav(-1) }}
            className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.addCart} · {fmt(p.price * q)}
          </button>
        </div>
      </div>
    </div>
  )
}
