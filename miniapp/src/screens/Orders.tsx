import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type MyOrder } from '../lib/store'
import { fmt } from '../lib/money'
import { TopBar, Empty, BigButton, IcNavOrders, IcTruck } from '../components/ui'
import { haptic } from '../lib/tg'
import { branchLabel, pickupWhenText } from '../components/Fulfillment'

const ACTIVE = ['new', 'confirmed', 'cooking', 'delivering']
const ARCHIVE = ['done', 'cancelled']
export function statusLabel(s: string, t: any) {
  return (t as any)[`st_${s}`] || s
}
export const CHIP_STYLE: Record<string, string> = {
  new: 'bg-[var(--chip-new-bg)] text-[var(--chip-new)]',
  confirmed: 'bg-[var(--chip-cf-bg)] text-[var(--chip-cf)]',
  cooking: 'bg-[var(--chip-ck-bg)] text-[var(--chip-ck)]',
  delivering: 'bg-[var(--chip-dl-bg)] text-[var(--chip-dl)]',
  done: 'bg-[var(--chip-done-bg)] text-[var(--chip-done)]',
  cancelled: 'bg-[var(--chip-cx-bg)] text-[var(--chip-cx)]',
}

const STAGE: Record<string, number> = { new: 0, confirmed: 1, cooking: 1, delivering: 2, done: 3 }
const STEPS = ['new', 'confirmed', 'delivering', 'done'] as const

function ago(at: string, t: any) {
  const m = Math.floor((Date.now() - new Date(at).getTime()) / 60000)
  if (m < 1) return t.ordNow
  if (m < 60) return `${m} ${t.ordMinAgo}`
  if (m < 60 * 24) return `${Math.floor(m / 60)} ${t.ordHourAgo}`
  return `${Math.floor(m / 1440)} ${t.ordDayAgo}`
}

