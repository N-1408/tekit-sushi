import { cors } from './_verify.js';
const HEADERS = {
  'User-Agent': 'TekitSushiMiniApp/1.0 (contact: gigand.group@gmail.com)',
  'Accept-Language': 'uz,ru,en',
}
export default async function handler(req, res) {
  const q = String(req.query.q || '').trim()
  if (q.length >= 3) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=uz&accept-language=uz,ru,en&viewbox=69.05,41.48,69.55,41.15&q=${encodeURIComponent(q)}`
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(7000) })
      if (!r.ok) return res.status(200).json({ ok: true, results: [] })
      const j = await r.json()
      const results = (Array.isArray(j) ? j : []).slice(0, 5).map(x => ({
        label: String(x.display_name || ''), lat: Number(x.lat), lon: Number(x.lon),
      })).filter(x => x.label && isFinite(x.lat))
      cors(res, 'GET, OPTIONS')
      return res.status(200).json({ ok: true, results })
    } catch {
      return res.status(200).json({ ok: true, results: [] })
    }
  }
  const lat = Number(req.query.lat)
  const lon = Number(req.query.lon)
  if (!isFinite(lat) || !isFinite(lon)) return res.status(400).json({ ok: false })
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18`,
      { headers: HEADERS, signal: AbortSignal.timeout(7000) }
    )
    if (!r.ok) return res.status(200).json({ ok: false })
    const j = await r.json()
    const a = j?.address || {}
    const road = a.house_number ? `${a.road || a.pedestrian || ''} ${a.house_number}`.trim() : (a.road || a.pedestrian || '')
    const area = a.city_district || a.suburb || a.neighbourhood || a.quarter || ''
    const city = a.city || a.town || a.village || a.municipality || ''
    const parts = [area, road, city].filter(Boolean)
    cors(res, 'GET, OPTIONS')
    res.setHeader('Cache-Control', 'public, max-age=600')
    return res.status(200).json({ ok: parts.length > 0, addr: parts.join(', ') })
  } catch {
    return res.status(200).json({ ok: false })
  }
}
