import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { Lang } from '../lib/i18n'
import { TopBar, IcPin, Sheet, IcClock, IcTruck, IcInfo, IcMail, IcLock, IcChevR } from '../components/ui'

const ROW_ICON: Record<string, React.ReactNode> = {
  branches: <IcPin s={21} />,
  contacts: <IcMail s={21} />,
  delivery: <IcTruck s={21} />,
  about: <IcInfo s={21} />,
}

export default function Profile() {
  const { t, lang, setLang, myOrders, favs, role, user, openOb } = useStore()
  const nav = useNavigate()
  const [sheet, setSheet] = React.useState<null | 'branches' | 'contacts' | 'delivery' | 'about'>(null)

  const rows = [
    { id: 'branches', label: t.pBranches },
    { id: 'contacts', label: t.pContacts },
    { id: 'delivery', label: t.pDeliveryPay },
    { id: 'about', label: t.pAbout },
  ] as const

  const infoRow = (k: string, v: React.ReactNode, sub?: boolean) => (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className={`text-[13.5px] font-semibold ${sub ? 'text-[var(--mut2)]' : 'text-[var(--mut2)]'}`}>{k}</span>
      <span className="text-[13.5px] font-extrabold text-right">{v}</span>
    </div>
  )

  const sheetBody = () => {
    switch (sheet) {
      case 'branches':
        return (
          <div className="bg-[var(--panel)] border border-navy-line rounded-[18px] p-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-navy-soft grid place-items-center text-[#29A8E0]"><IcPin /></span>
              <div>
                <div className="text-[14.5px] font-extrabold">{t.branchName}</div>
                <div className="text-[12px] font-semibold text-[var(--mut2)] mt-0.5">{t.branchSoon}</div>
              </div>
            </div>
          </div>
        )
      case 'contacts':
        return (
          <div className="bg-[var(--panel)] border border-navy-line rounded-[18px] px-4 divide-y divide-navy-line">
            <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center justify-between py-3.5">
              <span className="text-[13.5px] font-semibold text-[var(--mut2)]">{t.ctTg}</span>
              <span className="text-[13.5px] font-extrabold text-[#29A8E0]">{t.ctTgVal}</span>
            </a>
            <a href="tel:+998951550549" className="flex items-center justify-between py-3.5">
              <span className="text-[13.5px] font-semibold text-[var(--mut2)]">{t.ctPhone}</span>
              <span className="text-[13.5px] font-extrabold text-[#29A8E0]">{t.ctPhoneVal}</span>
            </a>
          </div>
        )
      case 'delivery':
        return (
          <div className="bg-[var(--panel)] border border-navy-line rounded-[18px] px-4 py-1 divide-y divide-navy-line">
            {infoRow(t.dpDelivery, <span className="text-emerald-600">{t.dpFree}</span>)}
            {infoRow(t.dpTime, t.dpTimeVal)}
            {infoRow(t.dpPay, t.dpPayVal)}
            {infoRow(t.dpSoon, '', true)}
          </div>
        )
      case 'about':
        return <p className="text-[14px] leading-relaxed text-[var(--mut2)] font-medium bg-[var(--panel)] border border-navy-line rounded-[18px] p-4">{t.aboutText}</p>
      default:
        return null
    }
  }

  const titles: Record<string, string> = { branches: t.pBranches, contacts: t.pContacts, delivery: t.pDeliveryPay, about: t.pAbout }

  return (
    <div className="pb-28">
      <TopBar title={t.tabProfile} back={false} />
      <div className="px-4 mt-4 lg:max-w-[760px] lg:mx-auto">
        <div className="tekit-pattern rounded-[22px] p-4 flex items-center gap-3.5 shadow-lg">
          <img src="/logo.png" className="w-14 h-14 rounded-2xl bg-white/20" alt="" />
          <div className="text-white flex-1">
            <div className="text-[16px] font-extrabold">{user?.name || t.brand}</div>
            <div className="text-[12px] text-white/75 font-medium">{user ? (user.phone || user.addr || t.brand) : t.guest}</div>
          </div>
          <button onClick={openOb} className="press bg-white/15 border border-white/25 text-white text-[12px] font-bold px-3.5 py-2 rounded-xl">
            {user ? t.obEdit : t.obReg}
          </button>
        </div>
        {user?.addr ? (
          <div className="mt-2.5 bg-[var(--panel)] border border-navy-line rounded-[18px] px-4 py-1">
            {infoRow(t.address, <span className="max-w-[210px]">{user.addr}</span>)}
          </div>
        ) : null}

        <button onClick={() => nav('/history')}
          className="mt-4 w-full bg-[var(--panel)] border border-navy-line rounded-[18px] px-4 py-3.5 flex items-center gap-3.5 active:bg-navy-soft transition-colors"
        >
          <span className="text-[var(--mut2)]">
            <IcClock s={21} />
          </span>
          <span className="text-[14.5px] font-bold flex-1 text-left">{t.historyTitle}</span>
          <span style={{ color: "var(--ink3)", display: "grid" }}><IcChevR s={16} /></span>
        </button>

        <div className="mt-2.5 bg-[var(--panel)] border border-navy-line rounded-[18px] overflow-hidden">
          {rows.map((r, i) => (
            <React.Fragment key={r.id}>
              {i > 0 && <div className="h-px bg-navy-line mx-4" />}
              <button onClick={() => setSheet(r.id)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3.5 active:bg-navy-soft transition-colors">
                <span className="text-[var(--mut2)]">{ROW_ICON[r.id]}</span>
                <span className="text-[14.5px] font-bold flex-1">{r.label}</span>
                <span style={{ color: "var(--ink3)", display: "grid" }}><IcChevR s={16} /></span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {role === 'admin' && (
          <button onClick={() => nav('/admin')}
            className="mt-3 w-full bg-[var(--panel)] border border-navy-line rounded-[18px] px-4 py-3.5 flex items-center gap-3.5 active:bg-navy-soft transition-colors">
            <span className="text-[var(--mut2)]">
              <IcLock s={21} />
            </span>
            <span className="text-[14.5px] font-bold flex-1 text-left">{t.admin}</span>
            <span style={{ color: "var(--ink3)", display: "grid" }}><IcChevR s={16} /></span>
          </button>
        )}

        <div className="mt-4 bg-[var(--panel)] border border-navy-line rounded-[18px] p-1">
          {(['uz', 'ru', 'en'] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`w-full text-left px-4 py-3 rounded-[14px] text-[14px] font-bold flex justify-between items-center active:bg-navy-soft ${lang === l ? 'text-navy' : 'text-[var(--mut2)]'}`}>
              {l === 'uz' ? '🇺🇿 Oʻzbekcha' : l === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
              {lang === l && <span className="text-[#29A8E0] text-[15px]">✓</span>}
            </button>
          ))}
        </div>

        <div className="mt-3 bg-[var(--panel)] border border-navy-line rounded-[18px] p-4 space-y-2.5">
          {[
            { k: t.tabOrders, v: String(myOrders.length) },
            { k: t.favTitle, v: String(favs.length) },
          ].map(r => (
            <div key={r.k} className="flex justify-between text-[13.5px] font-semibold">
              <span className="text-[var(--mut2)]">{r.k}</span><span className="font-extrabold">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[11px] font-medium text-[var(--mut2)]">
          Tekit Sushi · v1.0
        </div>
      </div>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet ? titles[sheet] : ''}>
        {sheetBody()}
      </Sheet>
    </div>
  )
}
