import { Pool } from 'pg';
import { createDelivery } from './_delivery.js';
import { notifyUser } from './_notify.js';
import { tgUserFrom, cors, failGuard, recordFail } from './_verify.js';
let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}
async function check(req) {
  const key = req.headers['x-admin-key'] || '';
  if (key) {
    if (failGuard(req, 'pw')) return false;
    if (key === process.env.ADMIN_PASSWORD) return true;
    recordFail(req, 'pw');
    return false;
  }
  const u = tgUserFrom(req);
  if (!u) return false;
  try {
    const r = await getPool().query('SELECT role FROM bot_users WHERE tg_id=$1', [u.id]);
    return r.rows[0]?.role === 'admin';
  } catch { return false; }
}

let ensured;
function ensureSchema() {
  if (!ensured) {
    ensured = getPool().query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS note text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_note text;
       CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL);
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_at timestamptz;
       CREATE TABLE IF NOT EXISTS menu_categories (
         slug text PRIMARY KEY, sort int DEFAULT 0,
         title_uz text, title_ru text, title_en text, emoji text,
         active boolean DEFAULT true, sale_active boolean DEFAULT false, sale_percent int DEFAULT 0);
       CREATE TABLE IF NOT EXISTS menu_items (
         id text PRIMARY KEY, slug text, cat text, price int DEFAULT 0, img text,
         t_uz text, t_ru text, t_en text, d_uz text, d_ru text, d_en text,
         pcs int DEFAULT 0, weight text, hit boolean DEFAULT false, active boolean DEFAULT true, sort int DEFAULT 0,
         sale_active boolean DEFAULT false, sale_percent int DEFAULT 0, sale_price int);
       ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS weight text;
       ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS kcal int;
       ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS protein int;
       ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS fat int;
       ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS carbs int;
       CREATE TABLE IF NOT EXISTS promos (code text PRIMARY KEY, percent int NOT NULL, active boolean NOT NULL DEFAULT true);`
    ).then(() => true).catch(e => { console.error('ensureSchema', e); ensured = undefined; return false; });
  }
  return ensured;
}

const ALLOWED_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['delivering', 'cancelled'],
  delivering: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

function str(v, max = 500) { const s = String(v ?? '').trim(); return s.slice(0, max); }
function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }
const nOrNull = (v) => { const n = num(v, 0); return n > 0 ? Math.round(n) : null }
function bool(v) { return v === true || v === 'true' || v === 1; }
function slugify(s) {
  return str(s, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

async function buildStats(P, days) {
  const [dayRows, statusRows, periodRows, prevRows, hourRows, dowRows, topItems, deliveryRows, paymentRows, cancelRows, reasonRows, custRows, promoRows, today, pending, menuCount] = await Promise.all([
    P.query(`SELECT (created_at AT TIME ZONE 'Asia/Tashkent')::date AS d,
                    count(*)::int AS n,
                    coalesce(sum(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0)::bigint AS revenue
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1 ORDER BY 1`, [Math.max(days, 2)]),
    P.query(`SELECT status, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1`, [days]),
    P.query(`SELECT count(*)::int AS n,
                    count(*) FILTER (WHERE status <> 'cancelled')::int AS nc,
                    coalesce(sum(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0)::bigint AS revenue
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))`, [days]),
    P.query(`SELECT count(*)::int AS n,
                    count(*) FILTER (WHERE status <> 'cancelled')::int AS nc,
                    coalesce(sum(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0)::bigint AS revenue
             FROM orders
             WHERE created_at >= (now() - ($2::int * interval '1 day')) AND created_at < (now() - ($1::int * interval '1 day'))`, [days, days * 2]),
    P.query(`SELECT EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Asia/Tashkent'))::int AS h, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1`, [days]),
    P.query(`SELECT EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Tashkent'))::int AS dow, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1`, [days]),
    P.query(`SELECT item->>'id' AS id, item->>'title' AS title,
                    sum((item->>'q')::int)::int AS qty,
                    sum((item->>'q')::int * (item->>'price')::int)::bigint AS revenue
             FROM orders, json_array_elements(items::json) AS item
             WHERE created_at >= (now() - ($1::int * interval '1 day')) AND status <> 'cancelled'
             GROUP BY 1, 2 ORDER BY qty DESC LIMIT 10`, [days]),
    P.query(`SELECT coalesce(delivery_type, 'delivery') AS k, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1`, [days]),
    P.query(`SELECT coalesce(payment, 'cash') AS k, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day'))
             GROUP BY 1`, [days]),
    P.query(`SELECT count(*)::int AS n,
                    coalesce(sum(total),0)::bigint AS revenue
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day')) AND status = 'cancelled'`, [days]),
    P.query(`SELECT coalesce(nullif(btrim(coalesce(status_note, '')), ''), '-') AS reason, count(*)::int AS n
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day')) AND status = 'cancelled'
             GROUP BY 1 ORDER BY 2 DESC LIMIT 5`, [days]),
    P.query(`SELECT max(name) AS name, phone, count(*)::int AS n,
                    coalesce(sum(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0)::bigint AS revenue
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day')) AND phone IS NOT NULL AND phone <> ''
             GROUP BY phone ORDER BY n DESC, revenue DESC LIMIT 5`, [days]),
    P.query(`SELECT promo_code AS code, count(*)::int AS n, coalesce(sum(discount),0)::bigint AS discount
             FROM orders
             WHERE created_at >= (now() - ($1::int * interval '1 day')) AND promo_code IS NOT NULL AND promo_code <> ''
             GROUP BY 1 ORDER BY n DESC LIMIT 5`, [days]),
    P.query(`SELECT count(*)::int AS n,
                    coalesce(sum(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END),0)::bigint AS revenue
             FROM orders
             WHERE (created_at AT TIME ZONE 'Asia/Tashkent')::date = (now() AT TIME ZONE 'Asia/Tashkent')::date`),
    P.query(`SELECT count(*)::int AS n FROM orders WHERE status = 'new'`),
    P.query(`SELECT count(*)::int AS n FROM menu_items WHERE active = true`),
  ])
  const pr = periodRows.rows[0] || {}
  const pv = prevRows.rows[0] || {}
  const canc = cancelRows.rows[0] || {}
  return {
    today: { orders: today.rows[0]?.n || 0, revenue: Number(today.rows[0]?.revenue || 0) },
    pending: pending.rows[0]?.n || 0,
    period: { orders: pr.n || 0, revenue: Number(pr.revenue || 0), nonCancelled: pr.nc || 0, prevOrders: pv.n || 0, prevNonCancelled: pv.nc || 0, prevRevenue: Number(pv.revenue || 0) },
    byStatus: statusRows.rows,
    days: dayRows.rows.map(r => ({ d: r.d, n: r.n, revenue: Number(r.revenue) })),
    hours: hourRows.rows.map(r => ({ h: r.h, n: r.n })),
    dows: dowRows.rows.map(r => ({ dow: r.dow, n: r.n })),
    topItems: topItems.rows.map(r => ({ id: r.id, title: r.title, qty: r.qty, revenue: Number(r.revenue) })),
    delivery: deliveryRows.rows.map(r => ({ k: r.k, n: r.n })),
    payment: paymentRows.rows.map(r => ({ k: r.k, n: r.n })),
    cancels: { n: canc.n || 0, revenue: Number(canc.revenue || 0), reasons: reasonRows.rows.map(r => ({ reason: r.reason, n: r.n })) },
    customers: custRows.rows.map(r => ({ name: r.name, phone: r.phone, n: r.n, revenue: Number(r.revenue) })),
    promos: promoRows.rows.map(r => ({ code: r.code, n: r.n, discount: Number(r.discount) })),
    menuCount: menuCount.rows[0]?.n || 0,
  }
}

