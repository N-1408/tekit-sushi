import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { WhaleMark } from '../../components/ui'
import { AdminGate, useAdmin } from './common'

export default function AdminHome() {
  const { t } = useStore()
  return (
    <AdminGate>
      <Body />
    </AdminGate>
  )
}

function Body() {
  const nav = useNavigate()
  const { t } = useStore()
  const a = useAdmin()
  const [pending, setPending] = React.useState<number | null>(null)
  const [todayN, setTodayN] = React.useState<number | null>(null)

  React.useEffect(() => {
    let dead = false
    const load = () => fetch('/api/admin?action=stats', { headers: a.h() })
      .then(r => r.ok ? r.json() : null).then(j => {
        if (dead || !j?.ok) return
        setPending(j.pending); setTodayN(j.today.orders)
      }).catch(() => {})
    load()
    const iv = setInterval(load, 20000)
    return () => { dead = true; clearInterval(iv) }
  }, [])

  const secs = [
    { to: '/admin/dashboard', emoji: '📊', title: t.aDash, sub: t.aDashSub },
    { to: '/admin/orders', emoji: '🧾', title: t.aOrdersM, sub: t.aOrdersSub, badge: pending || 0 },
    { to: '/admin/menu', emoji: '🍣', title: t.aMenuM, sub: t.aMenuSub },
    { to: '/admin/promos', emoji: '🎁', title: t.aPromosM, sub: t.aPromosSub },
  ]
  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 bg-paper border-b border-navy-line" style={{ paddingTop: 'calc(10px + var(--sat))' }}>
        <div className="flex items-center gap-2.5 px-4 pb-2.5">
          <WhaleMark size={38} />
          <div className="flex-1 min-w-0">
            <div className="text-[16.5px] font-extrabold leading-tight">{t.admin}</div>
            <div className="text-[11px] font-semibold text-[#8A93B8] leading-tight">{t.aPanelSub}</div>
          </div>
        </div>
      </header>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2.5">
        {secs.map((s, i) => (
          <button key={s.to} onClick={() => nav(s.to)} style={{ animationDelay: `${i * 50}ms` }}
            className="anim-up press relative text-left bg-white border border-navy-line rounded-[20px] p-4 active:scale-[.97] transition-transform">
            <div className="text-[26px]">{s.emoji}</div>
            <div className="mt-2 text-[14px] font-extrabold leading-tight">{s.title}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-[#8A93B8] leading-snug">{s.sub}</div>
            {!!s.badge && (
              <span className="absolute top-3 right-3 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-extrabold grid place-items-center shadow">{s.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="px-4 mt-4">
        <div className="tekit-pattern rounded-[20px] p-4 text-white flex items-center gap-3.5 shadow-[0_12px_28px_-12px_rgba(10,33,148,.5)]">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center text-[20px]">🧾</div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-white/75 uppercase tracking-wide">{t.aToday}</div>
            <div className="text-[19px] font-extrabold leading-tight">{todayN == null ? '…' : `${todayN} ${t.aOrdersN}`}</div>
          </div>
          <button onClick={() => nav('/admin/dashboard')} className="press bg-white text-navy text-[12.5px] font-extrabold rounded-xl px-3.5 py-2 active:scale-95 transition-transform">{t.aDash}</button>
        </div>
      </div>
    </div>
  )
}
