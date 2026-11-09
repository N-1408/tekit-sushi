import React from 'react'
import { useStore } from '../../lib/store'
import { AdminTopBar, Btn, Field, Toggle, inputCls, Modal, useAdmin } from './common'
import { haptic } from '../../lib/tg'

type Cat = any

const blank = { slug: '', emoji: '🍽', title_uz: '', title_ru: '', title_en: '', active: true, sale_active: false, sale_percent: 0 }

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

  const load = React.useCallback(() => {
    fetch('/api/admin?action=menu', { headers: a.h() })
      .then(r => r.ok ? r.json() : null).then(j => {
        if (!j?.ok) return
        setCats(j.cats || [])
        const m: Record<string, number> = {}
        for (const it of j.items || []) m[it.cat] = (m[it.cat] || 0) + 1
        setCounts(m)
      }).catch(() => {})
  }, [])
  React.useEffect(() => { load() }, [load])

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
      if (r.ok && j?.ok) { showToast(t.aSavedA); haptic('success'); setEdit(null); load() }
      else { showToast(j?.error || t.orderFail); haptic('error') }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  async function setSale(c: Cat, on: boolean, pct: number) {
    const r = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
      body: JSON.stringify({ action: 'aksiya', mode: 'cat', slug: c.slug, sale_active: on, sale_percent: pct }),
    })
    if (r.ok) { haptic('success'); load() } else { haptic('error') }
  }

  return (
    <div className="pb-28">
      <AdminTopBar title={t.aCatsM} back right={
        <button onClick={openNew} className="press h-9 rounded-full bg-navy text-white px-3.5 text-[12.5px] font-extrabold grid place-items-center active:scale-95 transition-transform">+ {t.aAddCat}</button>
      } />
      <div className="px-4 mt-3 space-y-2">
        {cats.map(c => (
          <article key={c.slug} className={`bg-white border border-navy-line rounded-[18px] p-3.5 flex items-center gap-3 ${!c.active ? 'opacity-55' : ''}`}>
            <div className="w-11 h-11 rounded-2xl bg-navy-soft grid place-items-center text-[20px] shrink-0">{c.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold leading-tight">{(c as any)['title_' + lang] || c.title_uz}</div>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[#8A93B8]">{counts[c.slug] || 0} {t.aCatItems}</span>
                {!c.active && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#ECEEF5] text-[#8A93B8]">{t.aHidden}</span>}
                {c.sale_active && c.sale_percent > 0 && <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600">🔥 −{c.sale_percent}%</span>}
              </div>
            </div>
            <button onClick={() => openEdit(c)} className="press w-9 h-9 rounded-xl bg-navy-soft grid place-items-center active:scale-90 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
            </button>
          </article>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? t.aAddCat : t.aEditCat}>
        <div className="space-y-3 max-h-[60dvh] overflow-y-auto pr-1">
          <div className="grid grid-cols-[64px_1fr] gap-3">
            <Field label={t.aEmojiF}><input value={f.emoji} onChange={e => set('emoji', e.target.value)} className={`${inputCls} text-center`} /></Field>
            <Field label={t.aNameF}><input value={f.title_uz} onChange={e => set('title_uz', e.target.value)} placeholder="O'zbekcha" className={inputCls} /></Field>
          </div>
          <Field label={t.aNameF + ' (RU / EN)'}>
            <input value={f.title_ru} onChange={e => set('title_ru', e.target.value)} placeholder="Русский" className={inputCls} />
            <input value={f.title_en} onChange={e => set('title_en', e.target.value)} placeholder="English" className={`${inputCls} mt-2`} />
          </Field>
          <div className="flex items-center justify-between bg-navy-soft/60 rounded-xl px-3.5 py-2.5">
            <span className="text-[13px] font-extrabold">{t.aActiveA}</span>
            <Toggle on={!!f.active} onChange={v => set('active', v)} />
          </div>
          <div className={`rounded-xl p-3.5 ${f.sale_active ? 'bg-red-50 border border-red-100' : 'bg-navy-soft/60'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-extrabold">🔥 {t.aCatSale}</div>
                <div className="text-[10.5px] font-semibold text-[#8A93B8]">{t.aAppliedAll}</div>
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
