import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, BigButton } from '../components/ui'

export default function Checkout() {
  const { t, lang, cart, myOrders, setLang } = useStore()
  const nav = useNavigate()
  const sum = cart.filter(l => l.q > 0).reduce((s, l) => s + l.q * l.price, 0)
  const last = myOrders[0]
  const [name, setName] = React.useState(last?.name || '')
  const [phone, setPhone] = React.useState(last?.phone || '')
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery')
  const [addr, setAddr] = React.useState(last?.addr || '')
  const [pay, setPay] = React.useState<'cash' | 'card'>('cash')
  const [when, setWhen] = React.useState('')
  const [note, setNote] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [done, setDone] = React.useState<{ oid: number } | null>(null)

  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9 && (mode === 'pickup' || addr.trim().length > 4)

  async function submit() {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, mode, addr: mode === 'delivery' ? addr : '', pay, when, note,
          total: sum, lang, tg_user_id: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null,
          items: cart.filter(l => l.q > 0).map(l => ({ id: l.id, slug: l.slug, title: pName(l, lang), q: l.q, price: l.price })),
        }),
      })
      if (!r.ok) throw new Error()
      const j = await r.json()
      setDone({ oid: j.order_id })
    } catch { setErr(t.orderFail) }
    setBusy(false)
  }

  const Line = ({ label, children }: any) => <div><div className="text-[12px] font-bold text-[#8A93B8] mb-1.5">{label}</div>{children}</div>
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
              </Line>
            )}

            <Line label={t.payment}>
              <div className="flex gap-2">
                <button className={chip(pay === 'cash')} onClick={() => { setPay('cash'); haptic() }}>💵 {t.cash}</button>
                <button className={chip(pay === 'card')} onClick={() => { setPay('card'); haptic() }}>💳 {t.cardTransfer}</button>
              </div>
              <div className="text-[11.5px] font-semibold text-[#A2A9C6] mt-1.5">{t.paySoon}</div>
            </Line>

            <Line label={t.whenDeliver}><input className={input} value={when} onChange={e => setWhen(e.target.value)} placeholder={t.asap} /></Line>
            <Line label={t.comment}><input className={input} value={note} onChange={e => setNote(e.target.value)} placeholder="…" /></Line>

            <div className="bg-white border border-navy-line rounded-[18px] p-4">
              <div className="flex justify-between text-[13.5px] font-semibold text-[#4A5270]"><span>{t.subtotal}</span><span>{fmt(sum)} UZS</span></div>
              <div className="flex justify-between text-[13.5px] font-semibold text-[#4A5270] mt-2"><span>{t.delivery}</span><span className="text-emerald-600 font-bold">{t.free}</span></div>
              <div className="h-px bg-navy-line my-3" />
              <div className="flex justify-between text-[17px] font-extrabold"><span>{t.total}</span><span>{fmt(sum)} UZS</span></div>
            </div>

            {err && <div className="text-[13px] font-bold text-red-500 text-center">{err}</div>}
          </div>
          <div className="px-4 mt-5">
            <BigButton disabled={!valid || busy} onClick={submit}>{busy ? '…' : `${t.confirmOrder} · ${fmt(sum)}`}</BigButton>
          </div>
        </>
      )}
    </div>
  )
}
