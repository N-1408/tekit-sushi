import React from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useNativeBack, tgUser } from "../../lib/tg"
import { BrandLogo } from './brand-logo'

/* ---------- yuqori panel: BARCHA ekranlarning umumiy sarlavhasi.
   Home'dagi katta brend sarlavhasi bundan tashqari (components/ui.tsx > Header). ---------- */

/* Pastki tab ekranlarida (Home/Cart/Orders/Profile/History) native "orqaga"
   yopiq turadi: tab almashinuvi tarix yozuvini ALMASHTIRADI (replace), shu
   sababli Telegram orqaga tugmasi tab orasida sakramaydi. Ichki sahifalarda
   (mahsulot, checkout va h.k.) push bo'ladi va orqaga ko'rinadi. */
export const TAB_PATHS = ['/', '/cart', '/orders', '/profile', '/history']

export function WhaleMark({ size = 40 }: { size?: number }) {
  return <BrandLogo size={size} />
}

function hiName(t: any, user: { name?: string } | null) {
  let h = 12
  try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent' }).format(new Date())) } catch {}
  const g = h >= 5 && h < 12 ? t.greetMorning : h < 18 ? t.greetDay : t.greetEvening
  return `${g}, ${user?.name || tgUser()?.first_name || t.greetGuest}!`
}

export function TopBar({ title, right, flat }: { title?: string; right?: React.ReactNode; flat?: boolean }) {
  const { t, user } = useStore()
  const loc = useLocation()
  useNativeBack(!!title && !TAB_PATHS.includes(loc.pathname))
  const inner = (
    <div className="text-[var(--ink)] border-b border-[var(--line)]">
      <div className="max-w-[1240px] mx-auto flex items-center gap-2 px-4 lg:px-6 py-2">
        {title ? (
          <>
            <div className="w-10 shrink-0" aria-hidden="true" />
            <div className="text-[16px] font-extrabold flex-1 text-center truncate">{title}</div>
          </>
        ) : (
          <>
            <WhaleMark />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[12.5px] font-semibold text-[var(--mut2)] leading-tight truncate">{hiName(t, user)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
  if (flat) return inner
  return <header className="sticky top-0 z-30 tk-topbar-blue" style={{ paddingTop: 'calc(6px + var(--sat))' }}>{inner}</header>
}
