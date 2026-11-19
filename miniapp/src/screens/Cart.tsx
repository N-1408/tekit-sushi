import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg, isSpicy, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { TopBar, Qty, Empty, BigButton, IcX, IcStore, IcPlus, QtyStepper, SpicyBadge } from '../components/ui'
import { pickupSummary } from '../components/Fulfillment'

/* Savatdagi "qoshimcha qoshish" zonalari: faqat Souslar va Ichimliklar —
   gorizontal chip qatorlari, ro'yxatdan keyin, buyurtma tugmasidan oldin. */
function ExtraChip({ x, lang, t }: { x: Product; lang: any; t: any }) {
  const { cart, add, setQty } = useStore()
  const q = cart.find((l: any) => l.id === x.id)?.q ?? 0
  return (
    <div className="shrink-0 w-[128px] bg-[var(--panel)] border border-navy-line rounded-[14px] p-2 flex flex-col">
      <div className="relative aspect-square rounded-[10px] overflow-hidden bg-navy-soft">
        <img src={pImg(x)} alt={pName(x, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        {isSpicy(x) && <SpicyBadge size={18} className="absolute top-1.5 right-1.5" />}
      </div>
      <div className="text-[12px] font-bold leading-tight line-clamp-2 mt-1.5">{pName(x, lang)}</div>
      <div className="text-[12px] font-extrabold mt-0.5 whitespace-nowrap">{fmt(x.price)} <span className="text-[9.5px] font-bold text-[var(--mut2)]">UZS</span></div>
      {q > 0 ? (
        <div className="mt-auto pt-1.5">
          <QtyStepper size="sm" full q={q} min={0}
            onDec={() => { setQty(x.id, q - 1); haptic() }}
            onInc={() => { add(x.id); haptic('medium') }} />
        </div>
      ) : (
        <button onClick={() => { add(x.id); haptic('medium') }}
          className="press mt-1.5 h-[32px] rounded-[10px] bg-[var(--btn)] text-[var(--btn-ink)] text-[12px] font-extrabold flex items-center justify-center gap-1.5 active:scale-[.98] transition-transform">
          <IcPlus s={12} />{t.cardAdd}
        </button>
      )}
    </div>
  )
}

function ExtraSection({ title, items, lang, t }: { title: string; items: Product[]; lang: any; t: any }) {
  if (!items.length) return null
  return (
    <div>
      <div className="text-[15px] font-extrabold">{title}</div>
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {items.map(x => <ExtraChip key={x.id} x={x} lang={lang} t={t} />)}
      </div>
    </div>
  )
}

export default function Cart({ variant = 'page' }: { variant?: 'page' | 'panel' }) {
  const panel = variant === 'panel'
  const { t, lang, cart, setQty, clearCart, openP, myOrders, products, add, mode, pickup, ff, deliveryCfg } = useStore()
  const nav = useNavigate()
  /* Savatga kirganda doim tepadan boshlash */
  React.useEffect(() => { const el = document.scrollingElement || document.documentElement; el.scrollTop = 0 }, [])
  const lines = cart.filter(l => l.q > 0)
  const sum = lines.reduce((s, l) => s + l.q * l.price, 0)

  /* Qoshimchalar: faqat Souslar va Ichimliklar (doim), savatdagi narsalar
     takrorlanmaydi; boshqa kategoriyalar chiqmaydi. */
  const extras = React.useMemo(() => {
    const inCart = new Set(lines.map(l => l.id))
    const act = products.filter(x => x.active !== false && !inCart.has(x.id))
    return [
      { id: 'sous', title: t.catNames.sous as string, items: act.filter(x => x.cat === 'sous') },
      { id: 'ichimlik', title: t.catNames.ichimlik as string, items: act.filter(x => x.cat === 'ichimlik') },
    ]
  }, [lines, products, t])
  const hasExtras = extras.some(s => s.items.length > 0)

  return (
    <div className={panel ? 'pb-4' : 'tk-basket-tone bg-[var(--bg)] pb-[calc(194px+var(--sab))] lg:pb-28'} style={panel ? undefined : { minHeight: '100dvh' }}>
      {!panel && <TopBar title={t.tabCart} back={false} right={<div />} />}
      {/* Biriktirilgan buyurtma paneli: pastki navbar ustida doim ko'rinadi.
          Jami chapda, tugma o'ngda; mobil uchun (desktopda yon panel bor). */}
      {!panel && lines.length > 0 && (
        <div className="fixed inset-x-3.5 z-[39] lg:hidden flex items-center justify-between gap-3 rounded-[20px] bg-[var(--sheet)] border border-[var(--line2)] shadow-[0_16px_36px_-14px_rgba(0,0,0,.6)] p-2.5 pl-4"
          style={{ bottom: 'calc(94px + var(--sab))' }}>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-[var(--mut2)] leading-tight">{t.total}</div>
            <div className="text-[15.5px] font-extrabold tabular-nums whitespace-nowrap">
              {fmt(sum + (mode === 'delivery' ? (deliveryCfg?.fee || 0) : 0))} <span className="text-[10px] font-bold text-[var(--mut2)]">UZS</span>
            </div>
          </div>
          <button onClick={() => { haptic(); nav('/checkout') }}
            className="press shrink-0 h-[46px] px-5 rounded-[14px] bg-[var(--btn)] text-[var(--btn-ink)] text-[14.5px] font-extrabold active:scale-[.98] transition-transform">
            {t.checkout}
          </button>
        </div>
      )}
      {lines.length === 0 ? (
        <div className="px-4">
          <Empty emoji="🛒" title={t.cartEmpty} sub={t.cartEmptySub}
            action={
              <div className="flex flex-col gap-2.5 w-full">
                <BigButton onClick={() => nav('/')}>{t.toMenu}</BigButton>
                {myOrders[0]?.items?.length ? (
                  <button onClick={() => {
                    haptic()
                    for (const it of myOrders[0].items) { const p = products.find(x => x.id === it.id); if (p) add(it.id, it.q) }
                    nav('/')
                  }} className="press py-2.5 rounded-xl bg-navy-soft text-[var(--acc)] text-[13px] font-bold">{t.repeatOrder}</button>
                ) : null}
              </div>
            } />
        </div>
      ) : (
        <>
          <div className={panel ? '' : 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:gap-8 lg:items-start'}>
          <div className={panel ? 'px-4 mt-4 space-y-2.5' : 'px-4 mt-4 space-y-2.5 lg:flex-1 lg:min-w-0 lg:px-0'}>
            {lines.map(l => (
              <div key={l.id} className="flex gap-3 bg-[var(--panel)] border border-navy-line rounded-[18px] p-2.5">
                <img src={pImg(l)} alt="" className="w-[68px] h-[68px] rounded-xl object-cover bg-navy-soft cursor-pointer"
                  onClick={() => { haptic(); openP(l) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <div className="text-[14.5px] font-bold line-clamp-2 flex-1">{pName(l, lang)}</div>
                    {isSpicy(l) && <SpicyBadge size={18} className="mt-0.5" />}
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--mut2)] mt-0.5">{l.weight}</div>
                  <div className="text-[14px] font-extrabold mt-1">{fmt(l.price * l.q)} <span className="text-[10px] text-[var(--mut2)]">UZS</span></div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <button onClick={() => { setQty(l.id, 0); haptic('light') }} className="text-[var(--mut2)] active:text-red-500 p-1">
                    <IcX s={15} />
                  </button>
                  <Qty small min={0} q={l.q} onInc={() => { setQty(l.id, l.q + 1); haptic() }} onDec={() => { setQty(l.id, l.q - 1); haptic() }} />
                </div>
              </div>
            ))}
            {hasExtras && (
              <div className="mt-6 space-y-5">
                {extras.map(s => <ExtraSection key={s.id} title={s.title} items={s.items} lang={lang} t={t} />)}
              </div>
            )}
          </div>
          <div className={panel ? 'px-4 mt-4' : 'lg:w-[380px] lg:shrink-0 lg:sticky lg:top-4 lg:px-4'}>
          <div className={panel ? 'mt-4 bg-[var(--panel)] border border-navy-line rounded-[18px] p-4' : 'mx-4 mt-4 bg-[var(--panel)] border border-navy-line rounded-[18px] p-4 lg:mx-0 lg:mt-0'}>
            <div className="flex justify-between text-[13.5px] font-semibold text-[var(--mut2)]"><span>{t.subtotal}</span><span>{fmt(sum)} UZS</span></div>
            {mode === null ? null : mode === 'pickup' ? (
              <div className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--mut2)] mt-2">
                <IcStore s={15} />
                <span className="min-w-0 truncate">{pickup ? pickupSummary(t, pickup, ff.branches, lang) : t.pickBranch}</span>
              </div>
            ) : (
              <div className="flex justify-between text-[13.5px] font-semibold text-[var(--mut2)] mt-2"><span>{t.delivery}</span><span className={deliveryCfg?.fee > 0 ? 'text-[var(--ink)] font-bold' : 'text-emerald-600 font-bold'}>{deliveryCfg?.fee > 0 ? `${fmt(deliveryCfg.fee)} UZS` : t.free}</span></div>
            )}
            <div className="h-px bg-navy-line my-3" />
            <div className="flex justify-between text-[16px] font-extrabold"><span>{t.total}</span><span>{fmt(sum + (mode === 'delivery' ? (deliveryCfg?.fee || 0) : 0))} UZS</span></div>
          </div>
          <div className={panel ? 'px-4 mt-4 flex flex-col gap-2.5' : 'px-4 mt-4 flex flex-col gap-2.5 lg:px-0'}>
            <div className={panel ? '' : 'hidden lg:block'}><BigButton onClick={() => { haptic(); nav('/checkout') }}>{t.checkout} · {fmt(sum)}</BigButton></div>
            <button onClick={clearCart} className="text-[13px] font-bold text-[var(--mut2)] py-2 active:text-red-500">{t.clearCart}</button>
          </div>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
