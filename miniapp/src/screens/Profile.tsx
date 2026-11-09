import React from 'react'
import { useStore } from '../lib/store'
import type { Lang } from '../lib/i18n'
import { TopBar } from '../components/ui'

export default function Profile() {
  const { t, lang, setLang, myOrders, favs } = useStore()
  const rows: { k: string; v: string }[] = [
    { k: t.tabOrders, v: String(myOrders.length) },
    { k: t.favTitle, v: String(favs.length) },
    { k: t.delivery, v: t.free },
  ]
  return (
    <div className="pb-28">
      <TopBar title={t.tabProfile} back={false} />
      <div className="px-4 mt-4">
        <div className="tekit-pattern rounded-[22px] p-4 flex items-center gap-3.5 shadow-lg">
          <img src="/logo.png" className="w-14 h-14 rounded-2xl bg-white/20" alt="" />
          <div className="text-white">
            <div className="text-[16px] font-extrabold">{t.brand}</div>
            <div className="text-[12px] text-white/75 font-medium">{t.guest}</div>
          </div>
        </div>

        <div className="mt-4 bg-white border border-navy-line rounded-[18px] p-1">
          {(['uz', 'ru', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`w-full text-left px-4 py-3.5 rounded-[14px] text-[14px] font-bold flex justify-between items-center active:bg-navy-soft ${lang === l ? 'text-navy' : 'text-[#4A5270]'}`}>
              {l === 'uz' ? '🇺🇿 Oʻzbekcha' : l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
              {lang === l && <span className="text-navy text-[15px]">✓</span>}
            </button>
          ))}
        </div>

        <div className="mt-3 bg-white border border-navy-line rounded-[18px] p-4 space-y-2.5">
          {rows.map(r => (
            <div key={r.k} className="flex justify-between text-[13.5px] font-semibold">
              <span className="text-[#8A93B8]">{r.k}</span><span className="font-extrabold">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[11px] font-medium text-[#A2A9C6]">
          Tekit Sushi · v1.0
        </div>
      </div>
    </div>
  )
}
