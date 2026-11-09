import React from 'react'
import { useStore } from '../lib/store'
import type { Lang } from '../lib/i18n'
import { TopBar, Sheet } from '../components/ui'

const ROW_ICON: Record<string, React.ReactNode> = {
  branches: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>,
  contacts: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>,
  delivery: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="2.2" /><circle cx="18" cy="17" r="2.2" /><path d="M8 17h7.5M6.2 15 8 8h4l2 5 4.5 1.5M13 8l1-2h3" /></svg>,
  about: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.4" fill="currentColor" /></svg>,
}

export default function Profile() {
  const { t, lang, setLang, myOrders, favs } = useStore()
  const [sheet, setSheet] = React.useState<null | 'branches' | 'contacts' | 'delivery' | 'about'>(null)

  const rows = [
    { id: 'branches', label: t.pBranches },
    { id: 'contacts', label: t.pContacts },
    { id: 'delivery', label: t.pDeliveryPay },
    { id: 'about', label: t.pAbout },
  ] as const

  const infoRow = (k: string, v: React.ReactNode, sub?: boolean) => (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className={`text-[13.5px] font-semibold ${sub ? 'text-[#8A93B8]' : 'text-[#4A5270]'}`}>{k}</span>
      <span className="text-[13.5px] font-extrabold text-right">{v}</span>
    </div>
  )

  const sheetBody = () => {
    switch (sheet) {
      case 'branches':
        return (
          <div className="bg-white border border-navy-line rounded-[18px] p-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-navy-soft grid place-items-center text-[18px]">📍</span>
              <div>
                <div className="text-[14.5px] font-extrabold">{t.branchName}</div>
                <div className="text-[12px] font-semibold text-[#8A93B8] mt-0.5">{t.branchSoon}</div>
              </div>
            </div>
          </div>
        )
      case 'contacts':
        return (
          <div className="bg-white border border-navy-line rounded-[18px] px-4 divide-y divide-navy-line">
            <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center justify-between py-3.5">
              <span className="text-[13.5px] font-semibold text-[#4A5270]">{t.ctTg}</span>
              <span className="text-[13.5px] font-extrabold text-navy">{t.ctTgVal}</span>
            </a>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-[13.5px] font-semibold text-[#4A5270]">{t.ctPhone}</span>
              <span className="text-[13.5px] font-bold text-[#A2A9C6]">{t.ctSoon}</span>
            </div>
          </div>
        )
      case 'delivery':
        return (
          <div className="bg-white border border-navy-line rounded-[18px] px-4 py-1 divide-y divide-navy-line">
            {infoRow(t.dpDelivery, <span className="text-emerald-600">{t.dpFree}</span>)}
            {infoRow(t.dpTime, t.dpTimeVal)}
            {infoRow(t.dpPay, t.dpPayVal)}
            {infoRow(t.dpSoon, '', true)}
          </div>
        )
      case 'about':
        return <p className="text-[14px] leading-relaxed text-[#4A5270] font-medium bg-white border border-navy-line rounded-[18px] p-4">{t.aboutText}</p>
      default:
        return null
    }
  }

  const titles: Record<string, string> = { branches: t.pBranches, contacts: t.pContacts, delivery: t.pDeliveryPay, about: t.pAbout }

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

        <div className="mt-4 bg-white border border-navy-line rounded-[18px] overflow-hidden">
          {rows.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 && <div className="h-px bg-navy-line mx-4" />}
              <button onClick={() => setSheet(r.id)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3.5 active:bg-navy-soft transition-colors">
                <span className="text-[#8A93B8]">{ROW_ICON[r.id]}</span>
                <span className="text-[14.5px] font-bold flex-1">{r.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A2A9C6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-4 bg-white border border-navy-line rounded-[18px] p-1">
          {(['uz', 'ru', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`w-full text-left px-4 py-3 rounded-[14px] text-[14px] font-bold flex justify-between items-center active:bg-navy-soft ${lang === l ? 'text-navy' : 'text-[#4A5270]'}`}>
              {l === 'uz' ? '🇺🇿 Oʻzbekcha' : l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
              {lang === l && <span className="text-navy text-[15px]">✓</span>}
            </button>
          ))}
        </div>

        <div className="mt-3 bg-white border border-navy-line rounded-[18px] p-4 space-y-2.5">
          {[
            { k: t.tabOrders, v: String(myOrders.length) },
            { k: t.favTitle, v: String(favs.length) },
          ].map(r => (
            <div key={r.k} className="flex justify-between text-[13.5px] font-semibold">
              <span className="text-[#8A93B8]">{r.k}</span><span className="font-extrabold">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[11px] font-medium text-[#A2A9C6]">
          Tekit Sushi · v1.0
        </div>
      </div>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet ? titles[sheet] : ''}>
        {sheetBody()}
      </Sheet>
    </div>
  )
}
