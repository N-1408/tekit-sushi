import { Pool } from 'pg';
let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
function check(req) {
  const key = req.headers['x-admin-key'] || '';
  return key && key === process.env.ADMIN_PASSWORD;
}
export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ ok: false, error: 'ADMIN_PASSWORD sozlanmagan' });

  let ensured;
  function ensureSchema() {
    if (!ensured) {
      ensured = getPool().query(
        `ALTER TABLE orders ADD COLUMN IF NOT EXISTS note text;
         ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time text;
         ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';`
      ).then(() => true).catch(e => { console.error('ensureSchema', e); return false; });
    }
    return ensured;
  }

  if (req.method === 'GET') {
    if (!check(req)) return res.status(401).json({ ok: false, error: 'auth' });
    try {
      await ensureSchema();
      const r = await getPool().query(
        `SELECT id, created_at, name, phone, address, branch, delivery_type, payment, total, status, items, note, delivery_time
         FROM orders ORDER BY id DESC LIMIT 200`);
      return res.status(200).json({ ok: true, orders: r.rows });
    } catch (e) {
      console.error('admin orders error', e);
      return res.status(500).json({ ok: false, error: 'Server xatosi' });
    }
  }

  if (req.method === 'POST') {
    if (!check(req)) return res.status(401).json({ ok: false, error: 'auth' });
    try {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (b.action === 'status') {
        const allowed = ['new', 'confirmed', 'delivering', 'done', 'cancelled'];
        if (!allowed.includes(b.status)) return res.status(400).json({ ok: false, error: 'status' });
        await ensureSchema();
        const r = await getPool().query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status', [b.status, Number(b.id)]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true, order: r.rows[0] });
      }
      return res.status(400).json({ ok: false, error: 'action' });
    } catch (e) {
      console.error('admin post error', e);
      return res.status(500).json({ ok: false, error: 'Server xatosi' });
    }
  }
  return res.status(405).json({ ok: false });
};
