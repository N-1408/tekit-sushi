import React from 'react'
import { useStore } from '../lib/store'
import { tgUser, requestLocation, haptic } from '../lib/tg'

const input = 'w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 placeholder:text-[#A2A9C6]'

export default function Onboarding() {
  const { t, user, saveUser, closeOb } = useStore()
  const u = tgUser()
  const first = !user
  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState(user?.name || u?.first_name || '')
  const [phone, setPhone] = React.useState(user?.phone || '')
  const [addr, setAddr] = React.useState(user?.addr || '')
  const [coords, setCoords] = React.useState<{ lat: number; lon: number } | null>(user?.lat != null ? { lat: user.lat, lon: user.lon! } : null)
  const [busy, setBusy] = React.useState(false)
  const [locState, setLocState] = React.useState<'idle' | 'ok' | 'fail'>(user?.addr ? 'ok' : 'idle')

  const detect = React.useCallback(async () => {
    setBusy(true)
    const loc = await requestLocation()
    if (!loc) { setBusy(false); setLocState('fail'); haptic('error'); return }
    try {
      const r = await fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lon}`)
      const j = r.ok ? await r.json() : null
      setCoords(loc)
      if (j?.ok && j.addr) { setAddr(j.addr); setLocState('ok'); haptic('success') }
      else setLocState('fail')
    } catch { setCoords(loc); setLocState('fail') }
    setBusy(false)
  }, [])

  React.useEffect(() => {
    if (step === 1 && first && !addr && !busy && locState === 'idle') detect()
  }, [step])

  const valid1 = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9
  const commit = (a: string) => {
    haptic('success')
    saveUser({ tg_id: u?.id, name: name.trim() || u?.first_name || 'Mijoz', phone: phone.trim(), addr: a.trim(), lat: coords?.lat, lon: coords?.lon })
    closeOb()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#0A2194] overflow-y-auto">
      <div className="min-h-full flex flex-col">
        <div className="px-5 pt-[calc(env(safe-area-inset-top)+var(--tg-csa-top,0px)+var(--tg-extra,0px)+22px)] pb-7 text-white">
          <div className="flex items-center justify-between">
            <div className="tekit-pattern w-12 h-12 rounded-2xl grid place-items-center text-[22px] shadow-lg">🐋</div>
            <div className="flex gap-1.5">
              {[0, 1].map(i => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-white/25'}`} />
              ))}
            </div>
          </div>
          <h1 className="mt-7 text-[26px] font-extrabold leading-tight">{step === 0 ? t.obHi : t.obLocTitle}</h1>
          <p className="mt-1.5 text-[13.5px] text-white/70 font-medium">{step === 0 ? t.obSub1 : t.obLocSub}</p>
        </div>
        <div className="flex-1 bg-[#F6F7FB] rounded-t-[28px] px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+28px)]">
          {step === 0 ? (
            <div className="space-y-3.5 anim-up">
              <div>
                <div className="text-[12px] font-bold text-[#8A93B8] mb-1.5">{t.yourName}</div>
                <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder={u?.first_name || 'Nurmuhammad'} />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#8A93B8] mb-1.5">{t.phone}</div>
                <input className={input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
              </div>
              <button onClick={() => { if (valid1) { haptic(); setStep(1) } }}
                className={`w-full py-3.5 rounded-2xl text-[14.5px] font-extrabold press transition-all ${valid1 ? 'bg-navy text-white shadow-[0_8px_20px_-6px_rgba(10,33,148,.45)]' : 'bg-white text-[#A2A9C6] border border-navy-line'}`}>
                {t.obNext}
              </button>
              <button onClick={() => commit('')} className="w-full py-3 text-[13px] font-bold text-[#8A93B8] press">{t.obSkip}</button>
            </div>
          ) : (
            <div className="space-y-3.5 anim-up">
              <button onClick={detect} disabled={busy}
                className="w-full py-4 rounded-2xl bg-navy text-white text-[14.5px] font-extrabold press shadow-[0_8px_20px_-6px_rgba(10,33,148,.45)] flex items-center justify-center gap-2.5 disabled:opacity-60">
                {busy ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
                )}
                {busy ? t.obLocDetecting : t.obLocBtn}
              </button>
              {locState !== 'idle' && (
                <div className={`text-[12.5px] font-bold ${locState === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {locState === 'ok' ? t.obLocOk : t.obLocFail}
                </div>
              )}
              <textarea className={input + ' min-h-[92px] resize-none'} value={addr} onChange={e => setAddr(e.target.value)} placeholder={t.addressPh} />
              <button onClick={() => commit(addr)} disabled={addr.trim().length < 5 || busy}
                className={`w-full py-3.5 rounded-2xl text-[14.5px] font-extrabold press transition-all ${addr.trim().length >= 5 ? 'bg-navy text-white shadow-[0_8px_20px_-6px_rgba(10,33,148,.45)]' : 'bg-white text-[#A2A9C6] border border-navy-line'}`}>
                {t.obDone}
              </button>
              <button onClick={() => commit('')} className="w-full py-3 text-[13px] font-bold text-[#8A93B8] press">{t.obSkip}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
