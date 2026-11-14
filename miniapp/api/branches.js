// GET /api/branches — filiallar va fulfillment sozlamalari (ochiq endpoint:
// faqat tasdiqlangan biznes faktlari, shaxsiy ma'lumot yo'q).
import pg from 'pg'
import { cors } from './_verify.js'
import { BRANCHES, pickupCfgFrom, deliveryCfgFrom, readSettings } from './_fulfillment.js'

let pool
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })
  }
  return pool
}

export default async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ ok: false })
  let pickup_cfg = null
  let delivery = deliveryCfgFrom({}, process.env)
  try {
    const P = getPool()
    if (P) {
      const s = await readSettings(P)
      pickup_cfg = pickupCfgFrom(s)
      delivery = deliveryCfgFrom(s, process.env)
    }
  } catch { /* DB yo'q: tasdiqlangan faktlar qoladi */ }
  return res.status(200).json({ ok: true, branches: BRANCHES, pickup_cfg, delivery })
}
