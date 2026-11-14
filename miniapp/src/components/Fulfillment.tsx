import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { useStore, type PickupSel } from '../lib/store'
import { requestLocation, haptic } from '../lib/tg'
import MapPicker from './MapPicker'
import { IcLocate, IcPin, IcCheck, IcStore, IcChevR } from './ui'

/* ---------- olib ketish konfiguratsiyasi ----------
 * MUHIM: filiallar ro'yxati loyihada hozircha ma'lumot manbaisiz — bu yerda
 * yozilgan. Ish vaqti va tayyorlash vaqti (lead) ham hali rasmiy ma'lumot
 * kelgan yo'q: qiymatlar vaqtinchalik, faqat shu blokda. Ma'lumot kelganda
 * faqat shu blok yangilanadi, boshqa joy o'zgarmaydi. */
export const BRANCHES: { id: string; label: string }[] = [
  { id: 'nukus', label: 'Nukus ko\u2018cha filiali' },
  { id: 'sampi', label: 'Sampi filiali' },
]
export const PICKUP_CFG = {
  tz: 'Asia/Tashkent',
  openHour: 10,
  closeHour: 21,        // 21:00 — oxirgi boshlanish vaqti
  slotMinutes: 30,
  leadMinutes: 45,      // tanlash uchun kamida 45 daqiqa kutish
  daysAhead: 6,         // bugun + 6 kun
}

/* ---------- Toshkent vaqti (qurilma soati emas) ---------- */
function partsOf(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: PICKUP_CFG.tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (t: string) => p.find(x => x.type === t)?.value || ''
  return {
    ymd: `${g('year')}-${g('month')}-${g('day')}`,
    hm: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}`,
  }
}
const ymdOf = (d: Date) => partsOf(d).ymd
const hmOf = (d: Date) => partsOf(d).hm
const minOf = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5))
function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}
const dowOf = (ymd: string): number => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/* Header/Cart/Checkout uchun qisqa xulosa: "Sampi filiali · Bugun · 18:30" */
export function pickupSummary(t: any, p: PickupSel): string {
  const today = ymdOf(new Date())
  let day: string
  if (p.date === today) day = t.pickToday
  else if (p.date === addDaysYmd(today, 1)) day = t.pickTomorrow
  else {
    const [y, m, d] = p.date.split('-').map(Number)
    day = `${(t as any)['dow' + dowOf(p.date)]} · ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
  }
  return `${p.branch} · ${day} · ${p.time}`
}

/* tanlanadigan slotlar: bugun bo'lsa lead + joriy vaqtdan keyingilar */
function slotsFor(date: string): { slots: string[]; nowMin: number; isToday: boolean } {
  const now = new Date()
  const today = ymdOf(now)
  const isToday = date === today
  const nowMin = isToday ? minOf(hmOf(now)) : -1
  const out: string[] = []
  for (let h = PICKUP_CFG.openHour; h < PICKUP_CFG.closeHour; h++) {
    for (let mm = 0; mm < 60; mm += PICKUP_CFG.slotMinutes) {
      const label = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
      if (isToday && h * 60 + mm < nowMin + PICKUP_CFG.leadMinutes) continue
      out.push(label)
    }
  }
  return { slots: out, nowMin, isToday }
}

type Draft = { addr: string; lat: number; lon: number; verified: boolean } | null