function Stepper({ o, t }: { o: MyOrder; t: any }) {
  // Olib ketishda 'delivering' bosqichi mavjud emas: yangi → tasdiqlandi → tayyor
  const steps = o.mode === 'pickup' ? (['new', 'confirmed', 'done'] as const) : STEPS
  const stage = o.mode === 'pickup' ? (o.status === 'done' ? 2 : o.status === 'new' ? 0 : 1) : (STAGE[o.status] ?? 0)
  return (
    <div className="mt-3.5">
      <div className="relative flex items-center">
        <div className="absolute left-[7%] right-[7%] top-[5px] h-[3px] rounded-full bg-navy-line" />
        <div
          className="absolute left-[7%] top-[5px] h-[3px] rounded-full bg-[var(--acc)] transition-all duration-500"
          style={{ width: `${(stage / (steps.length - 1)) * 86}%` }}
        />
        {steps.map((s, i) => (
          <div key={s} className="relative flex-1 flex flex-col items-center gap-1.5">
            <span
              className={`w-[13px] h-[13px] rounded-full border-[3px] transition-all duration-300 ${
                i < stage ? 'bg-[var(--acc)] border-[var(--acc)]' : i === stage ? 'bg-[var(--acc)] border-[var(--acc-ring)] animate-pulse' : 'bg-[var(--panel)] border-navy-line'
              }`}
            />
            <span className={`text-[8.5px] font-bold leading-none ${i <= stage ? 'text-[var(--acc)]' : 'text-[var(--mut2)]'}`}>
              {statusLabel(s, t)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Orders({ variant = 'page' }: { variant?: 'page' | 'panel' }) {
  const panel = variant === 'panel'
  const { t, lang, myOrders, refreshOrders, ff, ordersLoaded } = useStore()
  const nav = useNavigate()

  React.useEffect(() => {
    refreshOrders()
    const iv = setInterval(refreshOrders, 5000)
    return () => clearInterval(iv)
  }, [])

  const act = myOrders.filter(o => ACTIVE.includes(o.status))
  const arc = myOrders.filter(o => ARCHIVE.includes(o.status))
  const [view, setView] = React.useState<'active' | 'archive'>('active')

  const ActiveCard = ({ o }: { o: MyOrder }) => {
    const shown = o.items.slice(0, 3)
    const rest = o.items.length - shown.length
    return (
      <div className="bg-[var(--panel)] border border-navy-line rounded-[20px] p-4 shadow-[0_2px_10px_-6px_rgba(15,30,154,.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-extrabold">#{o.oid}</span>
          <span className="text-[11px] font-semibold text-[var(--mut2)]">{ago(o.at, t)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${CHIP_STYLE[o.status] || 'bg-navy-soft text-[var(--acc)]'}`}>
            {o.status === 'done' ? '✓ ' : ''}
            {statusLabel(o.status, t)}
          </span>
          <span className="text-[11px] font-semibold text-[var(--mut2)]">{o.mode === 'delivery' ? t.deliveryMode : t.pickup} · {o.pay === 'cash' ? t.cash : t.cardTransfer}</span>
        </div>
        {o.mode === 'pickup' && (o.branch || o.when) && (
          <div className="mt-1 text-[12px] font-semibold text-[var(--mut2)]">
            {[branchLabel(t, o.branch, ff.branches, lang), o.when ? pickupWhenText(t, o.when) : t.pickAsap].filter(Boolean).join(' · ')}
          </div>
        )}
        {o.mode === 'delivery' && o.addr && (
          <div className="mt-1 text-[12px] font-semibold text-[var(--mut2)] truncate">{o.addr}</div>
        )}
        <Stepper o={o} t={t} />
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {shown.map(it => (
            <span key={it.id} className="text-[11.5px] font-bold bg-navy-soft text-navy-ink px-2.5 py-1.5 rounded-lg">
              {it.q}× {it.title}
            </span>
          ))}
          {rest > 0 && <span className="text-[11.5px] font-bold bg-[var(--panel)] border border-navy-line text-[var(--mut2)] px-2.5 py-1.5 rounded-lg">+{rest} {t.ordMore}</span>}
        </div>
        <div className="h-px bg-navy-line my-3" />
        <div className="flex justify-between items-center">
          <span className="text-[11.5px] font-semibold text-[var(--mut2)]">{o.items.length} {t.ordItemsN}</span>
          <span className="text-[16px] font-extrabold">{fmt(o.sum)} UZS</span>
        </div>
      </div>
    )
  }

  const ArchiveCard = ({ o }: { o: MyOrder }) => (
    <div className="bg-[var(--panel)] border border-navy-line rounded-[20px] p-4 shadow-[0_2px_10px_-6px_rgba(15,30,154,.15)]">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-extrabold">#{o.oid}</span>
        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${CHIP_STYLE[o.status] || 'bg-navy-soft text-[var(--acc)]'}`}>
          {o.status === 'done' ? '✓ ' : ''}{statusLabel(o.status, t)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] font-semibold text-[var(--mut2)]">
        <span>{o.mode === 'delivery' ? t.deliveryMode : t.pickup} · {o.pay === 'cash' ? t.cash : t.cardTransfer}</span>
        <span>· {ago(o.at, t)}</span>
      </div>
      {o.mode === 'delivery' && o.addr && (
        <div className="mt-1 text-[12px] font-semibold text-[var(--mut2)] truncate">{o.addr}</div>
      )}
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {o.items.slice(0, 3).map(it => (
          <span key={it.id} className="text-[11.5px] font-bold bg-navy-soft text-navy-ink px-2.5 py-1.5 rounded-lg">
            {it.q}× {it.title}
          </span>
        ))}
        {o.items.length > 3 && <span className="text-[11.5px] font-bold bg-[var(--panel)] border border-navy-line text-[var(--mut2)] px-2.5 py-1.5 rounded-lg">+{o.items.length - 3} {t.ordMore}</span>}
      </div>
      <div className="h-px bg-navy-line my-3" />
      <div className="flex justify-between items-center">
        <span className="text-[11.5px] font-semibold text-[var(--mut2)]">{o.items.length} {t.ordItemsN}</span>
        <span className="text-[16px] font-extrabold">{fmt(o.sum)} UZS</span>
      </div>
    </div>
  )

  return (
    <div className={panel ? 'pb-4' : 'pb-28'}>
      {!panel && <TopBar title={t.tabOrders} />}
      {/* Savat uslubidagi sarlavha qatori: chapda son, o'ngda Faol/Arxiv almashinuvi */}
      <div className="flex items-center justify-between px-4 mt-1">
        <span className="text-[13.5px] font-bold text-[var(--mut)]">
          {view === 'active' ? t.ordActiveN.replace('{n}', String(act.length)) : t.ordArchiveN.replace('{n}', String(arc.length))}
        </span>
        <button
          onClick={() => { haptic(); setView(v => (v === 'active' ? 'archive' : 'active')) }}
          disabled={view === 'active' ? arc.length === 0 : act.length === 0}
          className="press text-[13.5px] font-extrabold text-[var(--acc)] disabled:opacity-40 transition-opacity"
        >
          {view === 'active' ? t.archive : t.active}
        </button>
      </div>
      {!ordersLoaded ? (
        <div className="px-4 mt-4 space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map(i => <div key={i} className="skel h-[120px]" />)}
        </div>
      ) : view === 'active' ? (
        myOrders.length === 0 ? (
          <div className="px-4">
            <Empty icon={<IcNavOrders s={40} />} title={t.noOrders} sub={t.noOrdersSub}
              action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
          </div>
        ) : act.length === 0 ? (
          <div className="px-4">
            <Empty icon={<IcTruck s={40} />} title={t.noActive}
              sub={arc.length > 0 ? t.ordersInProfile : t.noActiveSub}
              action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
          </div>
        ) : (
          <div className={panel ? 'px-4 mt-4 space-y-3' : 'px-4 mt-4 space-y-3 anim-up lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0'}>
            {act.map(o => <ActiveCard key={o.oid} o={o} />)}
          </div>
        )
      ) : arc.length === 0 ? (
        <div className="px-4">
          <Empty icon={<IcNavOrders s={40} />} title={t.noArchive} sub={t.noArchiveSub}
            action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
        </div>
      ) : (
        <div className={panel ? 'px-4 mt-4 space-y-3' : 'px-4 mt-4 space-y-3 anim-up lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0'}>
          {arc.map(o => <ArchiveCard key={o.oid} o={o} />)}
        </div>
      )}
    </div>
  )
}
