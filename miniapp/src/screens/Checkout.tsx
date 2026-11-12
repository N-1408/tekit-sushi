import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { BigButton, SubBar} from '../components/ui'
import { Banknote, Check } from '../lib/icons'
import MapPicker from '../components/MapPicker'

const Line = ({ label, children }: any) => <div><div className="text-[13.5px] font-bold text-[#8A93B8] mb-1.5">{label}</div>{children}</div>

export default function Checkout() {
  const { t, lang, cart, myOrders, setLang, clearCart, user, saveUser, saveMyOrder, refreshOrders } = useStore()
  const nav = useNavigate()
  const sum = cart.filter(l => l.q > 0).reduce((s, l) => s + l.q * l.price, 0)
  const last = myOrders[0]
  const [name, setName] = React.useState(last?.name || user?.name || '')
  // +998 avtomatik: faqat 9 ta raqam (2 xil kod + 7 raqam) yoziladi
  const digitsOf = (v: string) => { let d = (v || '').replace(/\D/g, ''); if (d.startsWith('998')) d = d.slice(3); return d.slice(-9) }
  const [phoneD, setPhoneD] = React.useState(digitsOf(last?.phone || user?.phone || ''))
  const fmtPhone = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))
  const [addr, setAddr] = React.useState(last?.addr || user?.addr || '')
  const pay = 'cash' as const
  const [changeAmt, setChangeAmt] = React.useState('')
  const [note, setNote] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [done, setDone] = React.useState<{ oid: number } | null>(null)
  const [promoCode, setPromoCode] = React.useState('')
  const [promoPct, setPromoPct] = React.useState(0)
  const [promoMsg, setPromoMsg] = React.useState('')
  const [promoBusy, setPromoBusy] = React.useState(false)
  const [sugs, setSugs] = React.useState<{ label: string; lat: number; lon: number }[]>([])
  const [mapOpen, setMapOpen] = React.useState(false)
  const sugT = React.useRef<ReturnType<typeof setTimeout> | null>(null)
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

  function onAddr(v: string) {
    setAddr(v)
    if (sugT.current) clearTimeout(sugT.current)
    const query = v.trim()
    if (query.length < 3) { setSugs([]); return }
    sugT.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        const j = await r.json()
        setSugs(j?.results || [])
      } catch { setSugs([]) }
    }, 450)
  }

  function pickSug(s: { label: string; lat: number; lon: number }) {
    setAddr(s.label)
    setSugs([])
    haptic('light')
    saveUser({ name: user?.name || '', phone: user?.phone || '', addr: s.label, lat: s.lat, lon: s.lon })
  }

  function onMapPick(a: string, lat: number, lon: number) {
    setAddr(a)
    setSugs([])
    haptic('medium')
    saveUser({ name: user?.name || '', phone: user?.phone || '', addr: a, lat, lon })
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

  const valid = name.trim().length > 1 && phoneD.length === 9 && (mode === 'pickup' || addr.trim().length > 4)

  async function submit() {
    setBusy(true); setErr('')
    try {
      const items = cart.filter(l => l.q > 0).map(l => ({ id: l.id, slug: l.slug, title: pName(l, lang), q: l.q, price: l.price }))
      const r = await fetch('/api/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone: '+998' + phoneD, mode, addr: mode === 'delivery' ? addr : '', pay, note,
          change_amount: pay === 'cash' && changeAmt.replace(/\D/g, '') ? Number(changeAmt.replace(/\D/g, '')) : null,
          promo: promoPct > 0 ? promoCode : '',
          total: sum, lang, tg_user_id: (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null,
          items,
        }),
      })
      if (!r.ok) throw new Error()
      const j = await r.json()
      setDone({ oid: j.order_id })
      saveMyOrder({ oid: j.order_id, at: new Date().toISOString(), status: 'new', items, sum, mode, pay, addr: mode === 'delivery' ? addr : '', name, phone: '+998' + phoneD })
      clearCart()
      setTimeout(refreshOrders, 2500)
      saveUser({ name: name.trim() || user?.name || '', phone: phoneD.length === 9 ? '+998' + phoneD : (user?.phone || ''), addr: mode === 'delivery' && addr.trim() ? addr.trim() : (user?.addr ?? '') })
    } catch { setErr(t.orderFail) }
    setBusy(false)
  }

  const chip = (on: boolean) => `press flex-1 py-2.5 rounded-xl text-[14.5px] font-bold border transition-all ${on ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-white text-navy-ink border-navy-line'}`
  const input = "w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[15.5px] font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 placeholder:text-[#A2A9C6]"

  return (
    <div className="pb-28">
      <SubBar title={t.checkout} />
      {done ? (
        <div className="px-4 pt-16 text-center lg:max-w-[560px] lg:mx-auto">
          <div className="tekit-pattern w-24 h-24 rounded-[26px] mx-auto grid place-items-center shadow-lg text-white"><Check size={44} strokeWidth={2.4} /></div>
          <h2 className="mt-4 text-[22px] font-extrabold">{t.orderPlaced}</h2>
          <p className="mt-1.5 text-[15px] text-[#8A93B8] font-medium">{t.orderPlacedSub}</p>
          <div className="mt-4 inline-block bg-white border border-navy-line rounded-xl px-4 py-2.5 text-[15.5px] font-extrabold">#{done.oid}</div>
          <div className="mt-6"><BigButton onClick={() => nav('/orders')}>{t.tabOrders}</BigButton></div>
        </div>
      ) : (
        <>
          <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:gap-8 lg:items-start">
          <div className="px-4 mt-4 space-y-3.5 lg:flex-1 lg:min-w-0 lg:px-0">
            <Line label={t.yourName}><input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Nurmuhammad" /></Line>
            <Line label={t.phone}>
              <div className="flex items-center gap-1.5 bg-white border border-navy-line rounded-xl px-3.5 py-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10">
                <span className="text-[15.5px] font-extrabold text-[#4A5270]">+998</span>
                <input className="flex-1 min-w-0 bg-transparent text-[15.5px] font-medium outline-none placeholder:text-[#A2A9C6]" type="tel" inputMode="numeric" autoComplete="tel-national"
                  value={fmtPhone(phoneD)} onChange={e => setPhoneD(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="90 123 45 67" />
              </div>
            </Line>

            <Line label={t.howGet}>
              <div className="flex gap-2">
                <button className={chip(mode === 'delivery')} onClick={() => { setMode('delivery'); localStorage.setItem('tk-mode', 'delivery'); haptic() }}>{t.deliveryMode}</button>
                <button className={chip(mode === 'pickup')} onClick={() => { setMode('pickup'); localStorage.setItem('tk-mode', 'pickup'); haptic() }}>{t.pickup}</button>
              </div>
            </Line>

            {mode === 'delivery' && (
              <Line label={t.address}>
                <div className="relative">
                  <textarea className={input + ' min-h-[72px] resize-none'} value={addr} onChange={e => onAddr(e.target.value)} placeholder={t.addressPh} />
                  {sugs.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-navy-line rounded-xl shadow-lg overflow-hidden z-30 max-h-56 overflow-y-auto">
                      {sugs.map((sg, i) => (
                        <button key={i} type="button" onMouseDown={e => e.preventDefault()} onClick={() => pickSug(sg)}
                          className="block w-full text-left px-3.5 py-2.5 text-[14.5px] font-medium border-b border-navy-line/50 last:border-0 hover:bg-navy-soft/60 active:bg-navy-soft">
                          {sg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={detectLoc} disabled={locBusy}
                  className="press mt-2 w-full py-2.5 rounded-xl bg-navy-soft text-navy text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {locBusy ? <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
                  )}
                  {locBusy ? t.obLocDetecting : t.obLocBtn}
                </button>
                <button onClick={() => setMapOpen(true)}
                  className="press mt-2 w-full py-2.5 rounded-xl bg-navy-soft text-navy text-[14px] font-bold flex items-center justify-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14" /><path d="M15 6v14" /></svg>
                  {t.mapBtn}
                </button>
                {locMsg && <div className={`text-[13px] font-bold mt-1.5 ${locMsg === t.obLocOk ? 'text-emerald-600' : 'text-amber-600'}`}>{locMsg}</div>}
              </Line>
            )}

            <Line label={t.payment}>
              <div className="flex gap-2">
                <span className={chip(true)}><span className="inline-flex items-center justify-center gap-1.5"><Banknote size={15} strokeWidth={2.2} />{t.cash}</span></span>
              </div>
              {pay === 'cash' && (
                <div className="mt-2.5 space-y-2.5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-amber-800 leading-snug">{t.cashWarn}</div>
                  <input className={input} value={changeAmt} onChange={e => setChangeAmt(e.target.value.replace(/[^0-9 ]/g, ''))}
                    placeholder={t.changePlaceholder} inputMode="numeric" />
                  <div className="text-[12.5px] font-semibold text-[#A2A9C6] -mt-1.5">{t.changeLabel} · {t.changeHint}</div>
                </div>
              )}
              <div className="text-[13px] font-semibold text-[#A2A9C6] mt-1.5">{t.paySoon}</div>
            </Line>

            <Line label={t.promo}>
              <div className="flex gap-2">
                <input className={input + ' flex-1 uppercase'} value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoPct(0); setPromoMsg('') }} placeholder="TEKIT10" />
                <button onClick={applyPromo} disabled={promoBusy || !promoCode.trim()}
                  className="press px-5 rounded-xl bg-navy text-white text-[14.5px] font-bold disabled:opacity-40">{t.promoApply}</button>
              </div>
              {promoMsg && <div className={`text-[13px] font-bold mt-1.5 ${promoPct > 0 ? 'text-emerald-600' : 'text-[#8A93B8]'}`}>{promoMsg}</div>}
            </Line>
            <Line label={t.comment}><input className={input} value={note} onChange={e => setNote(e.target.value)} placeholder="…" /></Line>

          </div>
            <div className="lg:w-[400px] lg:shrink-0 lg:sticky lg:top-4 lg:px-4 lg:mt-4">
            <div className="bg-white border border-navy-line rounded-[18px] p-4">
              <div className="flex justify-between text-[15px] font-semibold text-[#4A5270]"><span>{t.subtotal}</span><span>{fmt(sum)} UZS</span></div>
              <div className="flex justify-between text-[15px] font-semibold text-[#4A5270] mt-2"><span>{t.delivery}</span><span className="text-emerald-600 font-bold">{t.free}</span></div>
              {discount > 0 && <div className="flex justify-between text-[15px] font-semibold text-[#4A5270] mt-2"><span>{t.promo} ({promoCode})</span><span className="text-emerald-600 font-bold">−{fmt(discount)} UZS</span></div>}
              <div className="h-px bg-navy-line my-3" />
              <div className="flex justify-between text-[19px] font-extrabold"><span>{t.total}</span><span>{fmt(sum - discount)} UZS</span></div>
            </div>

            {err && <div className="text-[14.5px] font-bold text-red-500 text-center">{err}</div>}
          <div className="px-4 mt-5 lg:px-0">
            <BigButton disabled={!valid || busy} onClick={submit}>{busy ? '…' : `${t.confirmOrder} · ${fmt(sum - discount)}`}</BigButton>
          </div>
          </div>
          </div>
        </>
      )}
      <MapPicker
        open={mapOpen}
        initial={user?.lat && user?.lon ? { lat: user.lat, lon: user.lon } : null}
        onPick={onMapPick}
        onClose={() => setMapOpen(false)}
        t={t}
      />
    </div>
  )
}
