import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { fmt } from '../../lib/money'
import { AdminTopBar, Btn, Field, Toggle, inputCls, Modal, useAdmin } from './common'
import { pImg } from '../../lib/store'
import { haptic } from '../../lib/tg'

type Item = any
type Cat = any

const blank = {
  id: '', slug: '', cat: 'set', price: 0, img: '',
  t_uz: '', t_ru: '', t_en: '', d_uz: '', d_ru: '', d_en: '',
  pcs: 0, weight: '', hit: false, active: true,
  sale_active: false, sale_percent: 0, sale_price: 0,
}

export default function AdminItemForm() {
  return <Body />
}

function Body() {
  const nav = useNavigate()
  const { t, showToast, lang } = useStore()
  const a = useAdmin()
  const { id } = useParams()
  const isNew = !id
  const [f, setF] = React.useState<any>({ ...blank, cat: id ? '' : 'set' })
  const [cats, setCats] = React.useState<Cat[]>([])
  const [busy, setBusy] = React.useState(false)
  const [loaded, setLoaded] = React.useState(!id)
  const [delOpen, setDelOpen] = React.useState(false)
  const [imgPreview, setImgPreview] = React.useState('')

  React.useEffect(() => {
    if (!a.ready) return
    fetch('/api/admin?action=menu', { headers: a.h() })
      .then(r => r.ok ? r.json() : null).then(j => {
        if (!j?.ok) return
        setCats((j.cats || []).filter((c: Cat) => c.active))
        if (id) {
          const it: Item | undefined = (j.items || []).find((x: Item) => x.id === id)
          if (it) setF({ ...blank, ...it, sale_price: it.sale_price || 0 })
        }
        setLoaded(true)
      }).catch(() => setLoaded(true))
  }, [id, a.ready])

  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }))

  const effPreview = (() => {
    if (!f.sale_active) return f.price
    if (f.sale_price > 0 && f.sale_price < f.price) return f.sale_price
    if (f.sale_percent > 0) return Math.round(f.price * (100 - f.sale_percent) / 100 / 1000) * 1000
    return f.price
  })()

  async function save() {
    if (busy) return
    setBusy(true)
    try {
      const r = await fetch('/api/admin', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() },
        body: JSON.stringify({ action: isNew ? 'menu_add' : 'menu_save', ...f }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) { showToast(t.aSavedA); haptic('success'); nav(`/admin/menu/${f.cat}`, { replace: true }) }
      else { showToast(j?.error || t.orderFail); haptic('error') }
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  async function del() {
    setBusy(true)
    try {
      const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h() }, body: JSON.stringify({ action: 'menu_del', id }) })
      const j = await r.json().catch(() => null)
      if (r.ok && j?.ok) { showToast(t.aDeletedA); haptic('medium'); nav(`/admin/menu/${f.cat}`, { replace: true }) }
      else showToast(j?.error || t.orderFail)
    } catch { showToast(t.orderFail) }
    setBusy(false)
  }

  if (!loaded) return <div className="pb-28"><AdminTopBar title={t.aEditItem} /><div className="px-4 mt-4 h-64 rounded-[20px] bg-white border border-navy-line animate-pulse" /></div>

  return (
    <div className="pb-32">
      <AdminTopBar title={isNew ? t.aAddItem : t.aEditItem} back />
      <div className="px-4 mt-4 space-y-3.5">
        <div className="bg-white border border-navy-line rounded-[20px] p-4 space-y-3">
          <div className="flex gap-3">
            <div className="w-[72px] h-[72px] rounded-2xl bg-navy-soft overflow-hidden shrink-0 grid place-items-center">
              {imgPreview || f.img ? <img src={imgPreview || pImg(f)} onError={() => setImgPreview('')} alt="" className="w-full h-full object-cover" /> : <span className="text-[22px]">🍣</span>}
            </div>
            <div className="flex-1">
              <Field label={t.aImageF}>
                <input value={f.img} onChange={e => { set('img', e.target.value); setImgPreview(/^https?:/i.test(e.target.value) ? e.target.value : '') }} placeholder="https://... yoki UUID" className={inputCls} />
              </Field>
            </div>
          </div>
          <Field label={t.aNameF}>
            <input value={f.t_uz} onChange={e => set('t_uz', e.target.value)} placeholder="O'zbekcha" className={inputCls} />
            <input value={f.t_ru} onChange={e => set('t_ru', e.target.value)} placeholder="Русский" className={`${inputCls} mt-2`} />
            <input value={f.t_en} onChange={e => set('t_en', e.target.value)} placeholder="English" className={`${inputCls} mt-2`} />
          </Field>
          <Field label={t.aDescF}>
            <textarea value={f.d_uz} onChange={e => set('d_uz', e.target.value)} rows={2} placeholder="O'zbekcha" className={inputCls} />
            <textarea value={f.d_ru} onChange={e => set('d_ru', e.target.value)} rows={2} placeholder="Русский" className={`${inputCls} mt-2`} />
            <textarea value={f.d_en} onChange={e => set('d_en', e.target.value)} rows={2} placeholder="English" className={`${inputCls} mt-2`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.aPriceF}>
              <input value={f.price || ''} onChange={e => set('price', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" className={inputCls} />
            </Field>
            <Field label={t.aPcsF}>
              <input value={f.pcs || ''} onChange={e => set('pcs', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.aWeightF}>
              <input value={f.weight || ''} onChange={e => set('weight', e.target.value)} placeholder="320 g" className={inputCls} />
            </Field>
            <Field label={t.aCategoryF}>
              <select value={f.cat} onChange={e => set('cat', e.target.value)} className={inputCls}>
                {cats.map(c => <option key={c.slug} value={c.slug}>{(c as any)['title_' + lang] || c.title_uz}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-between bg-navy-soft/60 rounded-xl px-3.5 py-2.5">
            <span className="text-[13px] font-extrabold">{t.aHitF}</span>
            <Toggle on={!!f.hit} onChange={v => set('hit', v)} />
          </div>
          <div className="flex items-center justify-between bg-navy-soft/60 rounded-xl px-3.5 py-2.5">
            <span className="text-[13px] font-extrabold">{t.aActiveA}</span>
            <Toggle on={!!f.active} onChange={v => set('active', v)} />
          </div>
        </div>

        <div className={`bg-white border rounded-[20px] p-4 space-y-3 ${f.sale_active ? 'border-red-200' : 'border-navy-line'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px]">🔥</span>
              <div>
                <div className="text-[13.5px] font-extrabold">{t.aSaleA}</div>
                <div className="text-[10.5px] font-semibold text-[#8A93B8]">{t.aSaleHint}</div>
              </div>
            </div>
            <Toggle on={!!f.sale_active} onChange={v => { set('sale_active', v); if (v && !f.sale_percent && !f.sale_price) set('sale_percent', 10) }} />
          </div>
          {f.sale_active && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.aSalePct}>
                  <input value={f.sale_percent || ''} onChange={e => set('sale_percent', Math.min(90, Number(e.target.value.replace(/\D/g, '')) || 0))} inputMode="numeric" className={inputCls} />
                </Field>
                <Field label={t.aSaleFixed}>
                  <input value={f.sale_price || ''} onChange={e => set('sale_price', Number(e.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" placeholder="—" className={inputCls} />
                </Field>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <span className="text-[12px] font-bold text-[#8A93B8] line-through">{fmt(f.price)}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E23B52" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                <span className="text-[15px] font-extrabold text-red-600">{fmt(effPreview)} UZS</span>
                {f.sale_percent > 0 && <span className="ml-auto text-[11px] font-extrabold bg-red-600 text-white rounded-lg px-2 py-0.5">−{f.sale_percent}%</span>}
              </div>
            </>
          )}
        </div>

        {!isNew && (
          <button onClick={() => setDelOpen(true)} className="press w-full py-3 rounded-2xl bg-white border border-red-200 text-red-600 text-[13.5px] font-extrabold active:scale-[.98] transition-transform">
            🗑 {t.aDelete}
          </button>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line px-4 pt-3" style={{ paddingBottom: 'calc(12px + var(--sab))' }}>
        <Btn onClick={save} disabled={busy || !f.t_uz || !f.price}>{busy ? '…' : t.aSave}</Btn>
      </div>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title={t.aDelete}>
        <div className="text-[13px] font-semibold text-[#4A5270]">"{f.t_uz}" — {t.aDeleteQ}</div>
        <div className="mt-3 flex gap-2">
          <Btn kind="ghost" onClick={() => setDelOpen(false)}>{t.aCloseX}</Btn>
          <Btn kind="danger" disabled={busy} onClick={del}>{t.aDelete}</Btn>
        </div>
      </Modal>
    </div>
  )
}