/* ============ YETKAZIB BERISH MODALI ============ */
export function DeliveryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, user, saveUser, setMode } = useStore()
  const [st, setSt] = useState<'choose' | 'locating' | 'review' | 'fail'>('choose')
  const [draft, setDraft] = useState<Draft>(null)
  const [mapOpen, setMapOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setSt('choose')
      setDraft(null)
      setMapOpen(false)
    }
  }, [open])

  async function detect() {
    setSt('locating')
    const loc = await requestLocation()
    if (!loc || !loc.lat) { setSt('fail'); return }
    let addr = `${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}`
    let verified = false
    try {
      const r = await fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lon}`)
      const j = await r.json()
      if (j?.ok && j.addr) { addr = j.addr; verified = true }
    } catch { /* geokodlanmadi — kordinata ko'rsatiladi */ }
    setDraft({ addr, lat: loc.lat, lon: loc.lon, verified })
    setSt('review')
  }

  function confirm() {
    if (!draft) return
    haptic('medium')
    saveUser({ addr: draft.addr, lat: draft.lat, lon: draft.lon })
    setMode('delivery')
    onClose()
  }

  const opt = 'press focus-ring w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] hover:border-[#29A8E0]/50 text-left transition-colors active:scale-[.99]'
  const optTitle = 'text-[15.5px] font-extrabold text-[var(--ink)] leading-tight'
  const optSub = 'text-[13.5px] font-medium text-[var(--mut2)] leading-snug mt-0.5'

  return (
    <>
      <Modal open={open} onClose={onClose} title={t.delTitle} width={480}
        foot={st === 'review' && draft ? (
          <div className="flex gap-2.5">
            <button onClick={() => setMapOpen(true)}
              className="press focus-ring flex-1 py-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[15px] font-extrabold active:scale-[.98] transition-transform">
              {t.delAdj}
            </button>
            <button onClick={confirm} data-autofocus
              className="press focus-ring flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
              {t.delConfirm}
            </button>
          </div>
        ) : undefined}>
        <div className="space-y-2.5">
          {st === 'choose' && (
            <>
              <button className={opt} data-autofocus onClick={detect}>
                <span className="w-11 h-11 rounded-xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcLocate s={19} /></span>
                <span className="min-w-0">
                  <span className={optTitle + ' block'}>{t.delDetect}</span>
                  <span className={optSub + ' block'}>{t.delDetectSub}</span>
                </span>
              </button>
              <button className={opt} onClick={() => setMapOpen(true)}>
                <span className="w-11 h-11 rounded-xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcPin s={19} /></span>
                <span className="min-w-0">
                  <span className={optTitle + ' block'}>{t.delMapPick}</span>
                  <span className={optSub + ' block'}>{t.delMapSub}</span>
                </span>
              </button>
              <div className="flex items-start gap-2 pt-1.5 px-1 text-[13px] font-medium text-[var(--mut2)] leading-snug">
                <span className="text-[#29A8E0] shrink-0 mt-0.5"><IcPin s={14} /></span>
                {t.cityNote}
              </div>
            </>
          )}
          {st === 'locating' && (
            <div className="py-10 flex flex-col items-center gap-4">
              <span className="w-8 h-8 border-[3px] border-[var(--line2)] border-t-[#29A8E0] rounded-full animate-spin" />
              <div className="text-[15px] font-bold text-[var(--ink2)]">{t.delLocating}</div>
            </div>
          )}
          {st === 'fail' && (
            <div className="py-6 space-y-4">
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3.5">
                <span className="text-amber-500 shrink-0 mt-0.5"><IcPin s={17} /></span>
                <div className="text-[14px] font-semibold text-[var(--ink)] leading-snug">{t.delLocFail}</div>
              </div>
              <button onClick={() => setMapOpen(true)} data-autofocus
                className="press focus-ring w-full py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold active:scale-[.98] transition-transform">
                {t.delMapPick}
              </button>
            </div>
          )}
          {st === 'review' && draft && (
            <div className="pt-1">
              <div className="flex items-start gap-3 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3.5">
                <span className="text-[#29A8E0] shrink-0 mt-0.5"><IcPin s={18} /></span>
                <div className="min-w-0">
                  <div className="text-[15.5px] font-extrabold text-[var(--ink)] leading-snug break-words">{draft.addr}</div>
                  {!draft.verified && (
                    <div className="text-[12.5px] font-semibold text-[var(--mut2)] mt-1">{t.delCoords}</div>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[13px] font-medium text-[var(--mut2)] px-1">{t.delDetectSub}</div>
            </div>
          )}
        </div>
      </Modal>
      <MapPicker
        open={mapOpen}
        initial={draft ? { lat: draft.lat, lon: draft.lon } : (user?.lat && user?.lon ? { lat: user.lat, lon: user.lon } : null)}
        onPick={(a, lat, lon) => { setDraft({ addr: a, lat, lon, verified: true }); setSt('review'); setMapOpen(false) }}
        onClose={() => setMapOpen(false)}
        t={t}
      />
    </>
  )
}

/* ============ OLIB KETISH MODALI ============ */
export function PickupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, pickup, setPickup, setMode } = useStore()
  const [br, setBr] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (open) {
      setBr(pickup?.branch || null)
      setDate(pickup?.date || null)
      setTime(pickup?.time || null)
      setExpired(false)
    }
  }, [open, pickup])

  const days: string[] = []
  if (open) {
    const today = ymdOf(new Date())
    for (let k = 0; k <= PICKUP_CFG.daysAhead; k++) days.push(addDaysYmd(today, k))
  }
  const { slots, isToday } = date ? slotsFor(date) : { slots: [], isToday: false }

  // tanlangan vaqt bugungi kunga o'tkazilsa yoki o'tib ketsa — tozalash
  useEffect(() => {
    if (!open || !date || !time) return
    const { slots: sl, isToday: today } = slotsFor(date)
    if (today && !sl.includes(time)) {
      setTime(null)
      setExpired(true)
    }
  }, [open, date, time])

  function confirm() {
    if (!br || !date || !time) return
    haptic('medium')
    setPickup({ branch: br, date, time })
    setMode('pickup')
    onClose()
  }

  const today = ymdOf(new Date())
  const tomorrow = addDaysYmd(today, 1)
  const dayLabel = (d: string) => d === today ? t.pickToday : d === tomorrow ? t.pickTomorrow : (t as any)['dow' + dowOf(d)]
  const dayNum = (d: string) => { const [, m, day] = d.split('-'); return `${Number(day)}.${Number(m)}` }

  const canSave = !!(br && date && time)
  return (
    <Modal open={open} onClose={onClose} title={t.pickTitle} width={480}
      foot={
        <div>
          {!canSave && <div className="text-[13px] font-semibold text-[var(--mut2)] text-center mb-2">{t.pickNeed}</div>}
          <button onClick={confirm} disabled={!canSave} data-autofocus
            className="press focus-ring w-full py-4 rounded-2xl bg-navy text-white text-[16px] font-extrabold disabled:opacity-40 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.delConfirm}
          </button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--mut2)] mb-2">{t.pickBranch}</div>
          <div className="space-y-2">
            {BRANCHES.map(b => {
              const on = br === b.id
              return (
                <button key={b.id} onClick={() => { setBr(b.id); haptic('light') }} aria-pressed={on}
                  className={`press focus-ring w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left border transition-colors ${on ? 'border-navy bg-navy-soft' : 'border-[var(--line2)] bg-[var(--panel)] hover:border-[#29A8E0]/50'}`}>
                  <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${on ? 'bg-navy text-white' : 'bg-[var(--soft)] text-[var(--mut2)]'}`}><IcStore s={17} /></span>
                  <span className="flex-1 min-w-0 text-[15.5px] font-bold text-[var(--ink)] truncate">{b.label}</span>
                  {on && <span className="text-navy shrink-0"><IcCheck s={17} /></span>}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--mut2)] mb-2">{t.pickDate}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {days.map(d => {
              const on = date === d
              return (
                <button key={d} onClick={() => { setDate(d); setTime(null); setExpired(false); haptic('light') }} aria-pressed={on}
                  className={`press focus-ring shrink-0 w-[64px] py-2.5 rounded-xl border text-center transition-colors ${on ? 'border-navy bg-navy text-white' : 'border-[var(--line2)] bg-[var(--panel)] text-[var(--ink2)] hover:border-[#29A8E0]/50'}`}>
                  <span className={`block text-[12px] font-bold ${on ? 'opacity-80' : 'text-[var(--mut2)]'}`}>{dayLabel(d)}</span>
                  <span className="block text-[15px] font-extrabold mt-0.5">{dayNum(d)}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[var(--mut2)] mb-2">{t.pickTime}</div>
          {date ? (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(sl => {
                const on = time === sl
                return (
                  <button key={sl} onClick={() => { setTime(sl); setExpired(false); haptic('light') }} aria-pressed={on}
                    className={`press focus-ring py-2.5 rounded-xl border text-[14px] font-bold transition-colors ${on ? 'border-navy bg-navy text-white' : 'border-[var(--line2)] bg-[var(--panel)] text-[var(--ink2)] hover:border-[#29A8E0]/50'}`}>
                    {sl}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-[14px] font-medium text-[var(--mut2)] py-3">{t.pickDate} —</div>
          )}
          {expired && <div className="mt-2 text-[13px] font-semibold text-amber-600">{t.pickExpired}</div>}
          {isToday && date && !expired && (
            <div className="mt-2 text-[12.5px] font-semibold text-[var(--mut2)]">
              {t.pickToday}: +{PICKUP_CFG.leadMinutes} min · {PICKUP_CFG.openHour}:00–{PICKUP_CFG.closeHour}:00
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
