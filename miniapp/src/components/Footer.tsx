import React from 'react'
import { useStore } from '../lib/store'
import { WhaleMark } from './ui'
import { Phone, Bike, Info } from '../lib/icons'

export function Footer() {
  const { t } = useStore()
  return (
    <footer className="mt-10 bg-navy-deep text-white">
      <div className="mx-auto max-w-[1020px] px-4 py-8 lg:py-10">
        <div className="grid gap-7 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <WhaleMark size={40} />
              <div>
                <div className="text-[15px] font-extrabold">{t.brand}</div>
                <div className="text-[11px] font-semibold text-white/60">{t.tagline}</div>
              </div>
            </div>
            <p className="mt-3 max-w-[280px] text-[12px] leading-relaxed text-white/65">{t.aboutText}</p>
          </div>
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-widest text-[#F5C84B]">{t.pDeliveryPay}</div>
            <div className="mt-3 space-y-2 text-[13px] font-semibold text-white/85">
              <div className="flex items-center gap-2"><Bike size={15} className="text-white/60" />{t.dpFree}</div>
              <div className="flex items-center gap-2"><Info size={15} className="text-white/60" />{t.dpTimeVal}</div>
              <div className="flex items-center gap-2"><Info size={15} className="text-white/60" />{t.dpPayVal}</div>
            </div>
          </div>
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-widest text-[#F5C84B]">{t.pContacts}</div>
            <div className="mt-3 space-y-2 text-[13px] font-semibold text-white/85">
              <a href="tel:+998951550549" className="flex items-center gap-2"><Phone size={15} className="text-white/60" />{t.ctPhoneVal}</a>
              <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                <span className="grid h-[15px] w-[15px] place-items-center rounded-full bg-white/15 text-[9px] font-extrabold">T</span>{t.ctTgVal}
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/12 pt-4 text-center text-[11px] font-semibold text-white/45">
          © {new Date().getFullYear()} {t.brand} · {t.footerRights}
        </div>
      </div>
    </footer>
  )
}
