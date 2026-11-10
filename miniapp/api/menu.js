import { Pool } from 'pg';
import { MENU_SEED } from './_menuSeed.js';
import { cors } from './_verify.js';

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}

const CAT_SEED = [
  { slug: 'hit', sort: 0, uz: 'Xitlar', ru: 'Хиты', en: 'Best sellers', emoji: '🔥' },
  { slug: 'set', sort: 1, uz: 'Setlar', ru: 'Сеты', en: 'Sets', emoji: '🍱' },
  { slug: 'roll', sort: 2, uz: 'Rollar', ru: 'Роллы', en: 'Rolls', emoji: '🍣' },
  { slug: 'sushi', sort: 3, uz: 'Sushi', ru: 'Суши', en: 'Sushi', emoji: '🍥' },
  { slug: 'salat', sort: 4, uz: 'Salatlar', ru: 'Салаты', en: 'Salads', emoji: '🥗' },
  { slug: 'sup', sort: 5, uz: 'Suplar', ru: 'Супы', en: 'Soups', emoji: '🍲' },
  { slug: 'issiq', sort: 6, uz: 'Issiq taomlar', ru: 'Горячее', en: 'Hot dishes', emoji: '🍛' },
  { slug: 'wok', sort: 7, uz: 'Wok', ru: 'Вок', en: 'Wok', emoji: '🍜' },
  { slug: 'bola', sort: 8, uz: 'Bolalar', ru: 'Детям', en: 'For kids', emoji: '🧸' },
  { slug: 'desert', sort: 9, uz: 'Desertlar', ru: 'Десерты', en: 'Desserts', emoji: '🍰' },
  { slug: 'garnir', sort: 10, uz: 'Garnirlar', ru: 'Гарниры', en: 'Sides', emoji: '🍚' },
  { slug: 'ichimlik', sort: 11, uz: 'Ichimliklar', ru: 'Напитки', en: 'Drinks', emoji: '🥤' },
  { slug: 'sous', sort: 12, uz: 'Souslar', ru: 'Соусы', en: 'Sauces', emoji: '🥫' },
];

let ensured;
function ensureSchema() {
  if (!ensured) {
    ensured = (async () => {
      const p = getPool();
      await p.query(`CREATE TABLE IF NOT EXISTS menu_categories (
        slug text PRIMARY KEY, sort int DEFAULT 0,
        title_uz text, title_ru text, title_en text, emoji text,
        active boolean DEFAULT true, sale_active boolean DEFAULT false, sale_percent int DEFAULT 0)`);
      await p.query(`CREATE TABLE IF NOT EXISTS menu_items (
        id text PRIMARY KEY, slug text, cat text, price int DEFAULT 0, img text,
        t_uz text, t_ru text, t_en text, d_uz text, d_ru text, d_en text,
        pcs int DEFAULT 0, weight text, hit boolean DEFAULT false, active boolean DEFAULT true, sort int DEFAULT 0,
        sale_active boolean DEFAULT false, sale_percent int DEFAULT 0, sale_price int)`);
      const c = await p.query('SELECT count(*)::int AS n FROM menu_items');
      if (c.rows[0].n === 0) {
        for (const cat of CAT_SEED) {
          await p.query(`INSERT INTO menu_categories (slug, sort, title_uz, title_ru, title_en, emoji)
            VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (slug) DO NOTHING`,
            [cat.slug, cat.sort, cat.uz, cat.ru, cat.en, cat.emoji]);
        }
        let i = 0;
        for (const it of MENU_SEED) {
          await p.query(`INSERT INTO menu_items (id, slug, cat, price, img, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, hit, sort)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT (id) DO NOTHING`,
            [it.id, it.slug, it.cat, it.price, it.img, it.t_uz, it.t_ru, it.t_en, it.d_uz, it.d_ru, it.d_en, it.pcs, it.hit, i]);
          i++;
        }
      }
    })().catch(e => { console.error('menu ensureSchema', e); ensured = undefined; return false; }).then(r => r !== false);
  }
  return ensured;
}

// effective price with sale applied
function effPrice(it, catPct) {
  if (it.sale_active && it.sale_price && it.sale_price > 0 && it.sale_price < it.price) {
    return { price: it.sale_price, old: it.price, pct: Math.round((1 - it.sale_price / it.price) * 100) };
  }
  if (it.sale_active && it.sale_percent > 0) {
    const p = Math.round(it.price * (100 - it.sale_percent) / 100 / 1000) * 1000;
    return { price: p, old: it.price, pct: it.sale_percent };
  }
  if (catPct > 0) {
    const p = Math.round(it.price * (100 - catPct) / 100 / 1000) * 1000;
    return { price: p, old: it.price, pct: catPct };
  }
  return { price: it.price, old: null, pct: 0 };
}

export default async (req, res) => {
  cors(res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, error: 'DB sozlanmagan' });
  try {
    const ok = await ensureSchema();
    if (!ok) return res.status(500).json({ ok: false, error: 'DB xato' });
    const p = getPool();
    const cats = (await p.query(
      `SELECT slug, sort, title_uz, title_ru, title_en, emoji, sale_active, sale_percent
       FROM menu_categories WHERE active = true ORDER BY sort`)).rows;
    const catPct = {};
    for (const c of cats) catPct[c.slug] = c.sale_active ? (c.sale_percent || 0) : 0;
    const rows = (await p.query(
      `SELECT id, slug, cat, price, img, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, weight, hit, sort,
              sale_active, sale_percent, sale_price
       FROM menu_items WHERE active = true ORDER BY sort`)).rows;
    const items = rows.map(r => {
      const e = effPrice(r, catPct[r.cat] || 0);
      return { ...r, price: e.price, old_price: e.old, sale_percent: e.pct, sale_active: e.old != null };
    });
    return res.status(200).json({ ok: true, cats, items });
  } catch (e) {
    console.error('menu error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
