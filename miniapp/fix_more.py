# --- Checkout.tsx: yetkazib berish narxi ---
f = 'src/screens/Checkout.tsx'
s = open(f, encoding='utf-8').read()
def rep(s, old, new, log='ck'):
    if old not in s:
        print('FAIL', log, ':', old[:60].replace('\n','|')); return s
    return s.replace(old, new, 1)
s = rep(s, "refreshOrders, mode, setMode } = useStore()", "refreshOrders, mode, setMode, deliveryCfg } = useStore()")
s = rep(s, "  const discount = promoPct > 0 ? Math.round(sum * promoPct / 100) : 0",
        "  const discount = promoPct > 0 ? Math.round(sum * promoPct / 100) : 0\n"
        "  const threshold = deliveryCfg?.threshold || 200000\n"
        "  const dFee = mode === 'delivery' && sum < threshold ? (deliveryCfg?.fee ?? 15000) : 0\n"
        "  const grand = sum - discount + dFee")
s = rep(s, '''              <div className="flex justify-between text-[13.5px] font-semibold text-[var(--mut2)] mt-2"><span>{t.delivery}</span><span className="text-emerald-600 font-bold">{t.free}</span></div>''',
        '''              {mode === 'delivery' && (<>
                <div className="flex justify-between text-[13.5px] font-semibold text-[var(--mut2)] mt-2"><span>{t.delivery}</span><span className={dFee > 0 ? 'font-bold' : 'text-emerald-600 font-bold'}>{dFee > 0 ? `${fmt(dFee)} UZS` : t.free}</span></div>
                {dFee > 0 && <div className="text-[11px] font-semibold text-[var(--mut2)] mt-1">{t.fdLeft.replace('{x}', fmt(threshold - sum))} · {t.fdTo}</div>}
              </>)}''')
s = rep(s, '''<div className="flex justify-between text-[17px] font-extrabold"><span>{t.total}</span><span>{fmt(sum - discount)} UZS</span></div>''',
        '''<div className="flex justify-between text-[17px] font-extrabold"><span>{t.total}</span><span>{fmt(grand)} UZS</span></div>''')
s = rep(s, "`${t.confirmOrder} · ${fmt(sum - discount)}`", "`${t.confirmOrder} · ${fmt(grand)}`")
s = rep(s, "saveMyOrder({ oid: j.order_id, at: new Date().toISOString(), status: 'new', items, sum, mode, pay, addr: mode === 'delivery' ? addr : '', name, phone: '+998' + phoneD })",
        "saveMyOrder({ oid: j.order_id, at: new Date().toISOString(), status: 'new', items, sum: grand, mode, pay, addr: mode === 'delivery' ? addr : '', name, phone: '+998' + phoneD })")
open(f, 'w', encoding='utf-8').write(s)
print('checkout ok')

# --- i18n: yangi kalitlar ---
f = 'src/lib/i18n.ts'
s = open(f, encoding='utf-8').read()
import re
i_ru = s.index('  ru: {')
i_en = s.index('  en: {')
UZ = "    addrPick: 'Manzilni tanlang', fdLeft: 'Yana {x} so\\u02bbm', fdTo: 'bepul yetkazib berishgacha', fdDone: 'Yetkazib berish bepul!', fdDoneSub: '200 000 so\\u02bbmdan yuqori buyurtmalarda',\n"
RU = "    addrPick: 'Выберите адрес', fdLeft: 'Ещё {x} сум', fdTo: 'до бесплатной доставки', fdDone: 'Доставка бесплатно!', fdDoneSub: 'Для заказов от 200 000 сум',\n"
EN = "    addrPick: 'Choose address', fdLeft: '{x} more', fdTo: 'until free delivery', fdDone: 'Free delivery!', fdDoneSub: 'For orders over 200,000 UZS',\n"
def insert_after_citynote(sec, line):
    m = re.search(r'(    cityNote:.*\n)', sec)
    if not m: print('FAIL cityNote anchor'); return sec
    return sec[:m.end()] + line + sec[m.end():]
uz_sec = s[:i_ru]; ru_sec = s[i_ru:i_en]; en_sec = s[i_en:]
uz_sec = insert_after_citynote(uz_sec, UZ)
ru_sec = insert_after_citynote(ru_sec, RU)
en_sec = insert_after_citynote(en_sec, EN)
s = uz_sec + ru_sec + en_sec
open(f, 'w', encoding='utf-8').write(s)
print('i18n ok')