export default async (req, res) => {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ ok: false, error: 'ADMIN_PASSWORD sozlanmagan' });

  const okSchema = await ensureSchema();
  if (!okSchema) return res.status(500).json({ ok: false, error: 'DB xato' });
  const P = getPool();

  if (req.method === 'GET') {
    if (!(await check(req))) return res.status(401).json({ ok: false, error: 'auth' });
    const action = str(req.query.action || 'orders', 20);
    try {
      if (action === 'bootstrap') {
        const [o, st, catsR, itemsR, promosR, riskR] = await Promise.all([
          P.query(`SELECT id, created_at, name, phone, address, branch, delivery_type, payment, total, status, status_note,
                          items, note, delivery_time, promo_code, discount
                   FROM orders ORDER BY id DESC LIMIT 300`),
          buildStats(P, 7),
          P.query(`SELECT * FROM menu_categories ORDER BY sort`),
          P.query(`SELECT * FROM menu_items ORDER BY sort, cat`),
          P.query(`SELECT code, percent, active FROM promos ORDER BY code`),
          P.query(`SELECT phone, count(*)::int AS cancels FROM orders WHERE status = 'cancelled' GROUP BY phone`),
        ]);
        return res.status(200).json({
          ok: true,
          orders: o.rows,
          stats: st,
          cats: catsR.rows,
          items: itemsR.rows,
          promos: promosR.rows,
          risk: Object.fromEntries(riskR.rows.map(r => [r.phone, r.cancels])),
        });
      }
      if (action === 'orders') {
        const r = await P.query(
          `SELECT id, created_at, name, phone, address, branch, delivery_type, payment, total, status, status_note,
                  items, note, delivery_time, promo_code, discount, change_amount
           FROM orders ORDER BY id DESC LIMIT 300`);
        const riskR = await P.query(`SELECT phone, count(*)::int AS cancels FROM orders WHERE status = 'cancelled' GROUP BY phone`);
        return res.status(200).json({ ok: true, orders: r.rows, risk: Object.fromEntries(riskR.rows.map(r => [r.phone, r.cancels])) });
      }
      if (action === 'stats') {
        const days = [1, 7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
        return res.status(200).json({ ok: true, ...(await buildStats(P, days)) });
      }
      if (action === 'menu') {
        const cats = (await P.query(`SELECT * FROM menu_categories ORDER BY sort`)).rows;
        const items = (await P.query(`SELECT * FROM menu_items ORDER BY sort, cat`)).rows;
        return res.status(200).json({ ok: true, cats, items });
      }
      if (action === 'settings') {
        const keys = ['pickup_prep_minutes', 'pickup_slot_minutes', 'pickup_days_ahead', 'delivery_eta_minutes'];
        const r = await P.query(`SELECT key, value FROM settings WHERE key = ANY($1)`, [keys]);
        const map = Object.fromEntries(r.rows.map(x => [x.key, x.value]));
        return res.status(200).json({ ok: true, settings: Object.fromEntries(keys.map(k => [k, map[k] ?? null])) });
      }
      if (action === 'promos') {
        const r = await P.query(`SELECT code, percent, active FROM promos ORDER BY code`);
        return res.status(200).json({ ok: true, promos: r.rows });
      }
      return res.status(400).json({ ok: false, error: 'action' });
    } catch (e) {
      console.error('admin get error', e);
      return res.status(500).json({ ok: false, error: 'Server xatosi' });
    }
  }

  if (req.method === 'POST') {
    if (!(await check(req))) return res.status(401).json({ ok: false, error: 'auth' });
    try {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const act = str(b.action, 24);

      // ---- fulfillment sozlamalari (olib ketish jadvali, ETA) ----
      if (act === 'settings') {
        const keys = ['pickup_prep_minutes', 'pickup_slot_minutes', 'pickup_days_ahead', 'delivery_eta_minutes'];
        const val = b.settings || {};
        for (const k of keys) {
          if (!(k in val)) continue;
          if (val[k] === null || val[k] === '') {
            await P.query('DELETE FROM settings WHERE key = $1', [k]);
          } else {
            const n = Number(val[k]);
            if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ ok: false, error: `noto'g'ri qiymat: ${k}` });
            await P.query(
              'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
              [k, String(Math.round(n))]);
          }
        }
        const r = await P.query(`SELECT key, value FROM settings WHERE key = ANY($1)`, [keys]);
        const map = Object.fromEntries(r.rows.map(x => [x.key, x.value]));
        return res.status(200).json({ ok: true, settings: Object.fromEntries(keys.map(k => [k, map[k] ?? null])) });
      }

      // ---- order status ----
      if (act === 'status') {
        const id = num(b.id, 0);
        const st = str(b.status, 20);
        if (!ALLOWED_TRANSITIONS[st] && !['new', 'confirmed', 'delivering', 'done', 'cancelled'].includes(st))
          return res.status(400).json({ ok: false, error: 'status' });
        const cur = await P.query('SELECT status FROM orders WHERE id = $1', [id]);
        if (!cur.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        const from = cur.rows[0].status || 'new';
        if (st !== from && !(ALLOWED_TRANSITIONS[from] || []).includes(st))
          return res.status(400).json({ ok: false, error: `o'tish mumkin emas: ${from} → ${st}` });
        const note = b.note ? str(b.note, 300) : null;
        const r = await P.query(
          'UPDATE orders SET status = $1, status_note = $2, status_at = now() WHERE id = $3 RETURNING id, status, payment, change_amount, delivery_provider',
          [st, note, id]);
        const o = r.rows[0];
        // Yetkazib berish provideri: tashqi API ulangan bo'lsa tasdiqlangach kuryer so'raladi
        const prov = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
        if (st === 'confirmed' && prov !== 'own') {
          try {
            const orow = (await P.query('SELECT id, name, phone, address, note, total, status_note FROM orders WHERE id=$1', [id])).rows[0];
            const d = await createDelivery(orow);
            if (d.provider !== 'own') {
              await P.query('UPDATE orders SET delivery_external_id=$1, delivery_status=$2 WHERE id=$3',
                [d.external_id ? String(d.external_id) : null, d.status, id]);
            }
          } catch (de) { console.error('delivery dispatch', de?.message); }
        }
        // Mijozga Telegram xabari (bepul)
        try {
          const u = (await P.query('SELECT tg_user_id, total FROM orders WHERE id=$1', [id])).rows[0];
          const msgs = {
            confirmed: `<b>Buyurtma #${id} tasdiqlandi</b> \u2764\uFE0F\nSushichimiz ishga tushdi, taxminan 45-60 daqiqada yetib boradi.`,
            delivering: `<b>Buyurtma #${id} yo\u02bblda</b> \ud83d\ude9a\nKuryer yetib borishiga oz qoldi.`,
            done: `<b>Buyurtma #${id} yetkazildi</b> \ud83c\udf63\nBuhor oling! Fikr-mulohazangizni kutamiz.`,
            cancelled: note ? `Buyurtma #${id} bekor qilindi. Sabab: ${note}` : `Buyurtma #${id} bekor qilindi.`,
          };
          if (u?.tg_user_id && msgs[st]) void notifyUser(u.tg_user_id, msgs[st]).catch(() => {});
        } catch (ne) { console.error('notify', ne?.message); }
        return res.status(200).json({ ok: true, order: r.rows[0] });
      }

      // ---- menu item ----
      if (act === 'menu_add' || act === 'menu_save') {
        const id = act === 'menu_add'
          ? (str(b.id, 40) || 'm' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36))
          : str(b.id, 40);
        if (!id) return res.status(400).json({ ok: false, error: 'id' });
        const cat = str(b.cat, 20);
        if (!cat) return res.status(400).json({ ok: false, error: 'kategoriya' });
        const title = str(b.t_uz, 120);
        if (!title) return res.status(400).json({ ok: false, error: 'nomi' });
        const price = num(b.price, 0);
        if (price <= 0) return res.status(400).json({ ok: false, error: 'narx' });
        const saleActive = bool(b.sale_active);
        const salePercent = Math.min(90, Math.max(0, num(b.sale_percent, 0)));
        const salePrice = num(b.sale_price, 0);
        if (saleActive && salePercent <= 0 && !(salePrice > 0 && salePrice < price))
          return res.status(400).json({ ok: false, error: 'aksiya foizi yoki narxi' });
        const slug = str(b.slug, 80) || slugify(title);
        const img = str(b.img, 300);
        const vals = {
          cat, slug, price: Math.round(price),
          img, t_uz: title,
          t_ru: str(b.t_ru, 120) || title, t_en: str(b.t_en, 120) || title,
          d_uz: str(b.d_uz, 600), d_ru: str(b.d_ru, 600), d_en: str(b.d_en, 600),
          pcs: Math.max(0, Math.round(num(b.pcs, 0))),
          weight: str(b.weight, 60) || null,
          kcal: nOrNull(b.kcal), protein: nOrNull(b.protein), fat: nOrNull(b.fat), carbs: nOrNull(b.carbs),
          hit: bool(b.hit), active: b.active === undefined ? true : bool(b.active),
          sale_active: saleActive, sale_percent: saleActive ? salePercent : 0,
          sale_price: saleActive && salePrice > 0 ? Math.round(salePrice) : null,
        };
        if (act === 'menu_add') {
          const ex = await P.query('SELECT 1 FROM menu_items WHERE id = $1', [id]);
          if (ex.rows.length) return res.status(400).json({ ok: false, error: 'id bor' });
          const sortRow = await P.query('SELECT coalesce(max(sort),0)+1 AS s FROM menu_items WHERE cat = $1', [cat]);
          await P.query(
            `INSERT INTO menu_items (id, slug, cat, price, img, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, weight, hit, active, sort, sale_active, sale_percent, sale_price, kcal, protein, fat, carbs)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
            [id, vals.slug, vals.cat, vals.price, vals.img, vals.t_uz, vals.t_ru, vals.t_en, vals.d_uz, vals.d_ru, vals.d_en,
             vals.pcs, vals.weight, vals.hit, vals.active, sortRow.rows[0].s, vals.sale_active, vals.sale_percent, vals.sale_price,
             vals.kcal, vals.protein, vals.fat, vals.carbs]);
        } else {
          const r = await P.query(
            `UPDATE menu_items SET slug=$2, cat=$3, price=$4, img=$5, t_uz=$6, t_ru=$7, t_en=$8,
                    d_uz=$9, d_ru=$10, d_en=$11, pcs=$12, weight=$13, hit=$14, active=$15,
                    sale_active=$16, sale_percent=$17, sale_price=$18, kcal=$19, protein=$20, fat=$21, carbs=$22
             WHERE id = $1 RETURNING id`,
            [id, vals.slug, vals.cat, vals.price, vals.img, vals.t_uz, vals.t_ru, vals.t_en, vals.d_uz, vals.d_ru, vals.d_en,
             vals.pcs, vals.weight, vals.hit, vals.active, vals.sale_active, vals.sale_percent, vals.sale_price,
             vals.kcal, vals.protein, vals.fat, vals.carbs]);
          if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        }
        return res.status(200).json({ ok: true, id });
      }

      if (act === 'menu_toggle') {
        const id = str(b.id, 40);
        const r = await P.query('UPDATE menu_items SET active = NOT active WHERE id = $1 RETURNING id, active', [id]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true, item: r.rows[0] });
      }

      if (act === 'menu_del') {
        const id = str(b.id, 40);
        const r = await P.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true });
      }

      // ---- aksiya: bir mahsulotga yoki butan kategoriyaga ----
      if (act === 'aksiya') {
        const mode = str(b.mode, 10); // 'item' | 'cat'
        const saleActive = bool(b.sale_active);
        const salePercent = Math.min(90, Math.max(0, num(b.sale_percent, 0)));
        const salePrice = num(b.sale_price, 0);
        if (saleActive && salePercent <= 0 && !(salePrice > 0))
          return res.status(400).json({ ok: false, error: 'foiz yoki narx' });
        if (mode === 'item') {
          const id = str(b.id, 40);
          const r = await P.query(
            'UPDATE menu_items SET sale_active=$2, sale_percent=$3, sale_price=$4 WHERE id=$1 RETURNING id',
            [id, saleActive, saleActive ? salePercent : 0, saleActive && salePrice > 0 ? Math.round(salePrice) : null]);
          if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        } else if (mode === 'cat') {
          const slug = str(b.slug, 20);
          const r = await P.query(
            'UPDATE menu_categories SET sale_active=$2, sale_percent=$3 WHERE slug=$1 RETURNING slug',
            [slug, saleActive, saleActive ? salePercent : 0]);
          if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        } else return res.status(400).json({ ok: false, error: 'mode' });
        return res.status(200).json({ ok: true });
      }

      // ---- category ----
      if (act === 'cat_add' || act === 'cat_save') {
        const slug = act === 'cat_add'
          ? (str(b.slug, 20) || slugify(b.title_uz).slice(0, 20))
          : str(b.slug, 20);
        if (!slug) return res.status(400).json({ ok: false, error: 'slug' });
        const title = str(b.title_uz, 60);
        if (!title) return res.status(400).json({ ok: false, error: 'nomi' });
        const emoji = str(b.emoji, 8) || '🍽';
        if (act === 'cat_add') {
          const ex = await P.query('SELECT 1 FROM menu_categories WHERE slug = $1', [slug]);
          if (ex.rows.length) return res.status(400).json({ ok: false, error: 'kategoriya bor' });
          const sortRow = await P.query('SELECT coalesce(max(sort),0)+1 AS s FROM menu_categories');
          await P.query(
            `INSERT INTO menu_categories (slug, sort, title_uz, title_ru, title_en, emoji)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [slug, sortRow.rows[0].s, title, str(b.title_ru, 60) || title, str(b.title_en, 60) || title, emoji]);
        } else {
          const r = await P.query(
            `UPDATE menu_categories SET title_uz=$2, title_ru=$3, title_en=$4, emoji=$5,
                    active = $6 WHERE slug=$1 RETURNING slug`,
            [slug, title, str(b.title_ru, 60) || title, str(b.title_en, 60) || title, emoji, b.active === undefined ? true : bool(b.active)]);
          if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        }
        return res.status(200).json({ ok: true, slug });
      }

      if (act === 'cat_del') {
        const slug = str(b.slug, 20);
        const moveTo = str(b.move_to, 20);
        const inCat = await P.query('SELECT count(*)::int AS n FROM menu_items WHERE cat = $1', [slug]);
        if (inCat.rows[0].n > 0) {
          if (!moveTo) return res.status(400).json({ ok: false, error: 'move-needed', items: inCat.rows[0].n });
          const tgt = await P.query('SELECT 1 FROM menu_categories WHERE slug = $1', [moveTo]);
          if (!tgt.rows.length) return res.status(400).json({ ok: false, error: 'maqsad kategoriya topilmadi' });
          await P.query('UPDATE menu_items SET cat = $2 WHERE cat = $1', [slug, moveTo]);
        }
        const r = await P.query('DELETE FROM menu_categories WHERE slug = $1 RETURNING slug', [slug]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true });
      }

      if (act === 'cat_sort') {
        const slug = str(b.slug, 20);
        const dir = b.dir === 'up' ? 'up' : 'down';
        const rows = (await P.query('SELECT slug, sort FROM menu_categories ORDER BY sort, slug')).rows;
        const i = rows.findIndex(x => x.slug === slug);
        if (i < 0) return res.status(404).json({ ok: false, error: 'topilmadi' });
        const j = dir === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= rows.length) return res.status(200).json({ ok: true });
        const A = rows[i], B = rows[j];
        const newA = (B.sort === A.sort) ? (dir === 'up' ? A.sort - 1 : A.sort + 1) : B.sort;
        await P.query('UPDATE menu_categories SET sort = $2 WHERE slug = $1', [A.slug, newA]);
        await P.query('UPDATE menu_categories SET sort = $2 WHERE slug = $1', [B.slug, A.sort]);
        return res.status(200).json({ ok: true });
      }

      // ---- promos ----
      if (act === 'promo_add') {
        const code = str(b.code, 30).toUpperCase().replace(/\s+/g, '');
        const percent = Math.min(90, Math.max(1, Math.round(num(b.percent, 0))));
        if (!code || percent <= 0) return res.status(400).json({ ok: false, error: 'kod yoki foiz' });
        const ex = await P.query('SELECT 1 FROM promos WHERE code = $1', [code]);
        if (ex.rows.length) return res.status(400).json({ ok: false, error: 'kod bor' });
        await P.query('INSERT INTO promos (code, percent, active) VALUES ($1,$2,true)', [code, percent]);
        return res.status(200).json({ ok: true, code });
      }
      if (act === 'promo_toggle') {
        const code = str(b.code, 30).toUpperCase();
        const r = await P.query('UPDATE promos SET active = NOT active WHERE code = $1 RETURNING code, active', [code]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true, promo: r.rows[0] });
      }
      if (act === 'promo_del') {
        const code = str(b.code, 30).toUpperCase();
        const r = await P.query('DELETE FROM promos WHERE code = $1 RETURNING code', [code]);
        if (!r.rows.length) return res.status(404).json({ ok: false, error: 'topilmadi' });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'action' });
    } catch (e) {
      console.error('admin post error', e);
      return res.status(500).json({ ok: false, error: 'Server xatosi' });
    }
  }

  return res.status(405).json({ ok: false });
};
