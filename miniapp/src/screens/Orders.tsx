import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type MyOrder } from '../lib/store'
import { fmt } from '../lib/money'
import { Empty, BigButton, SubBar} from '../components/ui'

const ACTIVE = ['new', 'confirmed', 'cooking', 'delivering']
const ARCHIVE = ['done', 'cancelled']
export function statusLabel(s: string, t: any) {
  return (t as any)[`st_${s}`] || s
}
export const CHIP_STYLE: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-sky-100 text-sky-700',
  cooking: 'bg-indigo-100 text-indigo-700',
  delivering: 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-600',
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
  const stage = STAGE[o.status] ?? 0
  return (
    <div className="mt-3.5">
      <div className="relative flex items-center">
        <div className="absolute left-[7%] right-[7%] top-[5px] h-[3px] rounded-full bg-navy-line" />
        <div
          className="absolute left-[7%] top-[5px] h-[3px] rounded-full bg-navy transition-all duration-500"
          style={{ width: `${(stage / 3) * 86}%` }}
        />
        {STEPS.map((s, i) => (
          <div key={s} className="relative flex-1 flex flex-col items-center gap-1.5">
            <span
              className={`w-[13px] h-[13px] rounded-full border-[3px] transition-all duration-300 ${
                i < stage ? 'bg-navy border-navy' : i === stage ? 'bg-navy border-navy/25 animate-pulse' : 'bg-white border-navy-line'
              }`}
            />
            <span className={`text-[8.5px] font-bold leading-none ${i <= stage ? 'text-navy' : 'text-[#A2A9C6]'}`}>
              {statusLabel(s, t)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Orders() {
  const { t, myOrders, refreshOrders } = useStore()
  const nav = useNavigate()

  React.useEffect(() => {
    refreshOrders()
    const iv = setInterval(refreshOrders, 5000)
    return () => clearInterval(iv)
  }, [])

  const act = myOrders.filter(o => ACTIVE.includes(o.status))
  const arc = myOrders.filter(o => ARCHIVE.includes(o.status))

  const ActiveCard = ({ o }: { o: MyOrder }) => {
    const shown = o.items.slice(0, 3)
    const rest = o.items.length - shown.length
    return (
      <div className="bg-white border border-navy-line rounded-[20px] p-4 shadow-[0_2px_10px_-6px_rgba(10,33,148,.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-extrabold">#{o.oid}</span>
          <span className="text-[11px] font-semibold text-[#A2A9C6]">{ago(o.at, t)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${CHIP_STYLE[o.status] || 'bg-navy-soft text-navy'}`}>
            {statusLabel(o.status, t)}
          </span>
          <span className="text-[11px] font-semibold text-[#8A93B8]">{o.mode === 'delivery' ? t.deliveryMode : t.pickup} · {o.pay === 'cash' ? t.cash : t.cardTransfer}</span>
        </div>
        <Stepper o={o} t={t} />
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {shown.map(it => (
            <span key={it.id} className="text-[11.5px] font-bold bg-navy-soft text-navy-ink px-2.5 py-1.5 rounded-lg">
              {it.q}× {it.title}
            </span>
          ))}
          {rest > 0 && <span className="text-[11.5px] font-bold bg-white border border-navy-line text-[#8A93B8] px-2.5 py-1.5 rounded-lg">+{rest} {t.ordMore}</span>}
        </div>
        <div className="h-px bg-navy-line my-3" />
        <div className="flex justify-between items-center">
          <span className="text-[11.5px] font-semibold text-[#8A93B8]">{o.items.length} {t.ordItemsN}</span>
          <span className="text-[16px] font-extrabold">{fmt(o.sum)} UZS</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <SubBar title={t.tabOrders} />
      {myOrders.length === 0 ? (
        <div className="px-4">
          <Empty emoji="📦" title={t.noOrders} sub={t.noOrdersSub}
            action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
        </div>
      ) : act.length === 0 ? (
        <div className="px-4">
          <Empty emoji="🛵" title={t.noActive}
            sub={arc.length > 0 ? t.ordersInProfile : t.noActiveSub}
            action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3 anim-up lg:max-w-[1240px] lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {act.map(o => <ActiveCard key={o.oid} o={o} />)}
        </div>
      )}
    </div>
  )
}
