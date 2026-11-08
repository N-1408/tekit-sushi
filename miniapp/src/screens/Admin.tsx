import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { fmt } from '../lib/money'
import { TopBar, BigButton } from '../components/ui'

type AOrder = {
  id: number; created_at: string; name: string; phone: string; addr: string | null
  mode: string; pay: string; total: number; status: string; items: any[]; when: string | null; note: string | null
}
const STATUSES = ['new', 'confirmed', 'delivering', 'done', 'cancelled'] as const
const ST_COLOR: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', delivering: 'bg-indigo-100 text-indigo-700',
  done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
}

export default function Admin() {
  const { t } = useStore()
  const nav = useNavigate()
  const [key, setKey] = React.useState(localStorage.getItem('tk-admin') || '')
  const [input, setInput] = React.useState('')
  const [orders, setOrders] = React.useState<AOrder[]>([])
  const [err, setErr] = React.useState('')
  const [filter, setFilter] = React.useState<string>('all')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const r = await fetch('/api/admin?action=orders', { headers: { 'X-Admin-Key': key } })
      if (r.status === 401) { setErr('auth'); return }
      const j = await r.json()
      setOrders((j.orders || []).map((o: any) => ({ ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items })))
      setErr('')
    } catch { setErr('fetch') }
  }, [key])

  React.useEffect(() => {
    if (!key) return
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [key, load])

  async function setStatus(id: number, status: string) {
    setBusy(true)
    try {
      const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify({ action: 'status', id, status }) })
      if (r.ok) { setOrders(os => os.map(o => o.id === id ? { ...o, status } : o)); navigator.vibrate?.(15) }
      else if (r.status === 401) setErr('auth')
    } catch { setErr('fetch') }
    setBusy(false)
  }

  const shown = orders.filter(o => filter === 'all' ? true : o.status === filter)
  const counts = orders.reduce((m: any, o) => (m[o.status] = (m[o.status] || 0) + 1, m), {})

  return (
    <div className="pb-28">
      <TopBar title={t.admin} right={<div />} />
      {!key || err === 'auth' ? (
        <div className="px-4 mt-8">
          <div className="tekit-pattern w-20 h-20 rounded-[22px] mx-auto grid place-items-center text-[36px] shadow-lg">🔐</div>
          <p className="mt-4 text-center text-[14px] font-semibold text-[#4A5270]">{t.adminPass}</p>
          <input value={input} onChange={e => setInput(e.target.value)} type="password"
            className="mt-4 w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-navy" placeholder="••••••••" />
          <div className="mt-3">
            <BigButton onClick={() => { localStorage.setItem('tk-admin', input); setKey(input) }}>{t.login}</BigButton>
            {err === 'auth' && <div className="mt-2 text-center text-[12.5px] font-bold text-red-500">{t.wrongPass}</div>}
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 px-4 mt-4 overflow-x-auto no-scrollbar">
            {[['all', `${t.all} ${orders.length}`], ...STATUSES.map(s => [s, `${s} ${counts[s] || 0}`])] .map(([s, l]: any) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-bold border ${filter === s ? 'bg-navy text-white border-navy' : 'bg-white border-navy-line text-navy-ink'}`}>{l}</button>
            ))}
          </div>
          <div className="px-4 mt-3 space-y-3">
            {shown.map(o => (
              <div key={o.id} className="bg-white border border-navy-line rounded-[18px] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[16px] font-extrabold">#{o.id}</span>
                    <span className="ml-2 text-[13px] font-bold">{o.name}</span>
                    <div className="text-[12px] font-semibold text-[#8A93B8] mt-0.5">{o.phone}</div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${ST_COLOR[o.status] || 'bg-navy-soft'}`}>{o.status}</span>
                </div>
                <div className="text-[11.5px] font-semibold text-[#A2A9C6] mt-1">{new Date(o.created_at).toLocaleString()}</div>
                {o.addr && <div className="mt-2 text-[12.5px] font-semibold">📍 {o.addr}</div>}
                {o.when && <div className="text-[12px] font-medium text-[#8A93B8]">🕐 {o.when}</div>}
                <div className="mt-2 space-y-0.5">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[12.5px] font-medium"><span>{it.q}× {it.title}</span><span className="font-bold">{fmt(it.q * it.price)}</span></div>
                  ))}
                </div>
                {o.note && <div className="mt-2 text-[12px] italic text-[#4A5270] bg-navy-soft rounded-xl p-2.5">“{o.note}”</div>}
                <div className="h-px bg-navy-line my-2.5" />
                <div className="flex justify-between items-center">
                  <span className="text-[11.5px] font-semibold text-[#8A93B8]">{o.mode === 'delivery' ? '🛵' : '🏃'} {o.pay === 'cash' ? '💵' : '💳'}</span>
                  <span className="text-[16px] font-extrabold">{fmt(o.total)} UZS</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {STATUSES.map(s => (
                    <button key={s} disabled={busy} onClick={() => setStatus(o.id, s)}
                      className={`flex-1 py-2 rounded-[10px] text-[10.5px] font-extrabold border transition-all ${o.status === s ? 'bg-navy text-white border-navy' : 'bg-white border-navy-line text-[#8A93B8] active:bg-navy-soft'}`}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
            {shown.length === 0 && <div className="py-10 text-center text-[13px] font-bold text-[#8A93B8]">— 0 —</div>}
          </div>
        </>
      )}
    </div>
  )
}
