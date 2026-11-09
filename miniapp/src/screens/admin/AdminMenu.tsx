import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pImg } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, Btn, Toggle, useAdmin } from './common'
import { haptic } from '../../lib/tg'

type Item = any
type Cat = any

export default function AdminMenu() {
  return <Body />
}

function Body() {
  const nav = useNavigate()
  const { t, lang } = useStore()
  const a = useAdmin()
  const { cat: catParam } = useParams()
  const items: Item[] = a.data?.items || []
  const cats: Cat[] = a.data?.cats || []

  const catsWith = cats.filter(c => c.active || (items.filter(i => i.cat === c.slug).length > 0))
  const cur = catParam && cats.some(c => c.slug === catParam) ? catParam : catsWith[0]?.slug
  let shown = items.filter(i => i.cat === cur)
  if (q.trim()) {
    const s = q.trim().toLowerCase()
    shown = items.filter(i => String(i.t_uz || '').toLowerCase().includes(s) || String(i.slug || '').includes(s))
  }
  const countIn = (slug: string) => items.filter(i => i.cat === slug).length

  async function toggleItem(it: Item) {
    a.update({ items: items.map(x => x.id === it.id ? { ...x, active: !x.active } : x) })
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'menu_toggle', id: it.id }) })
    if (!r.ok) { a.refresh(); haptic('error') } else haptic()
  }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aMenuM} right={
        <div className="flex gap-2">
          <button onClick={() => nav('/admin/cats')} className="press w-9 h-9 rounded-full bg-white border border-navy-line grid place-items-center text-[15px] active:scale-90 transition-transform">🗂</button>
          <button onClick={() => nav('/admin/menu/new')} className="press h-9 rounded-full bg-navy text-white px-3.5 text-[12.5px] font-extrabold grid place-items-center active:scale-95 transition-transform">+ {t.aAddItem}</button>
        </div>
      } />
      <div className="px-4 mt-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.aSearchI}
          className="w-full bg-white border border-navy-line rounded-2xl py-2.5 px-4 text-[13.5px] font-medium outline-none focus:border-navy placeholder:text-[#A2A9C6]" />
      </div>
      {!q.trim() && (
        <div className="flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar">
          {catsWith.map(c => (
            <button key={c.slug} onClick={() => nav(`/admin/menu/${c.slug}`)}
              className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${cur === c.slug ? 'bg-navy text-white shadow-[0_6px_14px_-6px_rgba(10,33,148,.5)]' : 'bg-white text-[#8A93B8] border border-navy-line'}`}>
              {c.emoji} {(c as any)['title_' + lang] || c.title_uz} {countIn(c.slug)}
              {c.sale_active && c.sale_percent > 0 && <span className="ml-1 text-[10px]">%</span>}
            </button>
          ))}
        </div>
      )}

      {!a.ready && items.length === 0 ? (
          <div className="px-4 mt-3 space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-[68px] rounded-[18px] bg-white border border-navy-line animate-pulse" />)}</div>
        ) : shown.length === 0 ? (
          <div className="px-4 mt-10 text-center text-[14px] font-semibold text-[#8A93B8]">— {t.aNoItems} —</div>
        ) : (
          <div className="px-4 mt-3 space-y-2">
            {shown.map(it => {
              const onSale = it.sale_active && (it.sale_percent > 0 || (it.sale_price && it.sale_price < it.price))
              const eff = it.sale_active && it.sale_price > 0 && it.sale_price < it.price ? it.sale_price
                : it.sale_active && it.sale_percent > 0 ? Math.round(it.price * (100 - it.sale_percent) / 100 / 1000) * 1000
                : it.price
              return (
                <article key={it.id} className={`anim-up bg-white border border-navy-line rounded-[18px] p-2.5 flex items-center gap-3 ${!it.active ? 'opacity-55' : ''}`}>
                  <button onClick={() => nav(`/admin/menu/edit/${it.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <img src={pImg(it)} alt="" className="w-[52px] h-[52px] rounded-xl object-cover bg-navy-soft shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-extrabold leading-snug line-clamp-1">{it.t_uz}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md ${it.active ? 'bg-emerald-100 text-emerald-700' : 'bg-[#ECEEF5] text-[#8A93B8]'}`}>
                          {it.active ? t.aActiveA : t.aHidden}
                        </span>
                        {onSale && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">🔥 {t.aSaleA}{it.sale_price > 0 && it.sale_price < it.price ? '' : ` −${it.sale_percent}%`}</span>}
                        {it.hit && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-navy-soft text-navy-ink">{t.hit}</span>}
                      </div>
                      <div className="mt-0.5 text-[13px] font-extrabold">
                        {fmt(eff)} <span className="text-[10px] text-[#8A93B8]">UZS</span>
                        {onSale && <span className="ml-1.5 text-[11px] font-bold text-[#8A93B8] line-through">{fmt(it.price)}</span>}
                      </div>
                    </div>
                  </button>
                  <div className="flex flex-col gap-1.5 items-center">
                    <Toggle on={!!it.active} onChange={() => toggleItem(it)} />
                    <button onClick={() => nav(`/admin/menu/edit/${it.id}`)} className="press w-8 h-8 rounded-lg bg-navy-soft grid place-items-center active:scale-90 transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
    </div>
  )
}
