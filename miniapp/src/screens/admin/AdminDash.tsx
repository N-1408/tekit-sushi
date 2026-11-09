import React from 'react'
import { useStore } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, StatTile } from './common'
import { AdminGate, useAdmin } from './common'
import type { AdminStat } from '../../lib/admin'

export default function AdminDash() {
  return <Body />
}

function Body() {
  const { t, lang } = useStore()
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

  const st: AdminStat | null = range === 7 ? (a.data?.stats || null) : local

  React.useEffect(() => {
    if (range !== 7 || !a.ready) return
    const aRef = a
    let live = true
    const tick = () => fetch('/api/admin?action=stats&days=7', { headers: aRef.h() })
      .then(r => r.ok ? r.json() : null).then(j => { if (live && j?.ok) a.update({ stats: j }) }).catch(() => {})
    const iv = setInterval(tick, 20000)
    return () => { live = false; clearInterval(iv) }
  }, [range, a.ready])

  const byS: Record<string, number> = {}
  for (const r of st?.byStatus || []) byS[r.status] = r.n
  const days = st?.days || []
  const maxN = Math.max(1, ...days.map(d => d.n))
  const bars = days.slice(-14)
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
        <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-[96px] rounded-[20px] bg-white border border-navy-line animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
            <StatTile accent label={t.aRevenue} value={`${fmt(st.today.revenue)} UZS`} sub={t.aToday} />
            <StatTile label={t.aOrdersN} value={String(st.today.orders)} sub={t.aToday} />
            <StatTile label={t.aPendingA} value={String(st.pending)} accent={st.pending > 0} />
            <StatTile label={t.aMenuM} value={String(st.menuCount)} sub={t.aMenuItemsN} />
          </div>

          <div className="px-4 mt-4">
            <div className="bg-white border border-navy-line rounded-[20px] p-4">
              <div className="text-[13.5px] font-extrabold">{t.aLast7}</div>
              <div className="mt-3 flex items-end gap-[5px] h-[110px]">
                {bars.length === 0 && <div className="text-[12.5px] font-semibold text-[#8A93B8]">—</div>}
                {bars.map((d, i) => (
                  <div key={d.d} className="flex-1 flex flex-col items-center gap-1" title={`${d.d}: ${d.n}`}>
                    <div className="w-full rounded-t-md bg-navy/90 transition-all" style={{ height: `${Math.max(4, (d.n / maxN) * 86)}px`, opacity: 0.55 + 0.45 * (d.n / maxN) }} />
                    <div className="text-[8.5px] font-bold text-[#8A93B8] leading-none">{d.d.slice(8)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 mt-3 grid grid-cols-5 gap-1.5">
            {['new', 'confirmed', 'delivering', 'done', 'cancelled'].map(s => (
              <div key={s} className="bg-white border border-navy-line rounded-xl py-2.5 text-center">
                <div className="text-[15px] font-extrabold leading-none">{byS[s] || 0}</div>
                <div className="mt-1 text-[9px] font-bold text-[#8A93B8] leading-none">{(t as any)['st_' + s]}</div>
              </div>
            ))}
          </div>

          {(st?.topItems || []).length > 0 && (
            <div className="px-4 mt-3">
              <div className="bg-white border border-navy-line rounded-[20px] p-4">
                <div className="text-[13.5px] font-extrabold">{t.aTopItems}</div>
                <div className="mt-2.5 space-y-2.5">
                  {(st?.topItems || []).map((it: any, i: number) => (
                    <div key={it.id || i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg grid place-items-center text-[11px] font-extrabold ${i === 0 ? 'bg-navy text-white' : 'bg-navy-soft text-navy-ink'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0 text-[13px] font-bold truncate">{it.title || '—'}</div>
                      <div className="text-[12.5px] font-extrabold whitespace-nowrap">{it.qty} ×</div>
                      <div className="text-[12px] font-bold text-[#8A93B8] whitespace-nowrap">{fmt(it.revenue)} UZS</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
