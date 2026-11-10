import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, BigButton } from '../components/ui'

const Line = ({ label, children }: any) => <div><div className="text-[12px] font-bold text-[#8A93B8] mb-1.5">{label}</div>{children}</div>

export default function Checkout() {
  const { t, lang, cart, myOrders, setLang, clearCart, user, saveUser, saveMyOrder, refreshOrders } = useStore()
  const nav = useNavigate()
  const sum = cart.filter(l => l.q > 0).reduce((s, l) => s + l.q * l.price, 0)
  const last = myOrders[0]
  const [name, setName] = React.useState(last?.name || user?.name || '')
  const [phone, setPhone] = React.useState(last?.phone || user?.phone || '')
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery')
  const [addr, setAddr] = React.useState(last?.addr || user?.addr || '')
  const [pay, setPay] = React.useState<'cash' | 'card'>('cash')
  const [note, setNote] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [done, setDone] = React.useState<{ oid: number } | null>(null)
  const [promoCode, setPromoCode] = React.useState('')
  const [promoPct, setPromoPct] = React.useState(0)
  const [promoMsg, setPromoMsg] = React.useState('')
  const [promoBusy, setPromoBusy] = React.useState(false)
  const [locBusy, setLocBusy] = React.useState(false)
  const [locMsg, setLocMsg] = React.useState('')
  const discount = promoPct > 0 ? Math.round(sum * promoPct / 100) : 0

  async function detectLoc() {
    setLocBusy(true); setLocMsg('')
    const { requestLocation } = await import('../lib/tg')
    const loc = await requestLocation()
    if (!loc) { setLocBusy(false); setLocMsg(t.obLocFail); return }
    try {
      const r = await fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lon}`)
      const j = r.ok ? await r.json() : null
      if (j?.ok && j.addr) { setAddr(j.addr); setLocMsg(t.obLocOk) }
      else setLocMsg(t.obLocFail)
    } catch { setLocMsg(t.obLocFail) }
    setLocBusy(false)
  }

  async function applyPromo() {
    const c = promoCode.trim().toUpperCase()
    if (!c) return
    setPromoBusy(true); setPromoMsg('')
    try {
      const r = await fetch(`/api/promo?code=${encodeURIComponent(c)}`)
      if (r.ok) { const j = await r.json(); setPromoPct(j.percent); setPromoMsg(`${t.promoOk} · −${j.percent}%`) }
      else { setPromoPct(0); setPromoMsg(t.promoInvalid) }
    } catch { setPromoMsg(t.promoInvalid) }
    setPromoBusy(false)
  }

  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9 && (mode === 'pickup' || addr.trim().length > 4)

  async function submit() {
    setBusy(true); setErr('')
    try {
      const items = cart.filter(l => l.q > 0).map(l => ({ id: l.id, slug: l.slug, title: pName(l, lang), q: l.q, price: l.price }))
      const r = await fetch('/api/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, mode, addr: mode === 'delivery' ? addr : '', pay, note,
          promo: promoPct > 0 ? promoCode : '',
          total: sum, lang, tg_user_id: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null,
          items,
        }),
      })
      if (!r.ok) throw new Error()
      const j = await r.json()
      setDone({ oid: j.order_id })
      saveMyOrder({ oid: j.order_id, at: new Date().toISOString(), status: 'new', items, sum, mode, pay, addr: mode === 'delivery' ? addr : '', name, phone })
      clearCart()
      setTimeout(refreshOrders, 2500)
      saveUser({ name: name.trim() || user?.name || '', phone: phone.trim() || user?.phone || '', addr: mode === 'delivery' && addr.trim() ? addr.trim() : (user?.addr ?? '') })
    } catch { setErr(t.orderFail) }
    setBusy(false)
  }

  const chip = (on: boolean) => `press flex-1 py-2.5 rounded-xl text-[13px] font-bold border transition-all ${on ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-white text-navy-ink border-navy-line'}`
  const input = "w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 placeholder:text-[#A2A9C6]"

  return (
    <div className="pb-28">
      <TopBar title={t.checkout} />
      {done ? (
        <div className="px-4 pt-16 text-center">
          <div className="tekit-pattern w-24 h-24 rounded-[26px] mx-auto grid place-items-center text-[42px] shadow-lg">✅</div>
          <h2 className="mt-4 text-[20px] font-extrabold">{t.orderPlaced}</h2>
          <p className="mt-1.5 text-[13.5px] text-[#8A93B8] font-medium">{t.orderPlacedSub}</p>
          <div className="mt-4 inline-block bg-white border border-navy-line rounded-xl px-4 py-2.5 text-[14px] font-extrabold">#{done.oid}</div>
          <div className="mt-6"><BigButton onClick={() => nav('/orders')}>{t.tabOrders}</BigButton></div>
        </div>
      ) : (
        <>
          <div className="px-4 mt-4 space-y-3.5">
            <Line label={t.yourName}><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Nurmuhammad" /></Line>
            <Line label={t.phone}><input className={input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" /></Line>

            <Line label={t.howGet}>
              <div className="flex gap-2">
                <button className={chip(mode === 'delivery')} onClick={() => { setMode('delivery'); haptic() }}>{t.deliveryMode}</button>
                <button className={chip(mode === 'pickup')} onClick={() => { setMode('pickup'); haptic() }}>{t.pickup}</button>
              </div>
            </Line>

            {mode === 'delivery' && (
              <Line label={t.address}>
                <textarea className={input + ' min-h-[72px] resize-none'} value={addr} onChange={e => setAddr(e.target.value)} placeholder={t.addressPh} />
                <button onClick={detectLoc} disabled={locBusy}
                  className="press mt-2 w-full py-2.5 rounded-xl bg-navy-soft text-navy text-[12.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {locBusy ? <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
                  )}
                  {locBusy ? t.obLocDetecting : t.obLocBtn}
                </button>
                {locMsg && <div className={`text-[11.5px] font-bold mt-1.5 ${locMsg === t.obLocOk ? 'text-emerald-600' : 'text-amber-600'}`}>{locMsg}</div>}
              </Line>
            )}

            <Line label={t.payment}>
              <div className="flex gap-2">
                <button className={chip(pay === 'cash')} onClick={() => { setPay('cash'); haptic() }}>💵 {t.cash}</button>
                <button className={chip(pay === 'card')} onClick={() => { setPay('card'); haptic() }}>💳 {t.cardTransfer}</button>
              </div>
              <div className="text-[11.5px] font-semibold text-[#A2A9C6] mt-1.5">{t.paySoon}</div>
            </Line>

            <Line label={t.promo}>
              <div className="flex gap-2">
                <input className={input + ' flex-1 uppercase'} value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoPct(0); setPromoMsg('') }} placeholder="TEKIT10" />
                <button onClick={applyPromo} disabled={promoBusy || !promoCode.trim()}
                  className="press px-5 rounded-xl bg-navy text-white text-[13px] font-bold disabled:opacity-40">{t.promoApply}</button>
              </div>
              {promoMsg && <div className={`text-[11.5px] font-bold mt-1.5 ${promoPct > 0 ? 'text-emerald-600' : 'text-[#8A93B8]'}`}>{promoMsg}</div>}
            </Line>
            <Line label={t.comment}><input className={input} value={note} onChange={e => setNote(e.target.value)} placeholder="…" /></Line>

            <div className="bg-white border border-navy-line rounded-[18px] p-4">
              <div className="flex justify-between text-[13.5px] font-semibold text-[#4A5270]"><span>{t.subtotal}</span><span>{fmt(sum)} UZS</span></div>
              <div className="flex justify-between text-[13.5px] font-semibold text-[#4A5270] mt-2"><span>{t.delivery}</span><span className="text-emerald-600 font-bold">{t.free}</span></div>
              {discount > 0 && <div className="flex justify-between text-[13.5px] font-semibold text-[#4A5270] mt-2"><span>{t.promo} ({promoCode})</span><span className="text-emerald-600 font-bold">−{fmt(discount)} UZS</span></div>}
              <div className="h-px bg-navy-line my-3" />
              <div className="flex justify-between text-[17px] font-extrabold"><span>{t.total}</span><span>{fmt(sum - discount)} UZS</span></div>
            </div>

            {err && <div className="text-[13px] font-bold text-red-500 text-center">{err}</div>}
          </div>
          <div className="px-4 mt-5">
            <BigButton disabled={!valid || busy} onClick={submit}>{busy ? '…' : `${t.confirmOrder} · ${fmt(sum - discount)}`}</BigButton>
          </div>
        </>
      )}
    </div>
  )
}
