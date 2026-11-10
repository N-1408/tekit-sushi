import { Pool } from 'pg';
import crypto from 'crypto';
import { cors, rateLimit, verifyInitData, failGuard, recordFail } from './_verify.js';
let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
let ensured;
async function ensureSchema() {
  if (!ensured) {
    ensured = getPool().query(`CREATE TABLE IF NOT EXISTS menu_imgs (
      id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz DEFAULT now())`)
      .then(() => true).catch(() => false);
  }
  return ensured;
}
async function isAdmin(req) {
  const key = req.headers['x-admin-key'] || '';
  if (key) {
    if (failGuard(req, 'pw')) return false;
    if (key === process.env.ADMIN_PASSWORD) return true;
    recordFail(req, 'pw');
    return false;
  }
  const u = verifyInitData(req.headers['x-init-data']);
  if (!u) return false;
  try {
    const r = await getPool().query('SELECT role FROM bot_users WHERE tg_id=$1', [u.id]);
    return r.rows[0]?.role === 'admin';
  } catch { return false; }
}
export default async function handler(req, res) {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!rateLimit(req, 'upl', 10, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'Juda ko\u02bbp urinish' });
  if (!(await isAdmin(req))) return res.status(401).json({ ok: false, error: 'auth' });
  if (!await ensureSchema()) return res.status(500).json({ ok: false, error: 'DB xato' });
  try {
    const b = req.body || {};
    const m = String(b.data || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return res.status(400).json({ ok: false, error: 'Rasm formati noto\u02bbg\u02bbri' });
    const mime = m[1], buf = Buffer.from(m[2], 'base64');
    if (buf.length > 1024 * 1024) return res.status(400).json({ ok: false, error: 'Rasm juda katta' });
    const id = 'up_' + crypto.randomUUID();
    await getPool().query('INSERT INTO menu_imgs (id, mime, data) VALUES ($1,$2,$3)', [id, mime, buf]);
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
}
