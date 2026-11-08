import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, type MyOrder } from '../lib/store'
import { fmt } from '../lib/money'
import { TopBar, Empty, BigButton, StatusChip } from '../components/ui'

const FLOW = ['new', 'confirmed', 'delivering', 'done'] as const
export function statusLabel(s: string, t: any) {
  return (t as any)[`st_${s}`] || s
}

export default function Orders() {
  const { t, lang, myOrders } = useStore()
  const nav = useNavigate()
  return (
    <div className="pb-28">
      <TopBar title={t.tabOrders} />
      {myOrders.length === 0 ? (
        <div className="px-4">
          <Empty emoji="📦" title={t.noOrders} sub={t.noOrdersSub}
            action={<BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>} />
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {myOrders.map(o => (
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
    </div>
  )
}
