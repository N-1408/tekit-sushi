// Yetkazib berish narxi so'rovi: 200 000 so'mdan past buyurtmalar uchun
// Millennium/Noor API'dan narx olinadi (env to'ldirilgach avtomatik).
// Yuqorida bepul. Qaytadi: { ok, free, fee, provider, source, threshold }
import { cors, rateLimit } from './_verify.js';
import { quoteDelivery } from './_delivery.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!rateLimit(req, 'dq', 30, 60 * 1000)) return res.status(429).json({ ok: false });

  const b = req.method === 'POST' ? (req.body || {}) : req.query;
  const subtotal = Math.max(0, Math.round(Number(b.subtotal) || 0));
  const address = String(b.address || '').slice(0, 300);
  const lat = Number(b.lat), lon = Number(b.lon);
  const payload = { address, subtotal };
  if (Number.isFinite(lat) && Number.isFinite(lon)) { payload.lat = lat; payload.lon = lon; }

  const threshold = Number(process.env.DELIVERY_FREE_THRESHOLD || 200000);
  if (subtotal >= threshold) return res.status(200).json({ ok: true, free: true, fee: 0, threshold });

  const q = await quoteDelivery(payload);
  const fee = Math.max(0, Math.round(Number(q.price) || 0));
  return res.status(200).json({ ok: true, free: false, fee, provider: q.provider, source: q.source, threshold });
}
