import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, pName, pImg } from '../lib/store'
import { fmt } from '../lib/money'
import { haptic } from '../lib/tg'
import { Qty, Empty, BigButton, SubBar} from '../components/ui'

export default function Cart() {
  const { t, lang, cart, setQty, clearCart, openP, myOrders, products, add } = useStore()
  const nav = useNavigate()
  const lines = cart.filter(l => l.q > 0)
  const sum = lines.reduce((s, l) => s + l.q * l.price, 0)

  return (
    <div className="pb-28">
      <SubBar title={t.tabCart} />
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
                  }} className="press py-2.5 rounded-xl bg-navy-soft text-navy text-[14.5px] font-bold">{t.repeatOrder}</button>
                ) : null}
              </div>
            } />
        </div>
      ) : (
        <>
          <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:gap-8 lg:items-start">
          <div className="px-4 mt-4 space-y-2.5 lg:flex-1 lg:min-w-0 lg:px-0">
            {lines.map(l => (
              <div key={l.id} className="flex gap-3 bg-white border border-navy-line rounded-[18px] p-2.5">
                <img src={pImg(l)} alt="" className="w-[68px] h-[68px] rounded-xl object-cover bg-navy-soft cursor-pointer"
                  onClick={() => { haptic(); openP(l) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold line-clamp-2">{pName(l, lang)}</div>
                  <div className="text-[13.5px] font-semibold text-[#8A93B8] mt-0.5">{l.weight}</div>
                  <div className="text-[15.5px] font-extrabold mt-1">{fmt(l.price * l.q)} <span className="text-[11.5px] text-[#8A93B8]">UZS</span></div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <button onClick={() => { setQty(l.id, 0); haptic('light') }} className="text-[#A2A9C6] active:text-red-500 p-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                  <Qty small q={l.q} onInc={() => { setQty(l.id, l.q + 1); haptic() }} onDec={() => { setQty(l.id, l.q - 1); haptic() }} />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:w-[380px] lg:shrink-0 lg:sticky lg:top-[92px] lg:px-4">
          <div className="mx-4 mt-4 bg-white border border-navy-line rounded-[18px] p-4 lg:mx-0 lg:mt-0">
            <div className="flex justify-between text-[15px] font-semibold text-[#4A5270]"><span>{t.subtotal}</span><span>{fmt(sum)} UZS</span></div>
            <div className="flex justify-between text-[15px] font-semibold text-[#4A5270] mt-2"><span>{t.delivery}</span><span className="text-emerald-600 font-bold">{t.free}</span></div>
            <div className="h-px bg-navy-line my-3" />
            <div className="flex justify-between text-[18px] font-extrabold"><span>{t.total}</span><span>{fmt(sum)} UZS</span></div>
          </div>
          <div className="px-4 mt-4 flex flex-col gap-2.5 lg:px-0">
            <BigButton onClick={() => { haptic(); nav('/checkout') }}>{t.checkout} · {fmt(sum)}</BigButton>
            <button onClick={clearCart} className="text-[14.5px] font-bold text-[#8A93B8] py-2 active:text-red-500">{t.clearCart}</button>
          </div>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