# --- api/_delivery.js: quoteDelivery ---
f = 'api/_delivery.js'
s = open(f, encoding='utf-8').read()
s += '''
// Yetkazib berish narxi: Millennium/Noor API so'rovi (shartnoma + env to'ldirilgach avtomatik ishlaydi).
// Shartnoma API shakli noma'lum bo'lgani uchun umumiy REST taxmin: POST <base>/quote {address, subtotal} -> {price}.
// Env bo'lmasa yoki xatolik bo'lsa: DELIVERY_FEE (standart 15000).
export async function quoteDelivery(payload) {
  const provider = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
  const url = provider === 'millennium' ? process.env.MILLENNIUM_API_URL : provider === 'noor' ? process.env.NOOR_API_URL : null;
  if (url) {
    try {
      const token = provider === 'millennium' ? process.env.MILLENNIUM_TOKEN : process.env.NOOR_TOKEN;
      const r = await fetch(String(url).replace(/\\/$/, '') + '/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        const price = Number(j.price ?? j.fee ?? j.amount ?? j.cost);
        if (price > 0) return { provider, price, source: 'api' };
      }
    } catch (e) { console.error('delivery quote', e?.message); }
  }
  return { provider, price: Number(process.env.DELIVERY_FEE || 15000), source: 'default' };
}
'''
open(f, 'w', encoding='utf-8').write(s)
print('delivery ok')

# --- api/order.js: yetkazib berish narxi hisoblash ---
f = 'api/order.js'
s = open(f, encoding='utf-8').read()
s = rep(s, "import { createDelivery } from './_delivery.js';", "import { createDelivery, quoteDelivery } from './_delivery.js';")
s = rep(s, "       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status text;",
        "       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status text;\n       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee int DEFAULT 0;")
s = rep(s, "    const finalTotal = Math.max(0, total - discount);",
        """    const finalTotal = Math.max(0, total - discount);
    // Yetkazib berish narxi: 200 000 so'mdan yuqorida bepul, pastida Millennium/Noor API (yoki standart narx)
    let deliveryFee = 0;
    if ((o.delivery_type || 'delivery') === 'delivery') {
      const threshold = Number(process.env.DELIVERY_FREE_THRESHOLD || 200000);
      if (finalTotal < threshold) {
        try {
          const q = await quoteDelivery({ address: o.address || '', subtotal: finalTotal });
          deliveryFee = Math.max(0, Math.round(Number(q.price) || 0));
        } catch (qe) { console.error('delivery quote', qe?.message); deliveryFee = Number(process.env.DELIVERY_FEE || 15000); }
      }
    }
    const grandTotal = finalTotal + deliveryFee;""")
s = rep(s, "       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id, created_at",
        "       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id, created_at")
s = rep(s, "       `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total, note, delivery_time, promo_code, discount, change_amount, payment_status, delivery_provider)",
        "       `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total, note, delivery_time, promo_code, discount, change_amount, payment_status, delivery_provider, delivery_fee)")
s = rep(s, "        (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase(),\n      ]",
        "        (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase(),\n        deliveryFee,\n      ]")
s = rep(s, "Jami: ${finalTotal.toLocaleString('ru-RU')} so'm",
        "Jami: ${grandTotal.toLocaleString('ru-RU')} so'm${deliveryFee ? `\\nYetkazib berish: ${deliveryFee.toLocaleString('ru-RU')} so'm` : ''}")
s = rep(s, "return res.status(201).json({ ok: true, order_id: row.id, created_at: row.created_at });",
        "return res.status(201).json({ ok: true, order_id: row.id, created_at: row.created_at, total: grandTotal, delivery_fee: deliveryFee });")
open(f, 'w', encoding='utf-8').write(s)
print('order ok')

# --- api/menu.js: delivery config qaytarish ---
f = 'api/menu.js'
s = open(f, encoding='utf-8').read()
m = re.search(r"json\(\{\s*ok: true,", s)
if not m:
    print('FAIL menu json')
else:
    s = s[:m.start()] + "json({ ok: true, delivery: { fee: Number(process.env.DELIVERY_FEE || 15000), threshold: Number(process.env.DELIVERY_FREE_THRESHOLD || 200000) }, " + s[m.end():]
    open(f, 'w', encoding='utf-8').write(s)
    print('menu ok')
