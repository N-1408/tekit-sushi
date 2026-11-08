const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: 'DB sozlanmagan' });
  }

  try {
    await ensureSchema();
    const o = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!o || !o.items || !o.name || !o.phone) {
      return res.status(400).json({ ok: false, error: 'Kerakli maydonlar yetishmaydi' });
    }
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total, note, delivery_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, created_at`,
      [
        o.tg_user_id || null,
        String(o.name),
        String(o.phone),
        o.address || null,
        o.branch || null,
        o.delivery_type || 'delivery',
        o.payment || 'cash',
        JSON.stringify(o.items || []),
        Number(o.total) || 0,
        o.note ? String(o.note) : null,
        o.when ? String(o.when) : null,
      ]
    );
    const row = result.rows[0];
    return res.status(201).json({ ok: true, order_id: row.id, created_at: row.created_at });
  } catch (e) {
    console.error('order insert error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
