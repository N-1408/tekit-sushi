import { getPool } from './_db.js';import { cors } from './_verify.js';
let ensured;
async function ensureSchema() {
  if (!ensured) {
    ensured = getPool().query(`CREATE TABLE IF NOT EXISTS menu_imgs (
      id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz DEFAULT now())`)
      .then(() => true).catch(() => false);
  }
  return ensured;
}
export default async function handler(req, res) {
  cors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const id = String(req.query.id || '').slice(0, 60);
  if (!/^up_[a-z0-9-]+$/i.test(id)) return res.status(400).json({ ok: false });
  if (!await ensureSchema()) return res.status(500).json({ ok: false });
  try {
    const r = await getPool().query('SELECT mime, data FROM menu_imgs WHERE id=$1', [id]);
    if (!r.rowCount) return res.status(404).json({ ok: false });
    const row = r.rows[0];
    res.setHeader('Content-Type', row.mime || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(Buffer.from(row.data));
  } catch (e) {
    console.error('img error', e?.message);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
}
