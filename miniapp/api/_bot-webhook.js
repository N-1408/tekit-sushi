// Bot webhook holati va qayta ulash (admin panel > Bot holati).
// BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET faqat serverda qoladi: javobda
// hech qanday sir qaytmaydi. Admin sessiyasi bilan himoyalangan — admin.js
// `type=bot-webhook` so'rovini shu yerga yo'naltiradi.
const TOKEN = () => process.env.BOT_TOKEN || '';
const SECRET = () => process.env.TELEGRAM_WEBHOOK_SECRET || '';

async function tg(method, params) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  return r.json();
}

/* Webhook manzili: shu deploy'ning o'zi (x-forwarded-host) — www.tekit.uz. */
function hookUrlFrom(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${host}/telegram/webhook`;
}

export async function handleBotWebhook(req, res, mode) {
  if (!TOKEN()) return res.status(503).json({ ok: false, error: 'BOT_TOKEN sozlanmagan' });
  if (!SECRET()) return res.status(503).json({ ok: false, error: 'TELEGRAM_WEBHOOK_SECRET sozlanmagan' });
  const want = hookUrlFrom(req);
  try {
    if (mode === 'fix') {
      /* Qayta ro'yxatdan o'tkazish: Telegram eski sirdan qolgan bo'lsa ham
         yangi secret_token bilan yozib chiqadi va webhook qayta yoqiladi. */
      const set = await tg('setWebhook', { url: want, secret_token: SECRET() });
      if (!set || !set.ok) return res.status(502).json({ ok: false, error: (set && set.description) || 'setWebhook xato' });
    }
    const info = await tg('getWebhookInfo');
    if (!info || !info.ok) return res.status(502).json({ ok: false, error: (info && info.description) || 'getWebhookInfo xato' });
    const r = info.result || {};
    return res.status(200).json({
      ok: true,
      fixed: mode === 'fix',
      url: r.url || '',
      wanted_url: want,
      url_ok: (r.url || '') === want,
      pending: typeof r.pending_update_count === 'number' ? r.pending_update_count : 0,
      last_error: r.last_error_message || '',
      last_error_at: r.last_error_date || null,
    });
  } catch (e) { console.error('bot-webhook:', e && e.message); return res.status(500).json({ ok: false, error: 'Server xatosi' }); }
}
