import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pName, pImg, pDesc, isSpicy } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, Qty, IcScale, IcSauce, NutritionPanel, SpicyBadge, IcMinus, IcPlus, IcX } from '../components/ui'

export default function Product() {
  const { id } = useParams()
  const { products, lang, t, add, setQty, cart } = useStore()
  const nav = useNavigate()
  const p = products.find(x => x.id === id)
  const [q, setQ] = React.useState(1)
  const sauces = products.filter(x => x.cat === 'sous' && x.id !== id && x.active !== false)
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  if (!p) return <div className="pb-28"><TopBar title="…" /></div>
  const hasKbju = [p.kcal, p.protein, p.fat, p.carbs].some(v => v != null && (v as number) > 0)

  return (
    <div className="pb-32">
      <TopBar title={pName(p, lang)} />
      <div className="lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-8 lg:pt-6">
      <div className="relative lg:rounded-[26px] lg:overflow-hidden">
        <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover bg-navy-soft" />
        {p.pcs ? <span className="absolute bottom-3 left-4 bg-white/95 text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
      </div>
      <div className="px-4 mt-4 lg:px-0 lg:mt-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[21px] font-extrabold leading-tight flex-1">{pName(p, lang)}</h1>
          {isSpicy(p) && <SpicyBadge size={20} className="shrink-0 mt-1" />}
          <div className="text-[20px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[var(--mut2)]"> UZS</span></div>
        </div>
        {p.weight ? (
          <div className="mt-3 flex items-center gap-1.5 bg-[var(--panel)] border border-navy-line rounded-xl px-3 py-2.5 w-fit">
            <span className="text-[#29A8E0]"><IcScale /></span>
            <span className="text-[13px] font-bold">{p.weight}</span>
          </div>
        ) : null}
        {hasKbju && (
          <NutritionPanel
            className="mt-3 bg-[var(--panel)] border border-navy-line rounded-2xl px-3.5 py-3"
            items={([[t.nKcal, p.kcal, ''], [t.nProt, p.protein, 'g'], [t.nFat, p.fat, 'g'], [t.nCarb, p.carbs, 'g']] as const)
              .filter(([, v]) => v != null && (v as number) > 0)}
            per100={t.per100}
          />
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
            {/* Har bir sous alohida qator: sonli tugma (− son +) va o'chirish */}
            <div className="mt-3 flex flex-col gap-1.5">
              {sauces.map(s => {
                const sq = qtyOf(s.id)
                return (
                  <div key={s.id} className={'flex items-center gap-2.5 rounded-2xl bg-[var(--panel)] border py-1.5 pl-1.5 pr-1.5 ' + (sq > 0 ? 'border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.35)]' : 'border-navy-line')}>
                    <img src={pImg(s)} alt={pName(s, lang)} loading="lazy" className="w-10 h-10 rounded-full object-cover bg-navy-soft shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-extrabold leading-tight truncate">{pName(s, lang)}</div>
                      <div className="text-[11px] font-bold text-[var(--mut2)] mt-0.5 leading-none">{fmt(s.price)} <span className="text-[9.5px]">UZS</span></div>
                    </div>
                    {sq > 0 ? (
                      <span className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setQty(s.id, sq - 1); haptic() }} aria-label="minus"
                          className="press w-8 h-8 rounded-full bg-[var(--soft)] border border-navy-line text-[var(--ink)] grid place-items-center active:scale-90 transition-transform">
                          <IcMinus s={14} />
                        </button>
                        <span className="min-w-[18px] text-center text-[13.5px] font-extrabold tabular-nums">{sq}</span>
                        <button onClick={() => { setQty(s.id, sq + 1); haptic() }} aria-label="plus"
                          className="press w-8 h-8 rounded-full bg-navy text-white grid place-items-center shadow-[0_4px_10px_-3px_rgba(10,33,148,.5)] active:scale-90 transition-transform">
                          <IcPlus s={14} />
                        </button>
                        <button onClick={() => { setQty(s.id, 0); haptic() }} aria-label="remove"
                          className="press w-8 h-8 rounded-full bg-[var(--soft)] border border-navy-line text-[var(--mut2)] grid place-items-center active:scale-90 transition-transform">
                          <IcX s={13} />
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => { add(s.id, 1); haptic('light') }} aria-label="add"
                        className="press w-8 h-8 rounded-full bg-navy text-white grid place-items-center shadow-[0_4px_10px_-3px_rgba(10,33,148,.5)] active:scale-90 transition-transform shrink-0">
                        <IcPlus s={14} />
                      </button>
                    )}
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
        <div className="lg:max-w-[1240px] lg:mx-auto">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <Qty q={q} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
            <div className="text-right min-w-0">
              <div className="text-[17px] font-extrabold tracking-tight whitespace-nowrap tabular-nums leading-tight">
                {fmt(p.price * q)}<span className="text-[11px] text-[var(--mut2)] font-bold"> UZS</span>
              </div>
            </div>
          </div>
          <button onClick={() => { add(p.id, q); haptic('medium'); nav(-1) }}
            className="press w-full py-3.5 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[15px] font-extrabold flex items-center justify-center active:scale-[.98] transition-transform">
            {t.addCart}
          </button>
        </div>
      </div>
    </div>
  )
}
