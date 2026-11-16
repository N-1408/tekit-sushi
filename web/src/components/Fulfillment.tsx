import React, { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { useStore, type PickupSel, type MyOrder, type Branch } from '../lib/store'
import { requestLocation, haptic } from '../lib/tg'
import MapPicker from './MapPicker'
import { IcLocate, IcPin, IcCheck, IcStore, IcChevL, IcTruck, IcClock, IcInfo } from './ui'
import { fmt } from '../lib/money'

/* ============ Filiallar va jadval ============
 * YAGONA manba: store.ff (server /api/branches dan keladi).
 * Bu faylga faqat UI tiplari kiradi; ixtiyoriy operatsion qiymat YOZILMAYDI. */

export function branchLabel(t: any, id: string | null | undefined, branches?: Branch[], lang?: string): string {
  if (!id) return ''
  const b = (branches || []).find(x => x.id === id)
  if (!b) return id
  const n = b.name as Record<string, string>
  return n[lang || 'uz'] || n.uz || id
}

/* ---------- Toshkent vaqti (qurilma soati emas) ---------- */
const TZ = 'Asia/Tashkent'
function partsOf(d: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
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

/* ===== Yuborilgan OLIB KETISH buyurtmalari ===== */
export function activePickupOrders(list: MyOrder[]): MyOrder[] {
  return list
    .filter(o => o.mode === 'pickup' && !['done', 'cancelled'].includes(o.status))
    .sort((a, b) => String(a.when || '9999').localeCompare(String(b.when || '9999')) || b.oid - a.oid)
}

/* 'YYYY-MM-DD HH:MM' → 'Bugun, 18:30' / 'Ertaga, 12:00' / 'Ju · 21.11, 18:30'. Bo'sh bo'lsa ''. */
export function pickupWhenText(t: any, when?: string | null): string {
  const m = String(when || '').trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  if (!m) return ''
  const today = ymdOf(new Date())
  let day: string
  if (m[1] === today) day = t.pickToday
  else if (m[1] === addDaysYmd(today, 1)) day = t.pickTomorrow
  else {
    const [, mo, dd] = m[1].split('-')
    day = `${(t as any)['dow' + dowOf(m[1])]} · ${dd}.${mo}`
  }
  return `${day}, ${m[2]}`
}

/* Header chip xulosasi */
export function pickupOrderLine(t: any, o: MyOrder, branches?: Branch[], lang?: string): string {
  const parts = [`#${o.oid}`]
  const bl = branchLabel(t, o.branch, branches, lang)
  if (bl) parts.push(bl)
  const w = o.when ? pickupWhenText(t, o.when) : t.pickAsap
  if (w) parts.push(w)
  return parts.join(' · ')
}

/* Header/Cart/Checkout uchun qisqa xulosa:
   "Sampi filiali · Imkon qadar tezroq" yoki "Sampi filiali · Bugun · 18:30". */
export function pickupSummary(t: any, p: PickupSel | null, branches?: Branch[], lang?: string): string {
  if (!p) return ''
  const bl = branchLabel(t, p.branch, branches, lang)
  if (!p.date || !p.time) return p.asap ? `${bl} · ${t.pickAsap}` : bl
  const today = ymdOf(new Date())
  let day: string
  if (p.date === today) day = t.pickToday
  else if (p.date === addDaysYmd(today, 1)) day = t.pickTomorrow
  else {
    const [y, m, d] = p.date.split('-').map(Number)
    day = `${(t as any)['dow' + dowOf(p.date)]} · ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
  }
  return `${bl} · ${day} · ${p.time}`
}

/* jadval slotlari: filiallar 24/7 — kun bo'ylab barcha slotlar;
   bugun bo'lsa hozir + lead dan keyingilar. Kechasi o'tish (midnight rollover)
   tkNow asosida hal qilinadi. */
function slotsFor(date: string, cfg: { slot_minutes: number; prep_minutes: number }): { slots: string[]; isToday: boolean } {
  const now = new Date()
  const today = ymdOf(now)
  const isToday = date === today
  const from = isToday ? minOf(hmOf(now)) + cfg.prep_minutes : -1
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let mm = 0; mm < 60; mm += cfg.slot_minutes) {
      const label = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
      if (isToday && h * 60 + mm < from) continue
      out.push(label)
    }
  }
  return { slots: out, isToday }
}

type Draft = { addr: string; lat: number | null; lon: number | null; verified: boolean } | null
type Quote = { loading: boolean; fee: number; free: boolean; coverage: string; eta_minutes: number | null } | null

/* ============ YETKAZIB BERISH MODALI ============ */
export function DeliveryModal({ open, onClose, switchTo }: { open: boolean; onClose: () => void; switchTo?: () => void }) {
  const { t, user, saveUser, setMode, cartSum } = useStore()
  type View = 'entry' | 'write' | 'review'
  const [view, setView] = useState<View>('entry')
  const [draft, setDraft] = useState<Draft>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [writeTxt, setWriteTxt] = useState('')
  const [locating, setLocating] = useState(false)
  const [locFail, setLocFail] = useState(false)
  const [q, setQ] = useState<Quote>(null)
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const qAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open) {
      setMapOpen(false)
      setLocFail(false)
      setWriteTxt('')
      if (user?.addr) {
        const d: NonNullable<Draft> = { addr: user.addr, lat: user.lat ?? null, lon: user.lon ?? null, verified: user.lat != null }
        setDraft(d)
        setView('review')
        fetchQuote(d)
      } else {
        setDraft(null)
        setView('entry')
        setQ(null)
      }
    }
    return () => {
      if (qTimer.current) clearTimeout(qTimer.current)
      qAbort.current?.abort()
    }
  }, [open])

  function fetchQuote(d: NonNullable<Draft>) {
    if (qTimer.current) clearTimeout(qTimer.current)
    qAbort.current?.abort()
    setQ({ loading: true, fee: 0, free: false, coverage: 'unknown', eta_minutes: null })
    qTimer.current = setTimeout(() => {
      const ac = new AbortController()
      qAbort.current = ac
      fetch('/api/delivery-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({ address: d.addr, lat: d.lat ?? undefined, lon: d.lon ?? undefined, subtotal: cartSum }),
      })
        .then(r => (r.ok ? r.json() : null))
        .then(j => {
          if (!j?.ok) { setQ(null); return }
          setQ({ loading: false, fee: Number(j.fee) || 0, free: !!j.free, coverage: j.coverage || 'unknown', eta_minutes: j.eta_minutes ?? null })
        })
        .catch(() => { if (!ac.signal.aborted) setQ(null) })
    }, 450)
  }

  function setDraftQ(d: NonNullable<Draft>) {
    setDraft(d)
    setView('review')
    fetchQuote(d)
  }

  async function detect() {
    if (locating) return
    setLocating(true)
    setLocFail(false)
    const loc = await requestLocation()
    if (!loc || !loc.lat) { setLocating(false); setLocFail(true); return }
    let addr = `${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)}`
    let verified = false
    try {
      const r = await fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lon}`)
      const j = await r.json()
      if (j?.ok && j.addr) { addr = j.addr; verified = true }
    } catch { /* geokodlanmadi — kordinata ko'rsatiladi */ }
    setLocating(false)
    setDraftQ({ addr, lat: loc.lat, lon: loc.lon, verified })
  }

  function confirm() {
    if (!draft) return
    haptic('medium')
    saveUser({ addr: draft.addr, ...(draft.lat != null ? { lat: draft.lat, lon: draft.lon } : { lat: undefined, lon: undefined }) })
    setMode('delivery')
    onClose()
  }

  const opt = 'press focus-ring w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] hover:border-[#29A8E0]/50 text-left transition-colors active:scale-[.99]'
  const optTitle = 'text-[15.5px] font-extrabold text-[var(--ink)] leading-tight'
  const optSub = 'text-[13.5px] font-medium text-[var(--mut2)] leading-snug mt-0.5'
  const outside = q && !q.loading && q.coverage === 'outside'

  return (
    <>
      <Modal open={open} onClose={onClose} title={view === 'write' ? t.delWrite : t.delTitle} width={480}
        foot={
          view === 'review' && draft ? (
            <div className="flex gap-2.5">
              <button onClick={() => setMapOpen(true)}
                className="press focus-ring flex-1 py-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[15px] font-extrabold active:scale-[.98] transition-transform">
                {t.delAdj}
              </button>
              <button onClick={confirm} disabled={!!outside} data-autofocus
                className="press focus-ring flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform disabled:opacity-40">
                {t.delConfirm}
              </button>
            </div>
          ) : switchTo ? (
            <button onClick={switchTo}
              className="press focus-ring w-full py-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[15px] font-extrabold active:scale-[.98] transition-transform">
              {t.delSwitchPickup}
            </button>
          ) : undefined}>
        {view === 'write' ? (
          <div className="space-y-3">
            <button onClick={() => setView('entry')}
              className="press focus-ring flex items-center gap-2 text-[14px] font-bold text-[var(--mut2)] hover:text-[var(--ink)] px-1 -mt-1">
              <IcChevL s={16} /> {t.pickChange || t.delChange}
            </button>
            <input
              value={writeTxt}
              onChange={e => setWriteTxt(e.target.value)}
              placeholder={t.delWritePh}
              maxLength={200}
              autoFocus
              className="w-full px-4 py-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] focus:border-[#29A8E0]/60 outline-none text-[15px] font-semibold text-[var(--ink)] placeholder:text-[var(--mut2)] placeholder:font-medium"
            />
            <div className="text-[13px] font-medium text-[var(--mut2)] px-1 leading-snug">{t.delWriteSub}</div>
            <button
              onClick={() => setDraftQ({ addr: writeTxt.trim(), lat: null, lon: null, verified: false })}
              disabled={writeTxt.trim().length < 6} data-autofocus
              className="press focus-ring w-full py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold active:scale-[.98] transition-transform disabled:opacity-40">
              {t.delNext}
            </button>
          </div>
        ) : view === 'review' && draft ? (
          <div className="space-y-3">
            <button onClick={() => { setDraft(null); setView('entry'); setQ(null) }}
              className="press focus-ring flex items-center gap-2 text-[14px] font-bold text-[var(--mut2)] hover:text-[var(--ink)] px-1 -mt-1">
              <IcChevL s={16} /> {t.delChange}
            </button>
            <div className="flex items-start gap-3 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3.5">
              <span className="text-[#29A8E0] shrink-0 mt-0.5"><IcPin s={18} /></span>
              <div className="min-w-0">
                <div className="text-[15.5px] font-extrabold text-[var(--ink)] leading-snug break-words">{draft.addr}</div>
                {!draft.verified && (
                  <div className="text-[12.5px] font-semibold text-[var(--mut2)] mt-1">{t.delCoords}</div>
                )}
              </div>
            </div>

            {/* Narx va vaqt: haqiqiy javobga asoslangan; sozlanmagan bo'lsa halol yo'q */}
            <div className="bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3.5 space-y-2.5">
              {q?.loading ? (
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 border-[3px] border-[var(--line2)] border-t-[#29A8E0] rounded-full animate-spin shrink-0" />
                  <span className="text-[14px] font-semibold text-[var(--mut2)]">…</span>
                </div>
              ) : q ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#29A8E0] shrink-0"><IcTruck s={16} /></span>
                    <span className="text-[15px] font-extrabold text-[var(--ink)]">{t.delFeeLine}:</span>
                    <span className={'text-[15px] font-extrabold ml-auto ' + (q.free ? 'text-emerald-500' : 'text-[var(--ink)]')}>
                      {q.free ? t.freeDelivery : fmt(q.fee) + ' UZS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#29A8E0] shrink-0"><IcClock s={16} /></span>
                    <span className="text-[14px] font-semibold text-[var(--mut2)] leading-snug">
                      {q.eta_minutes != null ? t.delEtaIn.replace('{n}', String(q.eta_minutes)) : t.delEtaUnknown}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-[14px] font-semibold text-[var(--mut2)] leading-snug">{t.delCoverageUnknown}</div>
              )}
            </div>

            {outside && (
              <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3.5">
                <span className="text-amber-500 shrink-0 mt-0.5"><IcPin s={17} /></span>
                <div className="text-[14px] font-semibold text-[var(--ink)] leading-snug">{t.delCoverageOut}</div>
              </div>
            )}
            {!outside && q && !q.loading && q.coverage === 'unknown' && (
              <div className="flex items-start gap-2.5 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3">
                <span className="text-[#29A8E0] shrink-0 mt-0.5"><IcInfo s={16} /></span>
                <div className="text-[13px] font-medium text-[var(--mut2)] leading-snug">{t.delCoverageUnknown}</div>
              </div>
            )}
            {switchTo && (
              <button onClick={switchTo}
                className="press focus-ring w-full py-3 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[14.5px] font-extrabold active:scale-[.98] transition-transform">
                {t.delSwitchPickup}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {locating ? (
              <div className="py-10 flex flex-col items-center gap-4">
                <span className="w-8 h-8 border-[3px] border-[var(--line2)] border-t-[#29A8E0] rounded-full animate-spin" />
                <div className="text-[15px] font-bold text-[var(--ink2)]">{t.delLocating}</div>
              </div>
            ) : (
              <>
                {user?.addr && (
                  <button className={opt} data-autofocus onClick={() => setDraftQ({ addr: user.addr, lat: user.lat ?? null, lon: user.lon ?? null, verified: user.lat != null })}>
                    <span className="w-11 h-11 rounded-xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcCheck s={19} /></span>
                    <span className="min-w-0">
                      <span className={optTitle + ' block'}>{t.delSaved}</span>
                      <span className={optSub + ' block truncate'}>{user.addr}</span>
                    </span>
                  </button>
                )}
                <button className={opt} onClick={() => { setWriteTxt(''); setView('write') }}>
                  <span className="w-11 h-11 rounded-xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcPin s={19} /></span>
                  <span className="min-w-0">
                    <span className={optTitle + ' block'}>{t.delWrite}</span>
                    <span className={optSub + ' block'}>{t.delWriteSub}</span>
                  </span>
                </button>
                <button className={opt} onClick={() => setMapOpen(true)}>
                  <span className="w-11 h-11 rounded-xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcLocate s={19} /></span>
                  <span className="min-w-0">
                    <span className={optTitle + ' block'}>{t.delMapPick}</span>
                    <span className={optSub + ' block'}>{t.delMapSub}</span>
                  </span>
                </button>
                <div className="flex items-start gap-2 pt-1.5 px-1 text-[13px] font-medium text-[var(--mut2)] leading-snug">
                  <span className="text-[#29A8E0] shrink-0 mt-0.5"><IcPin s={14} /></span>
                  {t.cityNote}
                </div>
                {locFail && (
                  <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3.5">
                    <span className="text-amber-500 shrink-0 mt-0.5"><IcPin s={17} /></span>
                    <div className="text-[14px] font-semibold text-[var(--ink)] leading-snug">{t.delLocFail}</div>
                  </div>
                )}
                <button onClick={detect} className="press focus-ring w-full py-3 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[14.5px] font-extrabold active:scale-[.98] transition-transform flex items-center justify-center gap-2">
                  <IcLocate s={16} /> {t.delDetect}
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
      <MapPicker
        open={mapOpen}
        initial={draft?.lat != null && draft?.lon != null ? { lat: draft.lat, lon: draft.lon } : (user?.lat != null && user?.lon != null ? { lat: user.lat, lon: user.lon } : null)}
        onPick={(a, lat, lon) => { setMapOpen(false); setDraftQ({ addr: a, lat, lon, verified: true }) }}
        onClose={() => setMapOpen(false)}
        t={t}
      />
    </>
  )
}

/* ============ OLIB KETISH MODALI ============ */
export function PickupModal({ open, onClose, switchTo }: { open: boolean; onClose: () => void; switchTo?: () => void }) {
  const { t, lang, pickup, setPickup, setMode, ff } = useStore()
  const cfg = ff.pickup_cfg
  const [branch, setBranch] = useState<string | null>(null)
  const [asap, setAsap] = useState(true)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [schedOpen, setSchedOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setBranch(pickup?.branch ?? null)
      if (pickup?.date && pickup?.time) {
        setAsap(false); setDate(pickup.date); setTime(pickup.time); setSchedOpen(true)
      } else {
        setAsap(true); setDate(null); setTime(null); setSchedOpen(false)
      }
    }
  }, [open])

  const days = cfg ? Array.from({ length: Math.max(1, cfg.days_ahead || 6) + 1 }, (_, i) => addDaysYmd(ymdOf(new Date()), i)) : []
  const slotInfo = date && cfg ? slotsFor(date, { slot_minutes: cfg.slot_minutes || 30, prep_minutes: cfg.prep_minutes || 0 }) : null

  function confirm() {
    if (!branch) return
    haptic('medium')
    const p: PickupSel = asap || !date || !time
      ? { branch, asap: true }
      : { branch, asap: false, date, time }
    setPickup(p)
    setMode('pickup')
    onClose()
  }

  const chipBase = 'press focus-ring px-3.5 py-2 rounded-xl text-[14px] font-extrabold border transition-colors '
  const chipOn = 'bg-navy text-white border-navy shadow-[0_6px_14px_-6px_rgba(10,33,148,.55)]'
  const chipOff = 'bg-[var(--panel)] text-[var(--ink2)] border-[var(--line2)] hover:border-[#29A8E0]/50'
  const ready = branch && (asap || (date && time))

  return (
    <Modal open={open} onClose={onClose} title={t.pickTitle} width={480}
      foot={
        <div className="flex gap-2.5">
          {switchTo && (
            <button onClick={switchTo}
              className="press focus-ring flex-1 py-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[15px] font-extrabold active:scale-[.98] transition-transform">
              {t.fcDel}
            </button>
          )}
          <button onClick={confirm} disabled={!ready} data-autofocus
            className="press focus-ring flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform disabled:opacity-40">
            {t.delConfirm}
          </button>
        </div>
      }>
      <div className="space-y-4">
        {/* Filiallar: faqat haqiqiy ma'lumot — nom, 24/7; manzil ma'lumoti kelsa ko'rsatiladi */}
        <div>
          <div className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--mut2)] mb-2 px-1">{t.pickBranch}</div>
          <div className="space-y-2.5">
            {ff.branches.map(b => {
              const sel = branch === b.id
              return (
                <button key={b.id} onClick={() => { setBranch(b.id); haptic('light') }}
                  className={'press focus-ring w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl text-left transition-colors active:scale-[.99] border '
                    + (sel ? 'bg-[#29A8E0]/10 border-[#29A8E0]' : 'bg-[var(--panel)] border-[var(--line2)] hover:border-[#29A8E0]/50')}>
                  <span className={'w-11 h-11 rounded-xl grid place-items-center shrink-0 ' + (sel ? 'bg-[#29A8E0] text-white' : 'bg-[#29A8E0]/15 text-[#29A8E0]')}><IcStore s={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[15.5px] font-extrabold text-[var(--ink)] leading-tight block">{b.name[lang] || b.name.uz}</span>
                    <span className="text-[13px] font-bold text-[var(--mut2)] mt-0.5 block">
                      {b.hours_24_7 ? '24/7' : ''}
                      {b.address ? ` · ${b.address}` : ''}
                    </span>
                  </span>
                  {sel && <span className="text-[#29A8E0] shrink-0"><IcCheck s={18} /></span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Vaqt: ikki aniq rejim; jadval sozlanmagan bo'lsa halol holat */}
        {branch && (
          <div>
            <div className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--mut2)] mb-2 px-1">{t.pickTiming}</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => { setAsap(true); setSchedOpen(false); setTime(null); setDate(null) }}
                className={'press focus-ring px-3 py-3.5 rounded-2xl border text-left transition-colors active:scale-[.99] '
                  + (asap ? 'bg-[#29A8E0]/10 border-[#29A8E0]' : 'bg-[var(--panel)] border-[var(--line2)] hover:border-[#29A8E0]/50')}>
                <span className={'flex items-center gap-2 ' + (asap ? 'text-[#29A8E0]' : 'text-[var(--ink)]')}><IcClock s={16} /> <span className="text-[14.5px] font-extrabold">{t.pickAsap}</span></span>
                <span className="text-[12.5px] font-semibold text-[var(--mut2)] mt-1.5 block leading-snug">
                  {cfg?.prep_minutes ? t.pickPrepIn.replace('{n}', String(cfg.prep_minutes)) : t.pickPrepUnknown}
                </span>
              </button>
              <button onClick={() => { if (!cfg) return; setAsap(false); setSchedOpen(true) }} disabled={!cfg}
                className={'press focus-ring px-3 py-3.5 rounded-2xl border text-left transition-colors active:scale-[.99] disabled:opacity-50 '
                  + (!asap && cfg ? 'bg-[#29A8E0]/10 border-[#29A8E0]' : 'bg-[var(--panel)] border-[var(--line2)] hover:border-[#29A8E0]/50')}>
                <span className={'flex items-center gap-2 ' + (!asap && cfg ? 'text-[#29A8E0]' : 'text-[var(--ink)]')}><IcClock s={16} /> <span className="text-[14.5px] font-extrabold">{t.pickChooseTime}</span></span>
                <span className="text-[12.5px] font-semibold text-[var(--mut2)] mt-1.5 block leading-snug">
                  {!cfg ? t.pickSchedOff : (asap ? t.pickChooseTime : (date && time ? `${pickupWhenText(t, `${date} ${time}`)}` : t.pickSchedTitle))}
                </span>
              </button>
            </div>

            {schedOpen && cfg && (
              <div className="mt-3 space-y-3 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl p-3.5">
                <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
                  {days.map(d => {
                    const isToday = d === ymdOf(new Date())
                    const isTom = d === addDaysYmd(ymdOf(new Date()), 1)
                    const label = isToday ? t.pickToday : isTom ? t.pickTomorrow : `${(t as any)['dow' + dowOf(d)]} · ${d.slice(8, 10)}.${d.slice(5, 7)}`
                    return (
                      <button key={d} onClick={() => { setDate(d); setTime(null) }}
                        className={chipBase + (date === d ? chipOn : chipOff) + ' shrink-0'}>
                        {label}
                      </button>
                    )
                  })}
                </div>
                {date && slotInfo && (
                  <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
                    {slotInfo.slots.map(s => (
                      <button key={s} onClick={() => setTime(s)}
                        className={chipBase + (time === s ? chipOn : chipOff) + ' text-center'}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ============ BOSHLANG'ICH TANLOV MODALI ============ */
export function InitialChoiceModal({ open }: { open: boolean; onClose?: () => void }) {
  const { t, setMode } = useStore()
  return (
    <Modal open={open} onClose={() => {}} title={t.fcTitle} width={440}>
      <div className="space-y-2.5">
        <button
          onClick={() => { haptic('medium'); setMode('delivery') }}
          data-autofocus
          className="press focus-ring w-full flex items-center gap-4 px-4 py-5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] hover:border-[#29A8E0]/50 text-left transition-colors active:scale-[.99]"
        >
          <span className="w-12 h-12 rounded-2xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcTruck s={22} /></span>
          <span className="min-w-0">
            <span className="text-[16px] font-extrabold text-[var(--ink)] block">{t.fcDel}</span>
            <span className="text-[13.5px] font-medium text-[var(--mut2)] mt-0.5 block">{t.fcDelSub}</span>
          </span>
        </button>
        <button
          onClick={() => { haptic('medium'); setMode('pickup') }}
          className="press focus-ring w-full flex items-center gap-4 px-4 py-5 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] hover:border-[#29A8E0]/50 text-left transition-colors active:scale-[.99]"
        >
          <span className="w-12 h-12 rounded-2xl bg-[#29A8E0]/15 text-[#29A8E0] grid place-items-center shrink-0"><IcStore s={22} /></span>
          <span className="min-w-0">
            <span className="text-[16px] font-extrabold text-[var(--ink)] block">{t.fcPick}</span>
            <span className="text-[13.5px] font-medium text-[var(--mut2)] mt-0.5 block">{t.fcPickSub}</span>
          </span>
        </button>
      </div>
    </Modal>
  )
}
