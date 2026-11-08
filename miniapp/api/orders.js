const { Pool } = require('pg');
let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const tg = (req.query.tg_user_id || '').toString().trim();
  if (!tg || !/^\d+$/.test(tg)) return res.status(400).json({ ok: false, error: 'tg_user_id kerak' });
  try {
    const r = await getPool().query(
      `SELECT id, created_at, total, status, items, name, phone, address, delivery_type, payment
       FROM orders WHERE tg_user_id = $1 ORDER BY id DESC LIMIT 30`, [tg]);
    return res.status(200).json({ ok: true, orders: r.rows });
  } catch (e) {
    console.error('orders error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
