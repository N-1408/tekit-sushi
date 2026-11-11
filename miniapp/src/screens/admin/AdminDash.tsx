import React from 'react'
import { useStore } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, AdminGate, useAdmin } from './common'
import type { AdminStat } from '../../lib/admin'

export default function AdminDash() {
  return <Body />
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const p = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0
  if (cur === 0 && prev === 0) return null
  const up = p >= 0
  return (
    <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
      {up ? '↑' : '↓'} {Math.abs(p)}%
    </span>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-3">
      <div className="bg-white border border-navy-line rounded-[20px] p-4">
        <div className="text-[13.5px] font-extrabold">{title}</div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}

function Body() {
  const { t } = useStore()
  const a = useAdmin()
  const [local, setLocal] = React.useState<AdminStat | null>(null)
  const [range, setRange] = React.useState<1 | 7 | 30>(7)
  const [err, setErr] = React.useState('')

  React.useEffect(() => {
    if (range === 7) { setLocal(null); setErr(''); return }
    if (!a.ready) return
    let dead = false
    setLocal(null)
    fetch(`/api/admin?action=stats&days=${range}`, { headers: a.h() })
      .then(r => r.ok ? r.json() : null).then(j => {
        if (dead) return
        if (j?.ok) setLocal(j); else setErr('x')
      }).catch(() => { if (!dead) setErr('x') })
    return () => { dead = true }
  }, [range, a.ready])

  React.useEffect(() => {
    if (range !== 7 || !a.ready) return
    const A = a
    let live = true
    const tick = () => fetch('/api/admin?action=stats&days=7', { headers: A.h() })
      .then(r => r.ok ? r.json() : null).then(j => { if (live && j?.ok) A.update({ stats: j }) }).catch(() => {})
    const iv = setInterval(tick, 20000)
    return () => { live = false; clearInterval(iv) }
  }, [range, a.ready])

  const st: AdminStat | null = range === 7 ? (a.data?.stats || null) : local
  const period = st?.period || { orders: 0, revenue: 0, nonCancelled: 0, prevOrders: 0, prevNonCancelled: 0, prevRevenue: 0 }
  const aov = period.nonCancelled > 0 ? Math.round(period.revenue / period.nonCancelled) : 0
  const aovPrev = period.prevNonCancelled > 0 ? period.prevRevenue / period.prevNonCancelled : 0

  const days = st?.days || []
  const maxN = Math.max(1, ...days.map(d => d.n))
  const bars = days.slice(-14)

  const hoursMap = Array(24).fill(0) as number[]
  for (const r of st?.hours || []) hoursMap[r.h] = r.n
  const maxH = Math.max(1, ...hoursMap)
  const peakH = hoursMap.indexOf(maxH)

  const dowsMap = Array(7).fill(0) as number[]
  for (const r of st?.dows || []) dowsMap[r.dow] = r.n
  const maxDow = Math.max(1, ...dowsMap)

  const top = st?.topItems || []
  const maxTop = Math.max(1, ...top.map(x => x.revenue || 0))
  const totalQty = top.reduce((m, x) => m + x.qty, 0)

  const dlv = st?.delivery || []
  const dlvTotal = Math.max(1, dlv.reduce((m, x) => m + x.n, 0))
  const pay = st?.payment || []
  const payTotal = Math.max(1, pay.reduce((m, x) => m + x.n, 0))
  const splitRows = [
    ...dlv.map(x => ({ label: x.k === 'pickup' ? t.pickup : t.deliveryMode, n: x.n, total: dlvTotal })),
    ...pay.map(x => ({ label: x.k === 'transfer' || x.k === 'card' ? t.cardTransfer : t.cash, n: x.n, total: payTotal })),
  ]

  const canc = st?.cancels || { n: 0, revenue: 0, reasons: [] as any[] }
  const custs = st?.customers || []
  const promos = st?.promos || []
  const labels: Record<number, string> = { 1: t.aToday, 7: t.aThisWeek, 30: t.aThisMonth }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aTabD} />
      <div className="px-4 mt-4 flex gap-2">
        {([1, 7, 30] as const).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`press px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all ${range === r ? 'bg-navy text-white shadow-[0_6px_14px_-6px_rgba(10,33,148,.5)]' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
            {labels[r]}
          </button>
        ))}
      </div>

      {err ? <div className="px-4 mt-6 text-center text-[13.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : !st ? (
        <div className="px-4 mt-4 space-y-2.5">
          <div className="h-[96px] rounded-[20px] bg-white border border-navy-line animate-pulse" />
          <div className="grid grid-cols-2 gap-2.5">{[0, 1, 2, 3].map(i => <div key={i} className="h-[96px] rounded-[20px] bg-white border border-navy-line animate-pulse" />)}</div>
        </div>
      ) : (
        <>
          <div className="px-4 mt-4">
            <div className="bg-navy text-white rounded-[20px] p-4 shadow-[0_10px_24px_-10px_rgba(10,33,148,.55)]">
              <div className="flex items-center gap-2">
                <div className="text-[12px] font-bold text-white/70">{t.aRevenue} · {labels[range]}</div>
                <span className="text-[10px] bg-white/15 rounded-md px-1.5 py-0.5 font-extrabold">
                  {period.prevRevenue > 0 ? `${period.revenue >= period.prevRevenue ? '↑' : '↓'} ${Math.abs(Math.round(((period.revenue - period.prevRevenue) / period.prevRevenue) * 100))}%` : ''}
                </span>
              </div>
              <div className="mt-1 text-[26px] font-extrabold tracking-tight">{fmt(period.revenue)} <span className="text-[13px] font-bold text-white/70">UZS</span></div>
              <div className="mt-2.5 text-[11.5px] font-semibold text-white/80">{period.orders} {t.aOrdersN}</div>
            </div>
          </div>

          <div className="px-4 mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="bg-white border border-navy-line rounded-[20px] p-3.5">
              <div className="text-[11.5px] font-bold text-[#8A93B8]">{t.aOrdCount}</div>
              <div className="mt-1 flex items-end gap-1.5">
                <div className="text-[22px] font-extrabold leading-none">{period.orders}</div>
                <Delta cur={period.orders} prev={period.prevOrders} />
              </div>
            </div>
            <div className="bg-white border border-navy-line rounded-[20px] p-3.5">
              <div className="text-[11.5px] font-bold text-[#8A93B8]">{t.aAvgCheck}</div>
              <div className="mt-1 flex items-end gap-1.5">
                <div className="text-[22px] font-extrabold leading-none">{aov > 0 ? fmt(aov) : '—'}</div>
                <Delta cur={aov} prev={aovPrev} />
              </div>
              <div className="mt-1 text-[10px] font-semibold text-[#A2A9C6]">{t.aVsPrev}</div>
            </div>
            <div className="bg-white border border-navy-line rounded-[20px] p-3.5">
              <div className="text-[11.5px] font-bold text-[#8A93B8]">{t.aPendingA}</div>
              <div className="mt-1 text-[22px] font-extrabold leading-none">{st.pending}</div>
            </div>
            <div className="bg-white border border-navy-line rounded-[20px] p-3.5">
              <div className="text-[11.5px] font-bold text-[#8A93B8]">{t.aCancels}</div>
              <div className="mt-1 text-[22px] font-extrabold leading-none">{canc.n}</div>
              <div className="mt-1 text-[10px] font-semibold text-[#A2A9C6]">{period.orders > 0 ? Math.round((canc.n / period.orders) * 100) : 0}% {t.aCancelOf}</div>
            </div>
          </div>

          <Card title={`${range} ${t.aDynKun}`}>
            <div className="flex items-end gap-[5px] h-[110px]">
              {bars.length === 0 && <div className="text-[12.5px] font-semibold text-[#8A93B8]">—</div>}
              {bars.map((d, i) => (
                <div key={d.d} className="flex-1 flex flex-col items-center gap-1" title={`${d.d}: ${d.n}`}>
                  <div className="w-full rounded-t-md bg-navy/90 transition-all" style={{ height: `${Math.max(4, (d.n / maxN) * 86)}px`, opacity: 0.55 + 0.45 * (d.n / maxN) }} />
                  <div className="text-[8.5px] font-bold text-[#8A93B8] leading-none">{d.d.slice(8, 10)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t.aByHour}>
            <div className="flex items-end gap-[3px] h-[92px]">
              {hoursMap.map((n, h) => (
                <div key={h} className="flex-1 flex flex-col items-center gap-1" title={`${h}:00 — ${n}`}>
                  <div className={`w-full rounded-t-md transition-all ${h === peakH ? 'bg-navy' : 'bg-navy/45'}`} style={{ height: `${Math.max(3, (n / maxH) * 70)}px` }} />
                  <div className="text-[7.5px] font-bold text-[#8A93B8] leading-none">{h % 3 === 0 ? h : ''}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-[#8A93B8]">{maxH > 0 ? `Peak: ${String(peakH).padStart(2, '0')}:00` : ''}</div>
          </Card>

          <Card title={t.aByDow}>
            <div className="flex items-end gap-[6px] h-[92px]">
              {dowsMap.map((n, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${(t as any)['dow' + i]}: ${n}`}>
                  <div className={`w-full rounded-t-md transition-all ${n === maxDow && n > 0 ? 'bg-navy' : 'bg-navy/45'}`} style={{ height: `${Math.max(3, (n / maxDow) * 70)}px` }} />
                  <div className="text-[8.5px] font-bold text-[#8A93B8] leading-none">{(t as any)['dow' + i]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t.aTopItems}>
            {top.length === 0 ? <div className="text-[12.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
              <div className="space-y-2.5">
                {top.map((it, i) => (
                  <div key={it.id || i}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg grid place-items-center text-[11px] font-extrabold shrink-0 ${i === 0 ? 'bg-navy text-white' : 'bg-navy-soft text-navy-ink'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0 text-[13px] font-bold truncate">{it.title || '—'}</div>
                      <div className="text-[12.5px] font-extrabold whitespace-nowrap">{it.qty}×</div>
                      <div className="text-[12px] font-bold text-[#8A93B8] whitespace-nowrap">{fmt(it.revenue)}</div>
                    </div>
                    <div className="mt-1 ml-[34px] h-1.5 rounded-full bg-navy-soft overflow-hidden">
                      <div className="h-full rounded-full bg-navy/70" style={{ width: `${Math.max(4, (it.revenue / maxTop) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t.aSplits}>
            <div className="space-y-2.5">
              {splitRows.map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-[12.5px] font-bold">
                    <span>{r.label}</span>
                    <span className="text-[#8A93B8]">{r.n} · {Math.round((r.n / r.total) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-navy-soft overflow-hidden">
                    <div className="h-full rounded-full bg-navy/70" style={{ width: `${Math.max(3, (r.n / r.total) * 100)}%` }} />
                  </div>
                </div>
              ))}
              {splitRows.length === 0 && <div className="text-[12.5px] font-semibold text-[#8A93B8]">—</div>}
            </div>
          </Card>

          <Card title={`${t.aCancels} · ${t.aReasons}`}>
            {canc.n === 0 ? <div className="text-[12.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
              <div className="space-y-2">
                {canc.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12.5px] font-semibold">
                    <span className="w-6 h-6 rounded-lg bg-navy-soft text-navy-ink grid place-items-center text-[11px] font-extrabold shrink-0">{r.n}</span>
                    <span className="flex-1 truncate">{r.reason === '-' ? t.aNoReason : r.reason}</span>
                  </div>
                ))}
                {canc.revenue > 0 && <div className="pt-1 text-[11.5px] font-bold text-[#8A93B8]">{fmt(canc.revenue)} UZS · {t.aCancels}</div>}
              </div>
            )}
          </Card>

          <Card title={t.aCustomers}>
            {custs.length === 0 ? <div className="text-[12.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
              <div className="space-y-2.5">
                {custs.map((c, i) => (
                  <div key={c.phone || i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-navy-soft text-navy-ink grid place-items-center text-[11px] font-extrabold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{c.name || '—'}</div>
                      <div className="text-[10.5px] font-semibold text-[#8A93B8]">{c.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12.5px] font-extrabold">{c.n}×</div>
                      <div className="text-[10.5px] font-bold text-[#8A93B8]">{fmt(c.revenue)} UZS</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t.aPromoStats}>
            {promos.length === 0 ? <div className="text-[12.5px] font-semibold text-[#8A93B8]">— {t.noResults} —</div> : (
              <div className="space-y-2.5">
                {promos.map((p, i) => (
                  <div key={p.code || i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-navy-soft text-navy-ink grid place-items-center text-[11px] font-extrabold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0 text-[13px] font-extrabold truncate">{p.code}</div>
                    <div className="text-[12.5px] font-bold text-[#8A93B8]">{p.n} {t.aTimes}</div>
                    <div className="text-[12px] font-extrabold">−{fmt(p.discount)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
