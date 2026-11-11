import React from 'react'
import { useStore } from '../../lib/store'
import { AdminTopBar, Btn, Field, Toggle, inputCls, useAdmin } from './common'
import { haptic } from '../../lib/tg'

export default function AdminPromos() {
  return <Body />
}

function Body() {
  const { t, showToast } = useStore()
  const a = useAdmin()
  const promos: any[] = a.data?.promos || []
  const [code, setCode] = React.useState('')
  const [pct, setPct] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  async function add() {
    if (busy || !code.trim()) return
    setBusy(true)
    try {
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify({ action: 'promo_add', code, percent: Number(pct) }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) { showToast(t.aSavedA); haptic('success'); setCode(''); setPct(''); a.refresh() }
      else { showToast(j?.error || t.orderFail); haptic('error') }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  async function toggle(codeV: string) {
    a.update({ promos: promos.map(p => p.code === codeV ? { ...p, active: !p.active } : p) })
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'promo_toggle', code: codeV }) })
    if (!r.ok) { a.refresh(); haptic('error') } else haptic()
  }

  async function del(codeV: string) {
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'promo_del', code: codeV }) })
    if (r.ok) { a.update({ promos: promos.filter(p => p.code !== codeV) }); haptic('medium') } else haptic('error')
  }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aTabP} />
      <div className="px-4 mt-4">
        <div className="bg-white border border-navy-line rounded-[20px] p-4">
          <div className="grid grid-cols-[1fr_88px] gap-2.5">
            <Field label={t.promo}><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="TEKIT10" className={`${inputCls} font-mono font-bold tracking-wider`} /></Field>
            <Field label="%"><input value={pct} onChange={e => setPct(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${inputCls} text-center`} /></Field>
          </div>
          <div className="mt-3"><Btn onClick={add} disabled={busy || !code.trim() || !pct}>+ {t.aAddItem}</Btn></div>
        </div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        {!a.ready && promos.length === 0 ? [0, 1].map(i => <div key={i} className="h-[64px] rounded-[18px] bg-white border border-navy-line animate-pulse" />) :
          promos.length === 0 ? (
            <div className="mt-6 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.aNoPromos} —</div>
          ) : promos.map(p => (
            <article key={p.code} className="bg-white border border-navy-line rounded-[18px] p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl tekit-pattern text-white grid place-items-center text-[15px] font-extrabold shadow">🎁</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-extrabold font-mono tracking-wider">{p.code}</div>
                <div className="text-[12px] font-bold text-[#8A93B8]">−{p.percent}% · {p.active ? t.aActiveA : t.aHidden}</div>
              </div>
              <Toggle on={!!p.active} onChange={() => toggle(p.code)} />
              <button onClick={() => del(p.code)} className="press w-9 h-9 rounded-xl bg-red-50 grid place-items-center active:scale-90 transition-transform">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </button>
            </article>
          ))}
      </div>
    </div>
  )
}
