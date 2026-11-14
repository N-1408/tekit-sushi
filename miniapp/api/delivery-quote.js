// Yetkazib berish narxi va qamrov so'rovi.
// Narx: DELIVERY_FREE_THRESHOLD (200 000) dan yuqorida bepul; pastida
// Millennium/Noor API (env to'ldirilgach) yoki standart narx (DELIVERY_FEE).
// Qamrov: lat/lon berilsa shahar tekshiriladi — Toshkent bo'lmasa 'outside';
// aniqlab bo'lmasa 'unknown' (buyurtma bloklanmaydi, UI halol holat ko'rsatadi).
// ETA: settingsda delivery_eta_minutes kiritilmaguncha null qaytadi
// (0 yoki "darhol" sifatida ko'rsatilmaydi).
import { cors, rateLimit } from './_verify.js';
import { quoteDelivery, cityOf } from './_delivery.js';
import { deliveryCfgFrom, readSettings } from './_fulfillment.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!rateLimit(req, 'dq', 30, 60 * 1000)) return res.status(429).json({ ok: false });

  const b = req.method === 'POST' ? (req.body || {}) : req.query;
  const subtotal = Math.max(0, Math.round(Number(b.subtotal) || 0));
  const address = String(b.address || '').slice(0, 300);
  const lat = Number(b.lat), lon = Number(b.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  let eta_minutes = null;
  try {
    const P = (await import('pg')).default;
    if (process.env.DATABASE_URL) {
      const pool = new P.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
      eta_minutes = deliveryCfgFrom(await readSettings(pool), process.env).eta_minutes;
      await pool.end().catch(() => {});
    }
  } catch { /* DB yo'q — eta null qoladi */ }

  const threshold = Number(process.env.DELIVERY_FREE_THRESHOLD || 200000);
  if (subtotal >= threshold) {
    return res.status(200).json({ ok: true, free: true, fee: 0, threshold, coverage: hasCoords ? 'ok' : 'unknown', eta_minutes });
  }

  let coverage = 'unknown';
  if (hasCoords) {
    const city = await cityOf(lat, lon);
    if (city == null) coverage = 'unknown';
    else if (TASHKENT_RE.test(String(city).trim())) coverage = 'ok';
    else coverage = 'outside';
  }

  const q = await quoteDelivery({ address, subtotal, ...(hasCoords ? { lat, lon } : {}) });
  const fee = Math.max(0, Math.round(Number(q.price) || 0));
  return res.status(200).json({ ok: true, free: false, fee, provider: q.provider, source: q.source, threshold, coverage, eta_minutes });
}
