import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pName, pImg, pDesc } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import {  TopBar, Qty, IcScale, IcSauce , IcHeart } from '../components/ui'

export default function Product() {
  const { id } = useParams()
  const { products, lang, t, add, setQty, cart, favs, toggleFav } = useStore()
  const nav = useNavigate()
  const p = products.find(x => x.id === id)
  const [q, setQ] = React.useState(1)
  const sauces = products.filter(x => x.cat === 'sous' && x.id !== id && x.active !== false)
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  if (!p) return <div className="pb-28"><TopBar title="…" /></div>
  const fav = favs.includes(p.id)
  const hasKbju = [p.kcal, p.protein, p.fat, p.carbs].some(v => v != null && (v as number) > 0)

  return (
    <div className="pb-32">
      <TopBar title={pName(p, lang)} />
      <div className="lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-8 lg:pt-6">
      <div className="relative lg:rounded-[26px] lg:overflow-hidden">
        <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover bg-navy-soft" />
        <button onClick={() => { toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-3 right-4 w-10 h-10 rounded-full bg-[var(--bg2)]/80 grid place-items-center active:scale-90 transition-transform">
          <IcHeart s={19} on={fav} />
        </button>
        {p.pcs ? <span className="absolute bottom-3 left-4 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
      </div>
      <div className="px-4 mt-4 lg:px-0 lg:mt-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[21px] font-extrabold leading-tight flex-1">{pName(p, lang)}</h1>
          <div className="text-[20px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[var(--mut2)]"> UZS</span></div>
        </div>
        {p.weight ? (
          <div className="mt-3 flex items-center gap-1.5 bg-[var(--panel)] border border-navy-line rounded-xl px-3 py-2.5 w-fit">
            <span className="text-[#29A8E0]"><IcScale /></span>
            <span className="text-[13px] font-bold">{p.weight}</span>
          </div>
        ) : null}
        {hasKbju && (
          <div className="mt-3 bg-[var(--panel)] border border-navy-line rounded-2xl px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-extrabold text-[var(--mut2)] uppercase tracking-widest">КБЖУ</span>
              <span className="text-[10.5px] font-bold text-[var(--mut2)]">{t.per100}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {([
                [t.nKcal, p.kcal],
                [t.nProt, p.protein],
                [t.nFat, p.fat],
                [t.nCarb, p.carbs],
              ] as const).map(([label, val]) => (
                <div key={label} className="bg-navy-soft/70 rounded-xl py-2 text-center">
                  <div className="text-[15px] font-extrabold text-[#29A8E0] leading-none">{val != null ? val : '—'}</div>
                  <div className="mt-1 text-[9.5px] font-bold text-[var(--mut2)] leading-none">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--mut2)] font-medium whitespace-pre-line">{pDesc(p, lang)}</p>

        {p.cat !== 'sous' && sauces.length > 0 && (
          <div className="mt-4 bg-navy-soft/60 rounded-3xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-white grid place-items-center text-[#29A8E0] shrink-0 shadow-sm"><IcSauce /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-[#29A8E0] leading-tight">{t.sAsk}</div>
                <div className="text-[10.5px] font-semibold text-[var(--mut2)] leading-tight mt-0.5">{t.sSub}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-3.5 px-3.5 snap-x lg:mx-0 lg:px-0 lg:flex-wrap">
              {sauces.map(s => {
                const sq = qtyOf(s.id)
                return (
                  <div key={s.id} className={'shrink-0 snap-start flex items-center gap-2 rounded-full bg-[var(--panel)] border pl-1.5 pr-2 py-1.5 ' + (sq > 0 ? 'border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.35)]' : 'border-navy-line')}>
                    <img src={pImg(s)} alt={pName(s, lang)} loading="lazy" className="w-9 h-9 rounded-full object-cover bg-navy-soft" />
                    <div className="pr-0.5">
                      <div className="text-[11.5px] font-extrabold leading-none whitespace-nowrap">{pName(s, lang)}</div>
                      <div className="text-[10px] font-bold text-[var(--mut2)] mt-1 leading-none">{fmt(s.price)}</div>
                    </div>
                    {sq > 0 && (
                      <div className="flex items-center gap-1 ml-0.5">
                        <button onClick={() => { setQty(s.id, sq - 1); haptic() }}
                          className="press w-6 h-6 rounded-full bg-[var(--panel)] border border-navy-line text-[#29A8E0] text-[12px] font-extrabold grid place-items-center active:scale-90 transition-transform">−</button>
                        <span className="w-3.5 text-center text-[11.5px] font-extrabold">{sq}</span>
                      </div>
                    )}
                    <button onClick={() => { if (sq > 0) { setQty(s.id, sq + 1); haptic() } else { add(s.id, 1); haptic('light') } }}
                      className="press w-7 h-7 rounded-full bg-navy text-white text-[15px] font-extrabold grid place-items-center shadow-[0_4px_10px_-3px_rgba(10,33,148,.5)] active:scale-90 transition-transform">+</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      </div>
      <div className="fixed left-0 right-0 bottom-0 z-40 bg-[var(--bg)] border-t border-[var(--line)] px-4 pt-3 lg:left-[220px]"
        style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
        <div className="flex gap-2.5 items-center lg:max-w-[1240px] lg:mx-auto">
          <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
          <button onClick={() => { add(p.id, q); haptic('medium'); nav(-1) }}
            className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.addCart} · {fmt(p.price * q)}
          </button>
        </div>
      </div>
    </div>
  )
}
