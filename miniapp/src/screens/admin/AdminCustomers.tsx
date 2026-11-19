import React from 'react'
import { useStore } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, useAdmin } from './common'
import { fmtDT } from '../../lib/admin'
import { API_BASE } from '../../lib/api'

type C = { name: string; phone: string; n: number; revenue: number; cancels: number; last_at: string; first_at: string }
type O = any

const RANGES: { d: number; key: string }[] = [
  { d: 30, key: 'aCustMonth' },
  { d: 90, key: 'aCustQuarter' },
  { d: 365, key: 'aCustYear' },
  { d: 0, key: 'aCustAll' },
]

export default function AdminCustomers() {
  return <Body />
}

function Body() {
  const { t } = useStore()
  const a = useAdmin()
  const [days, setDays] = React.useState(90)
  const [q, setQ] = React.useState('')
  const [rows, setRows] = React.useState<C[] | null>(null)
  const [err, setErr] = React.useState(false)
  const [open, setOpen] = React.useState<string | null>(null)

  const aRef = React.useRef(a); aRef.current = a
  React.useEffect(() => {
    if (!a.ready) return
    const A = aRef.current
    let dead = false
    setRows(null); setErr(false)
    fetch(`${API_BASE}/api/admin?action=customers&days=${days}`, { headers: A.h() })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (dead) return; if (j?.ok) setRows(j.customers || []); else setErr(true) })
      .catch(() => { if (!dead) setErr(true) })
    return () => { dead = true }
  }, [days, a.ready])

  const all = rows || []
  const search = q.trim().toLowerCase()
  const shown = search
    ? all.filter(c => (c.name || '').toLowerCase().includes(search) || String(c.phone || '').toLowerCase().includes(search))
    : all

  const ordersOf = (phone: string): O[] => (a.data?.orders || []).filter((o: O) => String(o.phone) === String(phone))
  const totalRevenue = all.reduce((s, c) => s + c.revenue, 0)
  const repeat = all.filter(c => c.n > 1).length

  return (
    <div className="pb-28 lg:pb-10">
      <AdminTopBar title={t.aCustTitle} />
      <div className="px-4 mt-3">
        <div className="text-[12px] font-medium text-[var(--mut)] leading-snug">{t.aCustHint}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {RANGES.map(r => (
            <button key={r.d} onClick={() => setDays(r.d)}
              className={`press px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold border ${days === r.d ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)] border-transparent' : 'bg-[var(--panel)] text-navy-ink border-navy-line'}`}>
              {r.d === 0 ? t.aCustAll : r.d === 30 ? t.aCustMonth : r.d === 90 ? t.aCustQuarter : t.aCustYear}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <Tile label={t.aCustTitle} value={String(all.length)} />
          <Tile label={t.aCustRepeat} value={String(repeat)} />
          <Tile label={t.aCustRevenue} value={fmt(totalRevenue)} />
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.aCustSearch}
          className="mt-3 w-full bg-[var(--panel)] border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-[var(--btn)]" />
      </div>

      {rows === null && !err && (
        <div className="px-4 mt-6 text-center text-[13px] font-semibold text-[var(--mut3)]">{t.aCustLoading}</div>
      )}
      {err && <div className="px-4 mt-6 text-center text-[13px] font-bold a-bad-text">{t.aCustErr}</div>}
      {rows !== null && shown.length === 0 && (
        <div className="px-4 mt-6 text-center text-[13px] font-semibold text-[var(--mut3)]">{t.aCustEmpty}</div>
      )}

      <div className="px-4 mt-3 space-y-2">
        {shown.map((c, i) => {
          const isOpen = open === c.phone
          const os = ordersOf(c.phone)
          return (
            <div key={c.phone || i} className="bg-[var(--panel)] border border-navy-line rounded-[18px] overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : c.phone)} className="w-full text-left px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-navy-soft text-navy-ink grid place-items-center text-[13px] font-extrabold shrink-0">
                    {(c.name || '?').trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-extrabold truncate">{c.name || c.phone}</div>
                    <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}
                      className="text-[12px] font-semibold text-[var(--mut)] underline-offset-2 hover:underline">{c.phone}</a>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13.5px] font-extrabold">{fmt(c.revenue)}</div>
                    <div className="text-[11px] font-bold text-[var(--mut)]">{c.n} {t.aCustOrdersN}</div>
                  </div>
                </div>
                {!!c.cancels && (
                  <div className="mt-2 text-[11px] font-bold a-bad-text">{t.aCustCancels}: {c.cancels}</div>
                )}
              </button>
              {isOpen && (
                <div className="border-t border-navy-line px-4 py-3 space-y-2">
                  <div className="flex justify-between text-[11.5px] font-bold text-[var(--mut)]">
                    <span>{t.aCustFirst}</span><span>{fmtDT(c.first_at)}</span>
                  </div>
                  <div className="flex justify-between text-[11.5px] font-bold text-[var(--mut)]">
                    <span>{t.aCustLast}</span><span>{fmtDT(c.last_at)}</span>
                  </div>
                  {os.length > 0 ? (
                    <div className="mt-1 space-y-1.5">
                      {os.slice(0, 8).map((o: O) => (
                        <div key={o.id} className="flex items-center gap-2 text-[12.5px]">
                          <span className="font-extrabold text-[var(--mut)] shrink-0">#{o.id}</span>
                          <span className="text-[var(--mut)] shrink-0">{fmtDT(o.created_at)}</span>
                          <span className="flex-1" />
                          <span className="font-extrabold">{fmt(o.total)}</span>
                          <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg ${o.status === 'cancelled' ? 'a-bad' : o.status === 'new' ? 'a-warn' : 'a-ok'}`}>{t['st_' + o.status]}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[12px] font-semibold text-[var(--mut3)]">{t.aCustNoOrders}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--panel)] border border-navy-line rounded-[18px] p-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--mut)] truncate">{label}</div>
      <div className="mt-1 text-[17px] font-extrabold tracking-tight leading-none">{value}</div>
    </div>
  )
}
