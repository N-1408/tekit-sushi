import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type MyOrder } from '../lib/store'
import { fmt } from '../lib/money'
import { TopBar, Empty, BigButton, StatusChip } from '../components/ui'

const ACTIVE = ['new', 'confirmed', 'cooking', 'delivering']
const ARCHIVE = ['done', 'cancelled']
export function statusLabel(s: string, t: any) {
  return (t as any)[`st_${s}`] || s
}

export default function Orders() {
  const { t, myOrders } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = React.useState<'active' | 'archive'>('active')
  const act = myOrders.filter(o => ACTIVE.includes(o.status))
  const arc = myOrders.filter(o => ARCHIVE.includes(o.status))
  const list = tab === 'active' ? act : arc

  const chip = (on: boolean) => `press flex-1 py-3 rounded-xl text-[13px] font-bold border transition-all ${on ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-white text-navy-ink border-navy-line'}`

  return (
    <div className="pb-28">
      <TopBar title={t.tabOrders} back={false} />
      {myOrders.length === 0 ? (
        <div className="px-4">
          <Empty emoji="📦" title={t.noOrders} sub={t.noOrdersSub}
            action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
        </div>
      ) : (
        <>
          <div className="px-4 mt-4 flex gap-2">
            <button className={chip(tab === 'active')} onClick={() => setTab('active')}>{t.active} · {act.length}</button>
            <button className={chip(tab === 'archive')} onClick={() => setTab('archive')}>{t.archive} · {arc.length}</button>
          </div>
          {list.length === 0 ? (
            <div className="px-4">
              <Empty emoji={tab === 'active' ? '🛵' : '🗄'} title={tab === 'active' ? t.noActive : t.noArchive}
                sub={tab === 'active' ? t.noActiveSub : t.noArchiveSub} />
            </div>
          ) : (
            <div className="px-4 mt-4 space-y-3">
              {list.map(o => (
                <div key={o.oid} className="bg-white border border-navy-line rounded-[18px] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-extrabold">#{o.oid}</span>
                    <StatusChip status={o.status} label={statusLabel(o.status, t)} />
                  </div>
                  <div className="mt-1 text-[11.5px] font-semibold text-[#A2A9C6]">{new Date(o.at).toLocaleString()}</div>
                  <div className="mt-2 space-y-1">
                    {o.items.map(it => (
                      <div key={it.id} className="flex justify-between text-[13px] font-medium">
                        <span>{it.q}× {it.title}</span>
                        <span className="font-bold">{fmt(it.q * it.price)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-navy-line my-2.5" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11.5px] font-semibold text-[#8A93B8]">{o.mode === 'delivery' ? t.deliveryMode : t.pickup} · {o.pay === 'cash' ? t.cash : t.cardTransfer}</span>
                    <span className="text-[15px] font-extrabold">{fmt(o.sum)} UZS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
