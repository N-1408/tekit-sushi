// To'lov adapter qatlami: PAYMENT_PROVIDER = manual | rhmt | payme
// Shartnoma kelsa faqat env o'zgaradi: RHMT_STORE_ID, RHMT_TOKEN, PAYME_MERCHANT_ID, PAYME_KEY
const APP_ORIGIN = process.env.APP_ORIGIN || '';

export async function createPayment(order) {
  const provider = (process.env.PAYMENT_PROVIDER || 'manual').trim().toLowerCase();
  if (provider === 'manual' || !provider) {
    // naqd pul / kartaga o'tkazish: tashqi API kerak emas
    return { provider: 'manual', status: 'pending' };
  }
  if (provider === 'rhmt') {
    // Rahmat PAY (open.rhmt.uz) shartnomadan keyin aniqlashtiriladi
    const url = process.env.RHMT_API_URL; // TODO shartnomadan
    if (!url || !process.env.RHMT_TOKEN) return { provider: 'rhmt', status: 'unconfigured' };
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RHMT_TOKEN}` },
        body: JSON.stringify({
          store_id: process.env.RHMT_STORE_ID,
          order_id: String(order.id),
          amount: order.total,
          callback_url: `${APP_ORIGIN}/api/webhook/payment`,
        }),
      });
      const j = await r.json().catch(() => ({}));
      return { provider: 'rhmt', status: r.ok ? 'pending' : 'error', pay_url: j.pay_url || j.payment_url || null, raw: j };
    } catch (e) {
      console.error('rhmt createPayment', e?.message);
      return { provider: 'rhmt', status: 'error' };
    }
  }
  if (provider === 'payme') {
    // TODO Payme merchant shartnomasi
    return { provider: 'payme', status: 'unconfigured' };
  }
  return { provider: 'manual', status: 'pending' };
}

// Webhook /api/webhook/payment dagi so'rovni tekshirish
export function checkPaymentWebhookSecret(secret) {
  const expected = process.env.PAYMENT_WEBHOOK_SECRET;
  return expected && secret === expected;
}
