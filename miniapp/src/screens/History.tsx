import React from 'react'
import { useStore, type MyOrder } from '../lib/store'
import { fmt } from '../lib/money'
import { TopBar, Empty } from '../components/ui'
import { statusLabel, CHIP_STYLE } from './Orders'

export default function History() {
  const { t, myOrders, refreshOrders } = useStore()
  React.useEffect(() => { refreshOrders() }, [])
  const arc = myOrders.filter((o: MyOrder) => ['done', 'cancelled'].includes(o.status))

  return (
    <div className="pb-28">
      <TopBar title={t.historyTitle} />
      {arc.length === 0 ? (
        <div className="px-4">
          <Empty emoji="🗄" title={t.noArchive} sub={t.noArchiveSub} />
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-2.5 lg:max-w-[860px] lg:mx-auto">
          {arc.map(o => (
            <div key={o.oid} className="bg-white border border-navy-line rounded-[18px] px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl grid place-items-center text-[15px] shrink-0 ${o.status === 'done' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {o.status === 'done' ? '✓' : '✕'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-extrabold">#{o.oid}</span>
                  <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-full ${CHIP_STYLE[o.status]}`}>{statusLabel(o.status, t)}</span>
                </div>
                <div className="mt-0.5 text-[11px] font-semibold text-[#A2A9C6] truncate">
                  {new Date(o.at).toLocaleDateString()} · {o.items.map(i => i.title).slice(0, 2).join(', ')}{o.items.length > 2 ? ` +${o.items.length - 2}` : ''}
                </div>
              </div>
              <span className="text-[13.5px] font-extrabold whitespace-nowrap">{fmt(o.sum)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
