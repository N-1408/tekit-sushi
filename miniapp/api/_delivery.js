// Yetkazib berish adapter qatlami: DELIVERY_PROVIDER = own | millennium | noor
// Millennium va Noor shartnomasidan keyin faqat env to'ldiriladi:
//   MILLENNIUM_API_URL, MILLENNIUM_TOKEN
//   NOOR_API_URL, NOOR_TOKEN
// API shakli shartnomada ko'rilgach moslashtiriladi (hozircha umumiy REST taxmin).

async function postProvider(base, token, payload) {
  const r = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, body: j };
}

export async function createDelivery(order) {
  const provider = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
  if (provider === 'own' || !provider) {
    // o'z kuryer: admin panelda status qo'l bilan ko'chadi
    return { provider: 'own', status: 'manual' };
  }
  const APP_ORIGIN = process.env.APP_ORIGIN || '';
  const payload = {
    external_id: String(order.id),
    address: order.address || '',
    phone: order.phone || '',
    name: order.name || '',
    note: order.note || '',
    comment: order.status_note || '',
    amount: order.total,
    callback_url: `${APP_ORIGIN}/api/webhook/delivery`,
  };
  try {
    if (provider === 'millennium') {
      if (!process.env.MILLENNIUM_API_URL || !process.env.MILLENNIUM_TOKEN)
        return { provider, status: 'unconfigured' };
      const r = await postProvider(process.env.MILLENNIUM_API_URL, process.env.MILLENNIUM_TOKEN, payload);
      return { provider, status: r.ok ? 'dispatched' : 'error', external_id: r.body.id || null, raw: r.body };
    }
    if (provider === 'noor') {
      if (!process.env.NOOR_API_URL || !process.env.NOOR_TOKEN)
        return { provider, status: 'unconfigured' };
      const r = await postProvider(process.env.NOOR_API_URL, process.env.NOOR_TOKEN, payload);
      return { provider, status: r.ok ? 'dispatched' : 'error', external_id: r.body.id || null, raw: r.body };
    }
  } catch (e) {
    console.error(`delivery ${provider}`, e?.message);
    return { provider, status: 'error' };
  }
  return { provider: 'own', status: 'manual' };
}

export function checkDeliveryWebhookSecret(secret) {
  const expected = process.env.DELIVERY_WEBHOOK_SECRET;
  return expected && secret === expected;
}

// Yetkazib berish narxi: Millennium/Noor API so'rovi (shartnoma + env to'ldirilgach avtomatik ishlaydi).
// Shartnoma API shakli noma'lum bo'lgani uchun umumiy REST taxmin: POST <base>/quote {address, subtotal} -> {price}.
// Env bo'lmasa yoki xatolik bo'lsa: DELIVERY_FEE (standart 15000).
export async function quoteDelivery(payload) {
  const provider = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
  const url = provider === 'millennium' ? process.env.MILLENNIUM_API_URL : provider === 'noor' ? process.env.NOOR_API_URL : null;
  if (url) {
    try {
      const token = provider === 'millennium' ? process.env.MILLENNIUM_TOKEN : process.env.NOOR_TOKEN;
      const r = await fetch(String(url).replace(/\/$/, '') + '/quote', {
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
