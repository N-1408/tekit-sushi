import { Pool } from 'pg';

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
let ensured;
function ensureSchema() {
  if (!ensured) {
    ensured = getPool().query(
      `CREATE TABLE IF NOT EXISTS promos (code text PRIMARY KEY, percent int NOT NULL, active boolean NOT NULL DEFAULT true);
       INSERT INTO promos (code, percent) VALUES ('TEKIT10', 10) ON CONFLICT (code) DO NOTHING;`
    ).then(() => true).catch(e => { console.error('promo ensureSchema', e); return false; });
  }
  return ensured;
}

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, error: 'DB sozlanmagan' });
  const url = new URL(req.url, 'http://x');
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ ok: false, error: 'Kod yo\'q' });
  try {
    if (!await ensureSchema()) return res.status(500).json({ ok: false, error: 'Server xatosi' });
    const r = await getPool().query('SELECT percent FROM promos WHERE code=$1 AND active=true', [code]);
    if (r.rowCount === 0) return res.status(404).json({ ok: false, error: 'not_found' });
    return res.status(200).json({ ok: true, code, percent: r.rows[0].percent });
  } catch (e) {
    console.error('promo error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
