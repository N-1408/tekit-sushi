import pg from 'pg';
import { tgUserFrom, cors } from './_verify.js';
let pool = null;
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
/* GET  /api/me  → foydalanuvchi mavjudligi, roli va profili (serverdan).
 * POST /api/me  → profilni saqlash (onboarding yoki manzil o'zgarishi).
 * Mini ilova ochilishida darhol chaqiriladi: profil shu yerdan qaytadi,
 * kesh faqat UI holatini saqlaydi (ma'lumot — server). */
export default async (req, res) => {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false });
  const u = tgUserFrom(req);
  if (!u) return res.status(401).json({ ok: false });
  const id = u.id;
  const p = getPool();
  if (!p) return res.status(503).json({ ok: false });
  try {
    await p.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text, ADD COLUMN IF NOT EXISTS addr text, ADD COLUMN IF NOT EXISTS lat double precision, ADD COLUMN IF NOT EXISTS lon double precision');
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = String(b.name || '').trim().slice(0, 80) || (u.first_name || '');
      const phone = String(b.phone || '').trim().slice(0, 24) || null;
      const addr = String(b.addr || '').trim().slice(0, 300) || null;
      const lat = b.lat != null && Number.isFinite(Number(b.lat)) ? Number(b.lat) : null;
      const lon = b.lon != null && Number.isFinite(Number(b.lon)) ? Number(b.lon) : null;
      await p.query(
        `INSERT INTO bot_users (tg_id, name, username, lang, phone, addr, lat, lon)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (tg_id) DO UPDATE SET
           name = COALESCE(NULLIF(EXCLUDED.name, ''), bot_users.name),
           username = COALESCE(EXCLUDED.username, bot_users.username),
           lang = COALESCE(EXCLUDED.lang, bot_users.lang),
           phone = COALESCE(EXCLUDED.phone, bot_users.phone),
           addr = COALESCE(EXCLUDED.addr, bot_users.addr),
           lat = COALESCE(EXCLUDED.lat, bot_users.lat),
           lon = COALESCE(EXCLUDED.lon, bot_users.lon)`,
        [id, name, u.username || null, u.language_code || null, phone, addr, lat, lon]);
      return res.status(200).json({ ok: true });
    }
    /* GET: bot_users dan profil; bo'liq maydonlar oxirgi buyurtmadan to'ldiriladi */
    const r = await p.query('SELECT role, name, phone, addr, lat, lon FROM bot_users WHERE tg_id=$1', [id]);
    const row = r.rows[0] || null;
    let name = row?.name || u.first_name || '';
    let phone = row?.phone || '';
    let addr = row?.addr || '';
    let lat = row?.lat ?? null;
    let lon = row?.lon ?? null;
    if (!phone || !addr) {
      try {
        const o = await p.query('SELECT name, phone, address, lat, lon FROM orders WHERE tg_user_id=$1 ORDER BY id DESC LIMIT 1', [id]);
        const ord = o.rows[0];
        if (ord) {
          if (!phone && ord.phone) phone = ord.phone;
          if (!name && ord.name) name = ord.name;
          if (!addr && ord.address) { addr = ord.address; lat = ord.lat ?? lat; lon = ord.lon ?? lon; }
        }
      } catch { /* orders jadvali bo'lmasa jim o'tadi */ }
    }
    /* "mavjud" = ishlatiladigan profil bor (telefon yoki manzil); aks holda onboarding */
    const exists = !!(phone || addr);
    return res.status(200).json({ ok: true, exists, role: row?.role || null, user: { name, phone, addr, lat, lon } });
  } catch (e) {
    console.error('me error', e?.message);
    return res.status(500).json({ ok: false });
  }
};
