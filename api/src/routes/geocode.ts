// /api/geocode — ported from web/api/geocode.js. q= search or lat/lon
// reverse lookup via Nominatim, Tashkent viewbox, 5 results.
import type { FastifyRequest, FastifyReply } from 'fastify';

const HEADERS: Record<string, string> = {
  'User-Agent': 'TekitSushiMiniApp/1.0 (contact: gigand.group@gmail.com)',
  'Accept-Language': 'uz,ru,en',
};

export async function geocodeHandler(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Record<string, string | undefined>;
  const query = String(q.q || '').trim();
  if (query.length >= 3) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=uz&accept-language=uz,ru,en&viewbox=69.05,41.48,69.55,41.15&q=${encodeURIComponent(query)}`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(7000) });
      if (!r.ok) return reply.code(200).send({ ok: true, results: [] });
      const j = (await r.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
      const results = (Array.isArray(j) ? j : []).slice(0, 5).map((x) => ({
        label: String(x.display_name || ''), lat: Number(x.lat), lon: Number(x.lon),
      })).filter((x) => x.label && Number.isFinite(x.lat));
      return reply.code(200).send({ ok: true, results });
    } catch {
      return reply.code(200).send({ ok: true, results: [] });
    }
  }
  const lat = Number(q.lat);
  const lon = Number(q.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return reply.code(400).send({ ok: false });
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18`,
      { headers: HEADERS, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return reply.code(200).send({ ok: false });
    const j = (await r.json()) as { address?: Record<string, string> };
    const a = j?.address || {};
    const road = a.house_number ? `${a.road || a.pedestrian || ''} ${a.house_number}`.trim() : (a.road || a.pedestrian || '');
    const area = a.city_district || a.suburb || a.neighbourhood || a.quarter || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const parts = [area, road, city].filter(Boolean);
    reply.header('Cache-Control', 'public, max-age=600');
    return reply.code(200).send({ ok: parts.length > 0, addr: parts.join(', ') });
  } catch {
    return reply.code(200).send({ ok: false });
  }
}
