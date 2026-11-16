f = 'src/screens/Checkout.tsx'
s = open(f, encoding='utf-8').read()

s = s.replace(
"import { TopBar, BigButton } from '../components/ui'",
"import { TopBar, BigButton, IcTruck } from '../components/ui'")

old = """  const dFee = mode === 'delivery' && sum < threshold ? (deliveryCfg?.fee ?? 15000) : 0
  const grand = sum - discount + dFee"""
new = """  // 200 000 so'mdan past buyurtma: narx Millennium/Noor API'dan avtomatik olinadi
  const [qFee, setQFee] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (mode !== 'delivery' || sum >= threshold) { setQFee(null); return }
    const tm = setTimeout(async () => {
      try {
        const r = await fetch(`/api/delivery-quote?subtotal=${sum}&address=${encodeURIComponent(addr)}`)
        const j = await r.json()
        setQFee(j?.ok ? (j.free ? 0 : Math.max(0, Math.round(Number(j.fee) || 0))) : (deliveryCfg?.fee ?? 15000))
      } catch { setQFee(deliveryCfg?.fee ?? 15000) }
    }, 400)
    return () => clearTimeout(tm)
  }, [sum, mode, addr, threshold])
  const dFee = mode === 'delivery' ? (sum >= threshold ? 0 : (qFee ?? deliveryCfg?.fee ?? 15000)) : 0
  const grand = sum - discount + dFee"""
assert old in s
s = s.replace(old, new)

old2 = """              {mode === 'delivery' && (
                <div className="flex justify-between text-[13.5px] font-semibold text-[var(--mut2)] mt-2"><span>{t.delivery}</span><span className={dFee > 0 ? 'font-bold' : 'text-emerald-600 font-bold'}>{dFee > 0 ? `${fmt(dFee)} UZS` : t.free}</span></div>
                {dFee > 0 && <div className="text-[11px] font-semibold text-[var(--mut2)] mt-1">{t.fdLeft.replace('{x}', fmt(threshold - sum))} · {t.fdTo}</div>}
              )}"""
new2 = """              {mode === 'delivery' && (
                <div className="mt-3 rounded-2xl bg-[var(--bg2)] px-3.5 py-3 border border-[var(--line)]">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--mut2)]"><IcTruck s={15} />{t.delivery}</span>
                    <span className={`text-[14px] font-extrabold ${dFee > 0 ? 'text-[var(--ink)]' : 'text-emerald-600'}`}>{dFee > 0 ? `${fmt(dFee)} UZS` : t.free}</span>
                  </div>
                  <div className="mt-2.5 h-[7px] rounded-full bg-[var(--line2)] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0A2194] to-[#29A8E0] transition-all duration-700" style={{ width: `${Math.round(Math.min(1, sum / threshold) * 100)}%` }} />
                  </div>
                  <div className={`mt-1.5 text-[11.5px] font-semibold ${dFee > 0 ? 'text-[var(--mut2)]' : 'text-emerald-600'}`}>{dFee > 0 ? `${t.fdLeft.replace('{x}', fmt(threshold - sum))} · ${t.fdTo}` : t.fdDone}</div>
                </div>
              )}"""
assert old2 in s
s = s.replace(old2, new2)

open(f, 'w', encoding='utf-8').write(s)
print('checkout patched')

# qty minus: IcX -> PhMinus (to'g'ri minus ko'rinishi)
f2 = 'src/components/ui.tsx'
s2 = open(f2, encoding='utf-8').read()
if 'PhMinus' not in s2:
    s2 = s2.replace('export const IcX =', 'export const IcMinus = ({ s = 14 }: { s?: number }) => <PhMinus size={s} weight="bold" />\nexport const IcX =', 1)
    s2 = s2.replace('<IcX s={14} />', '<IcMinus s={14} />', 1)
open(f2, 'w', encoding='utf-8').write(s2)
print('ui patched')
