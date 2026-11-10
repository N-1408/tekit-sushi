import { Pool } from 'pg';
import { cors, rateLimit } from './_verify.js';

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

let promoEnsured;
function ensurePromo() {
  if (!promoEnsured) {
    promoEnsured = getPool().query(
      `CREATE TABLE IF NOT EXISTS promos (code text PRIMARY KEY, percent int NOT NULL, active boolean NOT NULL DEFAULT true);
       INSERT INTO promos (code, percent) VALUES ('TEKIT10', 10) ON CONFLICT (code) DO NOTHING;`
    ).then(() => true).catch(e => { console.error('promo ensure', e); return false; });
  }
  return promoEnsured;
}

let ensured;
function ensureSchema() {
  if (!ensured) {
    ensured = getPool().query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS note text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount int DEFAULT 0;`
    ).then(() => true).catch(e => { console.error('ensureSchema', e); return false; });
  }
  return ensured;
}

export default async (req, res) => {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!rateLimit(req, 'order', 5, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'Juda ko\u02bbp urinish' });

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: 'DB sozlanmagan' });
  }

  try {
    await ensureSchema();
    const o = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!o || !o.items || !o.name || !o.phone) {
      return res.status(400).json({ ok: false, error: 'Kerakli maydonlar yetishmaydi' });
    }
    if (!Array.isArray(o.items) || o.items.length === 0 || o.items.length > 60) {
      return res.status(400).json({ ok: false, error: 'Buyurtma tarkibi noto\u02bbg\u02bbri' });
    }
    const cleanItems = o.items
      .filter(i => i && typeof i.id === 'string' && Number(i.q) > 0)
      .map(i => ({ id: String(i.id).slice(0, 40), q: Math.min(50, Math.round(Number(i.q))) }));
    if (!cleanItems.length) return res.status(400).json({ ok: false, error: 'Buyurtma tarkibi noto\u02bbg\u02bbri' });
    // Summani serverda menyudan hisoblaymiz, mijoz yuborgan summagi ishonmaymiz
    let serverSum = null;
    try {
      const ids = cleanItems.map(i => i.id);
      const pr = await getPool().query('SELECT id, price FROM menu_items WHERE id = ANY($1)', [ids]);
      const priceById = new Map(pr.rows.map(r => [r.id, Number(r.price)]));
      if (cleanItems.every(i => priceById.has(i.id))) {
        serverSum = cleanItems.reduce((s, i) => s + (priceById.get(i.id) || 0) * i.q, 0);
      }
    } catch (e) { console.error('price lookup', e?.message); }
    // promokodni server tomonda tekshiramiz (client total ishonchsiz)
    let promoCode = null, discount = 0;
    let total = Number(o.total) || 0;
    if (serverSum != null) total = serverSum;
    const code = String(o.promo || '').trim().toUpperCase();
    if (code && total > 0) {
      try {
        await ensurePromo();
        const pr = await getPool().query('SELECT percent FROM promos WHERE code=$1 AND active=true', [code]);
        if (pr.rowCount > 0) {
          promoCode = code;
          discount = Math.round(total * pr.rows[0].percent / 100);
        }
      } catch (pe) { console.error('promo check', pe); }
    }
    const finalTotal = Math.max(0, total - discount);
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total, note, delivery_time, promo_code, discount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, created_at`,
      [
        o.tg_user_id || null,
        String(o.name),
        String(o.phone),
        o.address || null,
        o.branch || null,
        o.delivery_type || 'delivery',
        o.payment || 'cash',
        JSON.stringify(o.items || []),
        finalTotal,
        o.note ? String(o.note) : null,
        o.when ? String(o.when) : null,
        promoCode,
        discount,
      ]
    );
    void 0;
    const row = result.rows[0];
    return res.status(201).json({ ok: true, order_id: row.id, created_at: row.created_at });
  } catch (e) {
    console.error('order insert error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
