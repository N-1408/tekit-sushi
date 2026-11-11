import React from 'react'
import { useStore } from '../../lib/store'
import { T } from '../../lib/i18n'
import { fmt } from '../../lib/money'
import { AdminTopBar, Btn, Modal, useAdmin } from './common'
import { fmtDT, startAlertLoop, stopAlertLoop, isSoundMuted, setSoundMuted } from '../../lib/admin'
import { haptic } from '../../lib/tg'

const STATUSES = ['new', 'confirmed', 'delivering', 'done', 'cancelled'] as const
const ST_CLS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
}
const NEXT: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['delivering', 'cancelled'],
  delivering: ['done', 'cancelled'],
  done: [], cancelled: [],
}
const t: any = T.en

type O = any

export default function AdminOrders() {
  return <Body />
}

function Body() {
  const { showToast } = useStore()
  const a = useAdmin()
  const [err, setErr] = React.useState('')
  const [filter, setFilter] = React.useState<string>('new')
  const [q, setQ] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [cancelO, setCancelO] = React.useState<O | null>(null)
  const [cancelNote, setCancelNote] = React.useState('')
  const [openId, setOpenId] = React.useState<number | null>(null)
  const [cashO, setCashO] = React.useState<O | null>(null)
  const [muted, setMuted] = React.useState(isSoundMuted())
  const cached = a.data?.orders || []
  const maxIdRef = React.useRef(Math.max(0, ...cached.map((o: O) => Number(o.id) || 0)))
  const firstRef = React.useRef(cached.length === 0)
  const orders: O[] = a.data?.orders || []

  const parseItems = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw
    try { const v = JSON.parse(String(raw || '[]')); return Array.isArray(v) ? v : [] } catch { return [] }
  }

  const aRef = React.useRef(a); aRef.current = a
  const load = React.useCallback(async () => {
    const A = aRef.current
    if (!A.ready) return
    const myMax = maxIdRef.current
    try {
      const r = await fetch('/api/admin?action=orders', { headers: A.h() })
      if (r.status === 401) { setErr('auth'); return }
      const j = await r.json()
      if (!j?.ok) { setErr('x'); return }
      const list: O[] = j.orders || []
      setErr('')
      const top = list.reduce((m, o) => Math.max(m, Number(o.id) || 0), 0)
      A.update({ orders: list, risk: j.risk || {} })
      if (!list.some((o: O) => o.status === 'new')) stopAlertLoop()
      if (top > myMax) {
        if (!firstRef.current) {
          startAlertLoop()
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
    const iv = setInterval(load, 3000)
    return () => { clearInterval(iv); stopAlertLoop() }
  }, [load, a.ready])

  const toggleMute = () => {
    const v = !muted
    setMuted(v); setSoundMuted(v); haptic()
    if (v) stopAlertLoop()
    else if (orders.some(o => o.status === 'new')) startAlertLoop()
  }

  async function setStatus(id: number, status: string, note?: string) {
    setBusy(true)
    try {
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify({ action: 'status', id, status, note }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) {
        a.update({ orders: (a.data?.orders || []).map(o => o.id === id ? { ...o, status, status_note: note || o.status_note, status_at: new Date().toISOString() } : o) })
        haptic('success')
      } else {
        showToast(j?.error || t.orderFail); haptic('error')
      }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  const counts: Record<string, number> = { all: orders.length }
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1

  let shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  if (q.trim()) {
    const s = q.trim().toLowerCase()
    shown = shown.filter(o =>
      String(o.id).includes(s) || String(o.phone || '').toLowerCase().includes(s) || String(o.name || '').toLowerCase().includes(s))
  }

  const Chip = ({ s }: { s: string }) => (
    <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg whitespace-nowrap ${ST_CLS[s] || 'bg-navy-soft text-navy-ink'}`}>{t['st_' + s]}</span>
  )
  const nextBtn = (o: O, s: string, compact?: boolean) => s === 'cancelled' ? (
    <Btn key={s} kind="danger" small disabled={busy} onClick={() => { setCancelO(o); setCancelNote('') }}>{t.aCancelA}</Btn>
  ) : (
    <Btn key={s} kind={s === 'confirmed' ? 'primary' : 'soft'} small disabled={busy}
      onClick={() => {
        if (s === 'confirmed' && o.payment === 'cash') { setCashO(o); return }
        setStatus(o.id, s)
      }}>
      {s === 'confirmed' ? t.aConfirmA : s === 'delivering' ? t.aOnWay : t.aDeliveredA}
      {compact ? '' : ''}
    </Btn>
  )
  const detail = (o: O) => {
    const items = parseItems(o.items)
    return (
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          {items.map((it: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-6 h-6 rounded-lg bg-navy-soft text-navy-ink grid place-items-center text-[11px] font-extrabold">{it.q}</span>
              <span className="flex-1 font-semibold truncate">{it.title}</span>
              <span className="font-bold">{fmt((Number(it.price) || 0) * (Number(it.q) || 1))}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-[12.5px] font-medium text-[#4A5270]">
          {o.address && <div className="flex gap-1.5"><span>📍</span><span>{o.address}</span></div>}
          {o.delivery_time && <div className="flex gap-1.5"><span>🕒</span><span>{o.delivery_time}</span></div>}
          {o.note && <div className="flex gap-1.5"><span>💬</span><span>{o.note}</span></div>}
          {o.promo_code && <div className="flex gap-1.5"><span>🎁</span><span>{o.promo_code} · −{fmt(o.discount || 0)} UZS</span></div>}
          {o.status_note && <div className="text-[11.5px] font-semibold text-[#8A93B8]">{o.status_note}</div>}
        </div>
      </div>
    )
  }

  const bellOn = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="M2 2l20 20" /></svg>
  )
  const bellOff = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  )

  return (
    <div className="pb-28 lg:pb-10">
      <AdminTopBar title={t.aTabO} right={
        <button onClick={toggleMute} aria-label={muted ? t.aSoundOn : t.aSoundOff} title={muted ? t.aSoundOn : t.aSoundOff}
          className={`press w-9 h-9 rounded-xl grid place-items-center border transition-colors ${muted ? 'bg-white border-navy-line text-[#A2A9C6]' : 'bg-navy text-white border-navy shadow-[0_6px_14px_-6px_rgba(10,33,148,.5)]'}`}>
          {muted ? bellOn : bellOff}
        </button>
      } />

      <div className="px-4 mt-3 lg:max-w-[1200px] lg:mx-auto lg:px-8">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.aSearchO}
          className="w-full bg-white border border-navy-line rounded-2xl py-2.5 px-4 text-[13.5px] font-medium outline-none focus:border-navy placeholder:text-[#A2A9C6]" />
      </div>
      <div className="flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${filter === 'all' ? 'bg-navy text-white' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
          {t.all} {counts.all || 0}
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${filter === s ? 'bg-navy text-white shadow-[0_6px_14px_-6px_rgba(10,33,148,.5)]' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
            {t['st_' + s]} {counts[s] || 0}
          </button>
        ))}
      </div>

      {err === 'auth' ? <div className="px-4 mt-8 text-center text-[13.5px] font-bold text-red-500">{t.wrongPass}</div> :
        shown.length === 0 ? (
          <div className="px-4 mt-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.aNoOrdersA} —</div>
        ) : (
          <>
            {/* Mobile: accordion cards */}
            <div className="lg:hidden px-4 mt-3 space-y-2.5">
              {shown.map(o => {
                const open = openId === o.id
                const nx = NEXT[o.status] || []
                return (
                  <article key={o.id} className={`anim-up bg-white border rounded-[20px] overflow-hidden transition-colors ${o.status === 'new' ? 'border-amber-300 shadow-[0_8px_20px_-10px_rgba(180,120,0,.25)]' : 'border-navy-line'}`}>
                    <button onClick={() => { setOpenId(open ? null : o.id); haptic() }} className="w-full text-left px-4 pt-3.5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-extrabold">#{o.id}</span>
                        <Chip s={o.status} />
                        {(a.data?.risk?.[String(o.phone)] || 0) >= 2 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-red-100 text-red-600">⚠ {a.data.risk[String(o.phone)]} cancelled</span>
                        )}
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
                          {o.delivery_type === 'pickup' ? t.pickup : t.deliveryMode} · {o.payment === 'transfer' || o.payment === 'card' ? t.cardTransfer : t.cash}{o.change_amount ? ` · ${t.changeLabel} ${fmt(o.change_amount)}` : ''}
                        </span>
                      </div>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 border-t border-navy-line/70 pt-3">
                        {detail(o)}
                        <div className="mt-3.5 flex flex-wrap gap-2">
                          {nx.map(s => nextBtn(o, s))}
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden lg:block px-8 mt-4 max-w-[1200px] mx-auto">
              <div className="bg-white border border-navy-line rounded-[22px] overflow-hidden shadow-[0_2px_14px_-8px_rgba(10,33,148,.15)]">
                <div className="grid grid-cols-[110px_minmax(0,1.1fr)_minmax(0,1.3fr)_110px_120px_250px] gap-4 px-5 py-3 border-b border-navy-line bg-paper text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A93B8]">
                  <div>{t.aColNo}</div>
                  <div>{t.aColCust}</div>
                  <div>{t.aColItems}</div>
                  <div className="text-right">{t.aColTotal}</div>
                  <div>{t.aColStatus}</div>
                  <div className="text-right">{t.aColAct}</div>
                </div>
                {shown.map(o => {
                  const open = openId === o.id
                  const nx = NEXT[o.status] || []
                  const items = parseItems(o.items)
                  const sum = items.slice(0, 2).map((it: any) => `${it.q}× ${it.title}`).join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '')
                  return (
                    <React.Fragment key={o.id}>
                      <div onClick={() => { setOpenId(open ? null : o.id) }}
                        className={`grid grid-cols-[110px_minmax(0,1.1fr)_minmax(0,1.3fr)_110px_120px_250px] gap-4 px-5 py-3.5 border-b border-navy-line/60 items-center cursor-pointer transition-colors hover:bg-paper ${o.status === 'new' ? 'bg-amber-50/70' : ''}`}>
                        <div>
                          <div className="text-[13.5px] font-extrabold">#{o.id}</div>
                          <div className="text-[10.5px] font-semibold text-[#8A93B8] mt-0.5">{fmtDT(o.created_at)}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold truncate">{o.name}</div>
                          <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()} className="text-[11.5px] font-semibold text-navy underline decoration-navy/30 underline-offset-2">{o.phone}</a>
                          <div className="text-[10.5px] font-semibold text-[#8A93B8] mt-0.5">
                            {o.delivery_type === 'pickup' ? t.pickup : t.deliveryMode} · {o.payment === 'transfer' || o.payment === 'card' ? t.cardTransfer : t.cash}{o.change_amount ? ` · ${t.changeLabel} ${fmt(o.change_amount)}` : ''}
                          </div>
                        </div>
                        <div className="text-[12px] font-semibold text-[#4A5270] truncate">{sum}</div>
                        <div className="text-right text-[14px] font-extrabold tracking-tight whitespace-nowrap">{fmt(o.total)}</div>
                        <div className="flex items-center gap-1.5">
                          <Chip s={o.status} />
                          {(a.data?.risk?.[String(o.phone)] || 0) >= 2 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg bg-red-100 text-red-600">⚠</span>}
                        </div>
                        <div onClick={e => e.stopPropagation()} className="flex flex-wrap gap-2 justify-end">
                          {nx.map(s => nextBtn(o, s))}
                          {!nx.length && <span className="text-[11px] font-semibold text-[#A2A9C6] self-center">—</span>}
                        </div>
                      </div>
                      {open && (
                        <div className="px-5 py-4 border-b border-navy-line/60 bg-paper/70">
                          {detail(o)}
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </>
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

      <Modal open={!!cashO} onClose={() => setCashO(null)} title={t.aCashQ}>
        <div className="text-[13px] font-semibold text-[#4A5270]">#{cashO?.id} · {cashO?.name} · {cashO?.phone}</div>
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-amber-800 leading-snug">{t.aCashRisk}</div>
        {(a.data?.risk?.[String(cashO?.phone)] || 0) >= 1 && (
          <div className="mt-2 text-[12.5px] font-extrabold text-red-600">⚠ {a.data.risk[String(cashO?.phone || '')]} cancelled orders from this number</div>
        )}
        {cashO?.change_amount ? <div className="mt-2 text-[13px] font-bold">{t.changeLabel} {fmt(cashO.change_amount)} UZS</div> : null}
        <div className="mt-3 flex gap-2">
          <Btn kind="ghost" onClick={() => setCashO(null)}>{t.aCloseX}</Btn>
          <Btn kind="primary" disabled={busy} onClick={() => { const id = cashO.id; setCashO(null); setStatus(id, 'confirmed') }}>{t.aConfirmA}</Btn>
        </div>
      </Modal>
    </div>
  )
}
