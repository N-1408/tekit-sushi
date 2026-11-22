import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pName, pImg, pDesc, isSpicy, type ModPick } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, Qty, IcScale, IcSauce, NutritionPanel, SpicyBadge, IcMinus, IcPlus } from '../components/ui'

export default function Product() {
  const { id } = useParams()
  const { products, lang, t, add, setQty, cart } = useStore()
  const nav = useNavigate()
  const p = products.find(x => x.id === id)
  const [q, setQ] = React.useState(1)
  const [mods, setMods] = React.useState<Record<string, Record<string, number>>>({})
  const pId = p?.id
  React.useEffect(() => {
    const prod = products.find(x => x.id === pId)
    if (!prod) return
    const init: Record<string, Record<string, number>> = {}
    for (const g of (prod.mods || [])) {
      if (g.min > 0) {
        init[g.id] = {}
        for (const o of g.options) if (o.default) init[g.id][o.id] = (init[g.id][o.id] || 0) + 1
        if (!Object.keys(init[g.id]).length && g.options[0]) init[g.id][g.options[0].id] = 1
      }
    }
    setMods(init)
  }, [pId])
  const sauces = products.filter(x => x.cat === 'sous' && x.id !== id && x.active !== false)
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  if (!p) return <div className="pb-28"><TopBar title="…" /></div>
  const modQ = (gid: string, oid: string) => mods[gid]?.[oid] || 0
  const groupQ = (gid: string) => Object.values(mods[gid] || {}).reduce((a: number, b) => a + b, 0)
  const modsPrice = (p.mods || []).reduce((sum, g) => sum + g.options.reduce((s, o) => s + modQ(g.id, o.id) * o.price, 0), 0)
  const missingGroups = (p.mods || []).filter(g => g.min > 0 && groupQ(g.id) < g.min)
  const modsPayload = (): ModPick[] => {
    const out: ModPick[] = []
    for (const g of (p.mods || [])) for (const o of g.options) {
      const qm = modQ(g.id, o.id)
      if (qm > 0) out.push({ group_id: g.id, option_id: o.id, q: qm })
    }
    return out
  }
  const hasKbju = [p.kcal, p.protein, p.fat, p.carbs].some(v => v != null && (v as number) > 0)

  return (
    <div className="pb-32">
      <TopBar title={pName(p, lang)} />
      <div className="lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start lg:px-8 lg:pt-6">
      <div className="relative lg:rounded-[26px] lg:overflow-hidden">
        <img src={pImg(p)} alt={pName(p, lang)} className="w-full aspect-square object-cover bg-navy-soft" />
        {p.pcs ? <span className="absolute bottom-3 left-4 bg-[var(--panel)] border border-navy-line text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm">{p.pcs} {t.pcs}</span> : null}
      </div>
      <div className="px-4 mt-4 lg:px-0 lg:mt-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[21px] font-extrabold leading-tight flex-1">{pName(p, lang)}</h1>
          {isSpicy(p) && <SpicyBadge size={20} className="shrink-0 mt-1" />}
          <div className="text-[20px] font-extrabold tracking-tight whitespace-nowrap">{fmt(p.price)}<span className="text-[12px] text-[var(--mut2)]"> UZS</span></div>
        </div>
        {p.weight ? (
          <div className="mt-3 flex items-center gap-1.5 bg-[var(--panel)] border border-navy-line rounded-xl px-3 py-2.5 w-fit">
            <span className="text-[var(--acc)]"><IcScale /></span>
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

        {(p.mods || []).length > 0 && (
          <div className="mt-4 space-y-3">
            {(p.mods || []).map(g => (
              <div key={g.id} className="bg-navy-soft/60 rounded-3xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13.5px] font-extrabold text-[var(--acc)] leading-tight">{g.title}</div>
                  {g.min > 0 && <span className="text-[10.5px] font-bold text-[var(--mut2)]">majburiy</span>}
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  {g.options.map(o => {
                    const qm = modQ(g.id, o.id)
                    return (
                      <div key={o.id} className={'flex items-center gap-2.5 rounded-2xl bg-[var(--panel)] border py-1 pl-3 pr-1.5 ' + (qm > 0 ? 'border-[var(--chip-on)] shadow-[0_4px_12px_-4px_rgba(0,0,0,.3)]' : 'border-navy-line')}>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-extrabold leading-tight truncate">{o.name}</div>
                          {o.price > 0 && <div className="text-[11px] font-bold text-[var(--mut2)] mt-0.5 leading-none">+{fmt(o.price)} UZS</div>}
                        </div>
                        {qm > 0 ? (
                          <span className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setMods(m => { const g2 = { ...(m[g.id] || {}) }; const nq = (g2[o.id] || 0) - 1; if (nq <= 0) delete g2[o.id]; else g2[o.id] = nq; return { ...m, [g.id]: g2 } })} aria-label="minus"
                              className="press w-8 h-8 rounded-full bg-[var(--soft)] border border-navy-line text-[var(--ink)] grid place-items-center active:scale-90 transition-transform">
                              <IcMinus s={14} />
                            </button>
                            <span className="min-w-[18px] text-center text-[13.5px] font-extrabold tabular-nums">{qm}</span>
                            <button onClick={() => setMods(m => {
                              const cur = m[g.id] || {}
                              if (g.max > 0 && groupQ(g.id) >= g.max && !cur[o.id]) return m
                              return { ...m, [g.id]: { ...cur, [o.id]: (cur[o.id] || 0) + 1 } }
                            })} aria-label="plus"
                              className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform">
                              <IcPlus s={14} />
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setMods(m => {
                            const cur = m[g.id] || {}
                            if (g.max > 0 && groupQ(g.id) >= g.max) return m
                            return { ...m, [g.id]: { ...cur, [o.id]: 1 } }
                          })} aria-label="add"
                            className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform shrink-0">
                            <IcPlus s={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {p.cat !== 'sous' && sauces.length > 0 && (
          <div className="mt-4 bg-navy-soft/60 rounded-3xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[var(--panel)] border border-navy-line grid place-items-center text-[var(--acc)] shrink-0"><IcSauce /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-extrabold text-[var(--acc)] leading-tight">{t.sAsk}</div>
                <div className="text-[10.5px] font-semibold text-[var(--mut2)] leading-tight mt-0.5">{t.sSub}</div>
              </div>
            </div>
            {/* Har bir sous alohida qator: sonli tugma (− son +); barcha souslar ko'rinadi */}
            <div className="mt-3 flex flex-col gap-1">
              {sauces.map(s => {
                const sq = qtyOf(s.id)
                return (
                  <div key={s.id} className={'flex items-center gap-2.5 rounded-2xl bg-[var(--panel)] border py-1 pl-1.5 pr-1.5 ' + (sq > 0 ? 'border-[var(--chip-on)] shadow-[0_4px_12px_-4px_rgba(0,0,0,.3)]' : 'border-navy-line')}>
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
                          className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform">
                          <IcPlus s={14} />
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => { add(s.id, 1); haptic('light') }} aria-label="add"
                        className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform shrink-0">
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
                {fmt((p.price + modsPrice) * q)}<span className="text-[11px] text-[var(--mut2)] font-bold"> UZS</span>
              </div>
            </div>
          </div>
          {missingGroups.length > 0 && (
            <div className="text-[11.5px] font-bold text-amber-600 text-center mb-1">Majburiy variantlarni tanlang: {missingGroups.map(g => g.title).join(', ')}</div>
          )}
          <button onClick={() => { if (missingGroups.length) return; add(p.id, q, modsPayload()); haptic('medium'); nav(-1) }}
            className={'press w-full py-3.5 rounded-2xl text-[15px] font-extrabold flex items-center justify-center active:scale-[.98] transition-transform ' + (missingGroups.length ? 'bg-[var(--soft)] text-[var(--mut2)] border border-navy-line' : 'bg-[var(--btn)] text-[var(--btn-ink)]')}>
            {t.addCart}
          </button>
        </div>
      </div>
    </div>
  )
}
