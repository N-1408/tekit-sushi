import { Pool } from 'pg';
import { tgUserFrom, cors } from './_verify.js';
let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
export default async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const u = tgUserFrom(req);
  if (!u) return res.status(401).json({ ok: false, error: 'auth' });
  const tg = String(u.id);
  try {
    const r = await getPool().query(
      `SELECT id, created_at, total, grand_total, delivery_fee, discount, promo_code, status, items,
              name, phone, address, branch, delivery_type, delivery_time, payment, payment_status, status_note
       FROM orders WHERE tg_user_id = $1 ORDER BY id DESC LIMIT 30`, [tg]);
    return res.status(200).json({ ok: true, orders: r.rows });
  } catch (e) {
    console.error('orders error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
