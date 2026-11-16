// GET /api/branches — filiallar va fulfillment sozlamalari (open endpoint:
// only confirmed business facts, no personal data).
// GET|POST /api/branches/quote — yetkazib berish narxi va qamrovi.
// Ported from web/api/branches.js (behavior-identical; delivery-quote stays a
// separate route here, no Vercel function cap on the VPS).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { rateLimit } from '../lib/security.js';
import { BRANCHES, deliveryCfgFrom, readSettings } from '../lib/settings.js';
import { quoteDelivery, cityOf, TASHKENT_RE } from '../lib/delivery.js';

export async function branchesHandler(_req: FastifyRequest, reply: FastifyReply) {
  let pickup_cfg: unknown = null;
  let delivery = deliveryCfgFrom({});
  try {
    const s = await readSettings();
    delivery = deliveryCfgFrom(s);
  } catch { /* no DB: confirmed facts stand */ }
  return reply.code(200).send({ ok: true, branches: BRANCHES, pickup_cfg, delivery });
}

// Yetkazib berish narxi va qamrov so'rovi.
// Narx: DELIVERY_FREE_THRESHOLD (200 000) dan yuqorida bepul; pastida
// Millennium/Noor API (env to'ldirilgach) yoki standart narx (DELIVERY_FEE).
// Qamrov: lat/lon berilsa shahar tekshiriladi — Toshkent bo'lmasa 'outside';
// aniqlab bo'lmasa 'unknown' (buyurtma bloklanmaydi, UI halol holat ko'rsatadi).
// ETA: settingsda delivery_eta_minutes kiritilmaguncha null qaytadi.
export async function quoteHandler(req: FastifyRequest, reply: FastifyReply) {
  if (!rateLimit(req, 'dq', 30, 60 * 1000)) return reply.code(429).send({ ok: false });
  const b = (req.body || req.query || {}) as Record<string, unknown>;
  const subtotal = Math.max(0, Math.round(Number(b.subtotal) || 0));
  const address = String(b.address || '').slice(0, 300);
  const lat = Number(b.lat), lon = Number(b.lon);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  let eta_minutes: number | null = null;
  try {
    eta_minutes = deliveryCfgFrom(await readSettings()).eta_minutes;
  } catch { /* DB yo'q — eta null qoladi */ }

  const threshold = Number(process.env.DELIVERY_FREE_THRESHOLD || 200000);
  if (subtotal >= threshold) {
    return reply.code(200).send({ ok: true, free: true, fee: 0, threshold, coverage: hasCoords ? 'ok' : 'unknown', eta_minutes });
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
  return reply.code(200).send({ ok: true, free: false, fee, provider: q.provider, source: q.source, threshold, coverage, eta_minutes });
}
