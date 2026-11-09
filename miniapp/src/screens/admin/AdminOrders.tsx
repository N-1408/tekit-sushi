import React from 'react'
import { useStore } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, Btn, Modal, useAdmin } from './common'
import { fmtDT, beepNewOrder } from '../../lib/admin'
import { haptic } from '../../lib/tg'

const STATUSES = ['new', 'confirmed', 'delivering', 'done', 'cancelled'] as const
const ST_CLS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
}
// mantiqiy oqim: new → confirmed → delivering → done; bekor qilish: new/confirmed/delivering dan
const NEXT: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['delivering', 'cancelled'],
  delivering: ['done', 'cancelled'],
  done: [], cancelled: [],
}

type O = any

export default function AdminOrders() {
  return <Body />
}

function Body() {
  const { t, showToast } = useStore()
  const a = useAdmin()
  const [orders, setOrders] = React.useState<O[]>([])
  const [err, setErr] = React.useState('')
  const [filter, setFilter] = React.useState<string>('new')
  const [q, setQ] = React.useState('')
  const [dateF, setDateF] = React.useState<'all' | 'today'>('all')
  const [busy, setBusy] = React.useState(false)
  const [cancelO, setCancelO] = React.useState<O | null>(null)
  const [cancelNote, setCancelNote] = React.useState('')
  const [openId, setOpenId] = React.useState<number | null>(null)
  const maxIdRef = React.useRef(0)
  const firstRef = React.useRef(true)

  const parseItems = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw
    try { const v = JSON.parse(String(raw || '[]')); return Array.isArray(v) ? v : [] } catch { return [] }
  }

  const load = React.useCallback(async () => {
    if (!a.ready) return
    const myMax = maxIdRef.current
    try {
      const r = await fetch('/api/admin?action=orders', { headers: a.h() })
      if (r.status === 401) { setErr('auth'); return }
      const j = await r.json()
      if (!j?.ok) { setErr('x'); return }
      const list: O[] = j.orders || []
      setErr('')
      const top = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0)
      setOrders(list)
      if (top > myMax) {
        if (!firstRef.current) {
          beepNewOrder()
          try { haptic('heavy'); navigator.vibrate?.([80, 60, 80]) } catch {}
          showToast(t.aNewOrderA)
        }
        maxIdRef.current = top
        firstRef.current = false
      }
    } catch { setErr('x') }
  }, [])

  React.useEffect(() => {
    if (!a.ready) return
    load()
    const iv = setInterval(load, 10000)
    return () => clearInterval(iv)
  }, [load, a.ready])

  async function setStatus(id: number, status: string, note?: string) {
    setBusy(true)
    try {
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify({ action: 'status', id, status, note }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) {
        setOrders(os => os.map(o => o.id === id ? { ...o, status, status_note: note || o.status_note, status_at: new Date().toISOString() } : o))
        haptic('success')
      } else {
        showToast(j?.error || t.orderFail); haptic('error')
      }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tashkent' }).format(new Date())
  const tzDay = (d: string) => { try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tashkent' }).format(new Date(d)) } catch { return '' } }
  const counts: Record<string, number> = { all: orders.length }
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1

  let shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  if (dateF === 'today') shown = shown.filter(o => tzDay(o.created_at) === todayStr)
  if (q.trim()) {
    const s = q.trim().toLowerCase()
    shown = shown.filter(o =>
      String(o.id).includes(s) || String(o.phone || '').toLowerCase().includes(s) || String(o.name || '').toLowerCase().includes(s))
  }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aTabO} />
      <div className="px-4 mt-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.aSearchO}
          className="w-full bg-white border border-navy-line rounded-2xl py-2.5 px-4 text-[13.5px] font-medium outline-none focus:border-navy placeholder:text-[#A2A9C6]" />
      </div>
      <div className="flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar">
        <button onClick={() => setFilter('all')}
          className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${filter === 'all' ? 'bg-navy text-white' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
          {t.all} {counts.all || 0}
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${filter === s ? 'bg-navy text-white shadow-[0_6px_14px_-6px_rgba(10,33,148,.5)]' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
            {(t as any)['st_' + s]} {counts[s] || 0}
          </button>
        ))}
        <button onClick={() => setDateF(d => d === 'all' ? 'today' : 'all')}
          className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${dateF === 'today' ? 'bg-navy text-white' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
          {t.aToday}
        </button>
      </div>

      {err === 'auth' ? <div className="px-4 mt-8 text-center text-[13.5px] font-bold text-red-500">{t.wrongPass}</div> :
        shown.length === 0 ? (
          <div className="px-4 mt-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.aNoOrdersA} —</div>
        ) : (
          <div className="px-4 mt-3 space-y-2.5">
            {shown.map(o => {
              const items = parseItems(o.items)
              const open = openId === o.id
              const nx = NEXT[o.status] || []
              return (
                <article key={o.id} className={`anim-up bg-white border rounded-[20px] overflow-hidden transition-colors ${o.status === 'new' ? 'border-amber-300 shadow-[0_8px_20px_-10px_rgba(180,120,0,.25)]' : 'border-navy-line'}`}>
                  <button onClick={() => { setOpenId(open ? null : o.id); haptic() }} className="w-full text-left px-4 pt-3.5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-extrabold">#{o.id}</span>
                      <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg ${ST_CLS[o.status] || 'bg-navy-soft text-navy-ink'}`}>{(t as any)['st_' + o.status]}</span>
                      <span className="flex-1" />
                      <span className="text-[11px] font-semibold text-[#8A93B8]">{fmtDT(o.created_at)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A93B8" strokeWidth="2.4" strokeLinecap="round" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[13px] font-bold">
                      <span className="truncate">{o.name}</span>
                      <span className="text-[#8A93B8] font-medium">·</span>
                      <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()} className="text-navy underline decoration-navy/30 underline-offset-2 whitespace-nowrap">{o.phone}</a>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[15px] font-extrabold tracking-tight">{fmt(o.total)} UZS</span>
                      <span className="text-[11px] font-semibold text-[#8A93B8]">
                        {o.delivery_type === 'pickup' ? t.pickup : t.deliveryMode} · {o.payment === 'transfer' || o.payment === 'card' ? t.cardTransfer : t.cash}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-navy-line/70 pt-3">
                      <div className="space-y-1.5">
                        {items.map((it: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[12.5px]">
                            <span className="w-6 h-6 rounded-lg bg-navy-soft text-navy-ink grid place-items-center text-[11px] font-extrabold">{it.q}</span>
                            <span className="flex-1 font-semibold truncate">{it.title}</span>
                            <span className="font-bold">{fmt((Number(it.price) || 0) * (Number(it.q) || 1))}</span>
                          </div>
                        ))}
                      </div>
                      {(o.address || o.note || o.delivery_time || o.promo_code || o.discount) && (
                        <div className="mt-3 space-y-1.5 text-[12.5px] font-medium text-[#4A5270]">
                          {o.address && <div className="flex gap-1.5"><span>📍</span><span>{o.address}</span></div>}
                          {o.delivery_time && <div className="flex gap-1.5"><span>🕒</span><span>{o.delivery_time}</span></div>}
                          {o.note && <div className="flex gap-1.5"><span>💬</span><span>{o.note}</span></div>}
                          {o.promo_code && <div className="flex gap-1.5"><span>🎁</span><span>{o.promo_code} · −{fmt(o.discount || 0)} UZS</span></div>}
                        </div>
                      )}
                      {o.status_note && <div className="mt-2 text-[11.5px] font-semibold text-[#8A93B8]">{o.status_note}</div>}

                      <div className="mt-3.5 flex flex-wrap gap-2">
                        {nx.map(s => s === 'cancelled' ? (
                          <Btn key={s} kind="danger" small disabled={busy} onClick={() => { setCancelO(o); setCancelNote('') }}>{t.aCancelA}</Btn>
                        ) : (
                          <Btn key={s} kind={s === 'confirmed' ? 'primary' : 'soft'} small disabled={busy}
                            onClick={() => setStatus(o.id, s)}>
                            {s === 'confirmed' ? t.aConfirmA : s === 'delivering' ? t.aOnWay : t.aDeliveredA}
                          </Btn>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

      <Modal open={!!cancelO} onClose={() => setCancelO(null)} title={t.aCancelQ}>
        <div className="text-[13px] font-semibold text-[#4A5270]">#{cancelO?.id} · {cancelO?.name}</div>
        <textarea value={cancelNote} onChange={e => setCancelNote(e.target.value)} rows={2} placeholder={t.aCancelReason}
          className="mt-2.5 w-full bg-white border border-navy-line rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium outline-none focus:border-navy" />
        <div className="mt-3 flex gap-2">
          <Btn kind="ghost" onClick={() => setCancelO(null)}>{t.aCloseX}</Btn>
          <Btn kind="danger" disabled={busy} onClick={() => { const id = cancelO.id; setCancelO(null); setStatus(id, 'cancelled', cancelNote || undefined) }}>{t.aCancelA}</Btn>
        </div>
      </Modal>
    </div>
  )
}
