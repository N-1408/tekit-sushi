import React from 'react'
import { useStore } from '../../lib/store'
import { AdminTopBar, Btn, Field, Toggle, inputCls, Modal, useAdmin } from './common'
import { haptic } from '../../lib/tg'

type Cat = any

const blank = { slug: '', title_uz: '', title_ru: '', title_en: '', active: true, sale_active: false, sale_percent: 0 }

export default function AdminCats() {
  return <Body />
}

function Body() {
  const { t, showToast, lang } = useStore()
  const a = useAdmin()
  const [cats, setCats] = React.useState<Cat[]>([])
  const [counts, setCounts] = React.useState<Record<string, number>>({})
  const [edit, setEdit] = React.useState<Cat | null>(null)
  const [isNew, setIsNew] = React.useState(false)
  const [f, setF] = React.useState<any>({ ...blank })
  const [busy, setBusy] = React.useState(false)
  const [del, setDel] = React.useState<Cat | null>(null)
  const [moveTo, setMoveTo] = React.useState('')
  const [delBusy, setDelBusy] = React.useState(false)

  React.useEffect(() => {
    if (!a.data) return
    setCats(a.data.cats || [])
    const m: Record<string, number> = {}
    for (const it of a.data.items || []) m[it.cat] = (m[it.cat] || 0) + 1
    setCounts(m)
  }, [a.data])

  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }))
  function openEdit(c: Cat) { setEdit(c); setIsNew(false); setF({ ...blank, ...c }) }
  function openNew() { setEdit({} as Cat); setIsNew(true); setF({ ...blank }) }

  async function save() {
    setBusy(true)
    try {
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify({ action: isNew ? 'cat_add' : 'cat_save', ...f }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) { showToast(t.aSavedA); haptic('success'); setEdit(null); a.refresh() }
      else { showToast(j?.error || t.orderFail); haptic('error') }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  async function setSale(c: Cat, on: boolean, pct: number) {
    const r = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
      body: JSON.stringify({ action: 'aksiya', mode: 'cat', slug: c.slug, sale_active: on, sale_percent: pct }),
    })
    if (r.ok) { haptic('success'); a.refresh() } else { haptic('error') }
  }

  async function move(c: Cat, dir: 'up' | 'down') {
    const r = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
      body: JSON.stringify({ action: 'cat_sort', slug: c.slug, dir }),
    })
    if (r.ok) { haptic(); a.refresh() } else { haptic('error') }
  }

  function askDelete(c: Cat) { setDel(c); setMoveTo('') }
  const delCount = (del && (counts[del.slug] || 0)) || 0

  async function doDelete() {
    if (!del) return
    setDelBusy(true)
    try {
      const body: any = { action: 'cat_del', slug: del.slug }
      if (delCount > 0) body.move_to = moveTo
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) { showToast(t.aCatDelOk); haptic('success'); setDel(null); a.refresh() }
      else { showToast(j?.error || t.orderFail); haptic('error') }
    } catch { showToast(t.orderFail) }
    setDelBusy(false)
  }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aCatsM} back right={
        <button onClick={openNew} className="press h-9 rounded-full bg-navy text-white px-3.5 text-[12.5px] font-extrabold grid place-items-center active:scale-95 transition-transform">+ {t.aAddCat}</button>
      } />
      <div className="px-4 mt-3 space-y-2">
        {cats.map((c, i) => (
          <article key={c.slug} className={`bg-white border border-navy-line rounded-[18px] p-3 flex items-center gap-2.5 ${!c.active ? 'opacity-55' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold leading-tight">{(c as any)['title_' + lang] || c.title_uz}</div>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[var(--mut)]">{counts[c.slug] || 0} {t.aCatItems}</span>
                {!c.active && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-[var(--line2)] text-[var(--mut)]">{t.aHidden}</span>}
                {c.sale_active && c.sale_percent > 0 && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">−{c.sale_percent}%</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => move(c, 'up')} disabled={i === 0} aria-label="up" className="press w-8 h-9 rounded-lg bg-navy-soft grid place-items-center active:scale-90 transition-transform disabled:opacity-35">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              <button onClick={() => move(c, 'down')} disabled={i === cats.length - 1} aria-label="down" className="press w-8 h-9 rounded-lg bg-navy-soft grid place-items-center active:scale-90 transition-transform disabled:opacity-35">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <button onClick={() => openEdit(c)} className="press w-9 h-9 rounded-xl bg-navy-soft grid place-items-center active:scale-90 transition-transform">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
              </button>
              <button onClick={() => askDelete(c)} className="press w-9 h-9 rounded-xl bg-red-50 grid place-items-center active:scale-90 transition-transform">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      <Modal open={!!del} onClose={() => setDel(null)} title={t.aCatDelT}>
        {delCount > 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[var(--mut3)] leading-snug">{t.aCatMoveN}</p>
            <Field label={t.aCategoryF}>
              <select value={moveTo} onChange={e => setMoveTo(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {cats.filter(x => x.slug !== del?.slug).map(x => (
                  <option key={x.slug} value={x.slug}>{(x as any)['title_' + lang] || x.title_uz} ({counts[x.slug] || 0})</option>
                ))}
              </select>
            </Field>
            <div className="mt-4"><Btn onClick={doDelete} disabled={delBusy || !moveTo}>{delBusy ? '…' : t.aCatMoveBtn}</Btn></div>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-semibold text-[var(--mut3)] leading-snug">{t.aCatDelQ}</p>
            <div className="mt-4"><Btn onClick={doDelete} disabled={delBusy}>{delBusy ? '…' : t.aDelete}</Btn></div>
          </div>
        )}
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? t.aAddCat : t.aEditCat}>
        <div className="space-y-3 max-h-[60dvh] overflow-y-auto pr-1">
          <Field label={t.aNameF}><input value={f.title_uz} onChange={e => set('title_uz', e.target.value)} placeholder="O'zbekcha" className={inputCls} /></Field>
          <Field label={t.aNameF + ' (RU / EN)'}>
            <input value={f.title_ru} onChange={e => set('title_ru', e.target.value)} placeholder="Русский" className={inputCls} />
            <input value={f.title_en} onChange={e => set('title_en', e.target.value)} placeholder="English" className={`${inputCls} mt-2`} />
          </Field>
          <div className="flex items-center justify-between bg-[var(--line)] rounded-xl px-3.5 py-2.5">
            <span className="text-[13px] font-extrabold">{t.aActiveA}</span>
            <Toggle on={!!f.active} onChange={v => set('active', v)} />
          </div>
          <div className={`rounded-xl p-3.5 ${f.sale_active ? 'bg-red-50 border border-red-100' : 'bg-[var(--line)]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-extrabold">{t.aCatSale}</div>
                <div className="text-[10.5px] font-semibold text-[var(--mut)]">{t.aAppliedAll}</div>
              </div>
              <Toggle on={!!f.sale_active} onChange={v => { set('sale_active', v); if (v && !f.sale_percent) set('sale_percent', 10) }} />
            </div>
            {f.sale_active && (
              <div className="mt-2.5">
                <Field label={t.aSalePct}>
                  <input value={f.sale_percent || ''} onChange={e => set('sale_percent', Math.min(90, Number(e.target.value.replace(/\D/g, '')) || 0))} inputMode="numeric" className={inputCls} />
                </Field>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Btn onClick={save} disabled={busy || !f.title_uz}>{busy ? '…' : t.aSave}</Btn>
        </div>
      </Modal>
    </div>
  )
}
