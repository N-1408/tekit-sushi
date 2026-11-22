import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, pImg, isSpicy } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, Btn, Toggle, useAdmin } from './common'
import { haptic } from '../../lib/tg'
import { IcChili } from '../../components/ui'

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
 const [q, setQ] = React.useState('')
 const [syncing, setSyncing] = React.useState(false)
 const [syncMsg, setSyncMsg] = React.useState('')
 const items: Item[] = a.data?.items || []
 const cats: Cat[] = a.data?.cats || []

 const catsWith = cats.filter(c => c.active || (items.filter(i => i.cat === c.slug).length > 0))
 const spicyCount = items.filter(it => isSpicy(it)).length
 const cur = catParam === 'spicy'
 ? 'spicy'
 : catParam && cats.some(c => c.slug === catParam) ? catParam : catsWith[0]?.slug
 let shown = catParam === 'spicy' ? items.filter(isSpicy) : items.filter(i => i.cat === cur)
 if (q.trim()) {
 const s = q.trim().toLowerCase()
 shown = items.filter(i => String(i.t_uz || '').toLowerCase().includes(s) || String(i.slug || '').includes(s))
 }
 const countIn = (slug: string) => items.filter(i => i.cat === slug).length

 async function doSync() {
  setSyncing(true); setSyncMsg('')
  try {
   const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'iiko_sync' }) })
   const j = await r.json()
   if (j.ok && Array.isArray(j.results)) {
    setSyncMsg(j.results.map((x: any) => `${x.name}: ${x.items} ta taom, ${x.modifierOptions} ta qo'shimcha`).join(' | '))
    a.refresh(); haptic()
   } else setSyncMsg('xato: ' + (j.error || r.status))
  } catch { setSyncMsg('xato: tarmoq') } finally { setSyncing(false) }
 }

 async function toggleItem(it: Item) {
 a.update({ items: items.map(x => x.id === it.id ? { ...x, active: !x.active } : x) })
 const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'menu_toggle', id: it.id }) })
 if (!r.ok) { a.refresh(); haptic('error') } else haptic()
 }

 return (
 <div className="pb-28">
 <AdminTopBar title={t.aMenuM} right={
 <div className="flex gap-2">
 <button onClick={doSync} disabled={syncing} className="press h-9 rounded-full bg-[var(--panel)] border border-navy-line px-3 text-[12.5px] font-extrabold grid place-items-center active:scale-95 transition-transform disabled:opacity-50">{syncing ? '…' : '⟳ iiko'}</button>
 <button onClick={() => nav('/admin/cats')} className="press w-9 h-9 rounded-full bg-[var(--panel)] border border-navy-line grid place-items-center text-[15px] active:scale-90 transition-transform">🗂</button>
 </div>
 } />
 <div className="px-4 mt-3">
 <input value={q} onChange={e => setQ(e.target.value)} placeholder={t.aSearchI}
 className="w-full bg-[var(--panel)] border border-navy-line rounded-2xl py-2.5 px-4 text-[13.5px] font-medium outline-none focus:border-[var(--btn)] placeholder:text-[var(--ink3)]" />
 </div>
 {syncMsg && <div className="mt-1 text-[11px] text-[var(--mut)] px-1">{syncMsg}</div>}
 {!q.trim() && (
 <div className="flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar">
 {catsWith.map(c => (
 <button key={c.slug} onClick={() => nav(`/admin/menu/${c.slug}`)}
 className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${cur === c.slug ? 'bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_6px_14px_-6px_rgba(15,30,154,.5)]' : 'bg-[var(--panel)] text-[var(--mut)] border border-navy-line'}`}>
 {(c as any)['title_' + lang] || c.title_uz} · {countIn(c.slug)}
 {c.sale_active && c.sale_percent > 0 && <span className="ml-1 text-[10px]">%</span>}
 </button>
 ))}
 {spicyCount > 0 && (
 <button onClick={() => nav('/admin/menu/spicy')}
 className={`press shrink-0 px-3.5 py-2 rounded-xl text-[12.5px] font-extrabold transition-all inline-flex items-center gap-1.5 ${cur === 'spicy' ? 'bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_6px_14px_-6px_rgba(15,30,154,.5)]' : 'bg-[var(--panel)] text-[var(--mut)] border border-navy-line'}`}>
 <IcChili s={13} /> {t.catNames.spicy} · {spicyCount}
 </button>
 )}
 </div>
 )}

 {!a.ready && items.length === 0 ? (
 <div className="px-4 mt-3 space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-[68px] rounded-[18px] bg-[var(--panel)] border border-navy-line animate-pulse" />)}</div>
 ) : shown.length === 0 ? (
 <div className="px-4 mt-10 text-center text-[14px] font-semibold text-[var(--mut)]">— {t.aNoItems} —</div>
 ) : (
 <div className="px-4 mt-3 space-y-2">
 {shown.map(it => {
 const onSale = it.sale_active && (it.sale_percent > 0 || (it.sale_price && it.sale_price < it.price))
 const eff = it.sale_active && it.sale_price > 0 && it.sale_price < it.price ? it.sale_price
 : it.sale_active && it.sale_percent > 0 ? Math.round(it.price * (100 - it.sale_percent) / 100 / 1000) * 1000
 : it.price
 return (
 <article key={it.id} className={`anim-up bg-[var(--panel)] border border-navy-line rounded-[18px] p-2.5 flex items-center gap-3 ${!it.active ? 'opacity-55' : ''}`}>
 <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
 <img src={pImg(it)} alt="" className="w-[52px] h-[52px] rounded-xl object-cover bg-navy-soft shrink-0" loading="lazy" />
 <div className="flex-1 min-w-0">
 <div className="text-[13.5px] font-extrabold leading-snug line-clamp-1">{it.t_uz}</div>
 <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
 <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md ${it.active ? 'a-ok' : 'bg-[var(--line2)] text-[var(--mut)]'}`}>
 {it.active ? t.aActiveA : t.aHidden}
 </span>
 {onSale && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md a-bad">🔥 {t.aSaleA}{it.sale_price > 0 && it.sale_price < it.price ? '' : ` −${it.sale_percent}%`}</span>}
 {it.hit && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-navy-soft text-navy-ink">{t.hit}</span>}
 {isSpicy(it) && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md a-warn inline-flex items-center gap-1"><IcChili s={11} />{t.catNames.spicy}</span>}
 </div>
 <div className="mt-0.5 text-[13px] font-extrabold">
 {fmt(eff)} <span className="text-[10px] text-[var(--mut)]">UZS</span>
 {onSale && <span className="ml-1.5 text-[11px] font-bold text-[var(--mut)] line-through">{fmt(it.price)}</span>}
 </div>
 </div>
 </div>
 <div className="flex flex-col gap-1.5 items-center">
 <Toggle on={!!it.active} onChange={() => toggleItem(it)} />
 </div>
 </article>
 )
 })}
 </div>
 )}
 </div>
 )
}
