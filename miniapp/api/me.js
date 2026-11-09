import pg from 'pg';
let pool = null;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const id = Number(req.query.tg_user_id || 0);
  if (!id) return res.status(400).json({ ok: false, error: 'tg_user_id' });
  const p = getPool();
  if (!p) return res.status(503).json({ ok: false });
  try {
    await p.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text');
    const r = await p.query('SELECT role FROM bot_users WHERE tg_id=$1', [id]);
    return res.status(200).json({ ok: true, role: r.rows[0]?.role || null });
  } catch (e) {
    console.error('me error', e?.message);
    return res.status(500).json({ ok: false });
  }
};
