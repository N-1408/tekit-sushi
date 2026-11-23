import { getPool } from './_db.js';
import { cors } from './_verify.js';
import { syncMenu } from './_iiko.js';

// Oxirgi o'z-o'zidan sinxron vaqti (bir namunada 2 daqiqada bir marta)
let lastAutoSync = 0;




function nutritionFor(it) {
  if (it.cat === 'sous') return null
  const s = `${it.t_en || ''} ${it.t_ru || ''} ${it.t_uz || ''} ${it.d_uz || ''}`.toLowerCase()
  const has = (...w) => w.some((x) => s.includes(x))
  let kcal = 160, prot = 7, fat = 6, carb = 19
  switch (it.cat) {
    case 'set': kcal = 160; prot = 8; fat = 6; carb = 19; break
    case 'sushi': kcal = 145; prot = 8; fat = 4; carb = 21; break
    case 'salat': kcal = 120; prot = 7; fat = 8; carb = 6; break
    case 'sup': kcal = 75; prot = 5; fat = 4; carb = 7; break
    case 'wok': kcal = 155; prot = 7; fat = 5; carb = 21; break
    case 'garnir': kcal = 135; prot = 3; fat = 3; carb = 26; break
    case 'issiq': kcal = 185; prot = 11; fat = 9; carb = 17; break
    case 'bola': kcal = 210; prot = 8; fat = 9; carb = 25; break
    case 'desert': kcal = 280; prot = 5; fat = 13; carb = 36; break
    case 'ichimlik': kcal = 42; prot = 1; fat = 0; carb = 10; break
  }
  if (has('tempura', 'klyar', 'paniro', 'fried', 'qovurilgan')) { kcal += 35; fat += 4; carb += 6 }
  if (has('gril', 'grill', 'yaki', 'pechen')) { kcal += 25; fat += 3 }
  if (has('spayci', 'spicy', 'mayonez', 'mayo')) { kcal += 20; fat += 3 }
  if (has('krem', 'pishloq', 'cheese', 'qaymoq', 'kaymok')) { kcal += 15; fat += 2 }
  if (has('mochi', 'cheesecake', 'chizkeik', 'shokolad', 'chocolate', 'tort')) { kcal += 40; fat += 4; carb += 8 }
  return { kcal: Math.round(kcal), protein: Math.round(prot), fat: Math.round(fat), carbs: Math.round(carb) }
}


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
      await p.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS hidden_by_admin boolean DEFAULT false`);
      for (const col of ['kcal', 'protein', 'fat', 'carbs'])
        await p.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ${col} int`);
      const need = await p.query(`SELECT id, cat, t_uz, t_ru, t_en, d_uz FROM menu_items WHERE kcal IS NULL AND cat <> 'sous'`);
      for (const it of need.rows) {
        const n = nutritionFor(it);
        if (n) await p.query('UPDATE menu_items SET kcal=$2, protein=$3, fat=$4, carbs=$5 WHERE id=$1', [it.id, n.kcal, n.protein, n.fat, n.carbs]);
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
    // Menyu bo'sh bo'lsa: iikodan o'z-o'zidan sinxron (mijoz ilk ochilishida
    // ham menyuni ko'radi). Eski iiko qatorlari shu sinxda o'chiriladi.
    let syncInfo = null;
    const pre = await p.query(`SELECT count(*)::int AS n FROM menu_items WHERE active = true`);
    let needImg = false;
    if (pre.rows[0].n) {
      try {
        const noImg = await p.query(`SELECT count(*)::int AS n FROM menu_items WHERE active = true AND source = 'iiko' AND (img IS NULL OR img = '')`);
        needImg = noImg.rows[0].n > 0;
      } catch {}
    }
    if ((!pre.rows[0].n || needImg) && Date.now() - lastAutoSync > 1800000) {
      lastAutoSync = Date.now();
      try {
        const s = (await syncMenu(p))[0];
        if (s) syncInfo = s.items
          ? { text: `iiko: ${s.items} taom, ${s.withImg} rasm (${s.source}${s.imgFromNomenclature ? `, ${s.imgFromNomenclature} nomenklaturadan` : ''})`, debug: s.imgDebug || null }
          : `iiko: ${s.note || "katalog bo'sh"}`;
      } catch (se) {
        syncInfo = 'iiko sinxron xato: ' + String((se && se.message) || se).slice(0, 200);
      }
    }
    const cats = (await p.query(
      `SELECT slug, sort, title_uz, title_ru, title_en, emoji, sale_active, sale_percent
       FROM menu_categories WHERE active = true ORDER BY sort`)).rows;
    const catPct = {};
    for (const c of cats) catPct[c.slug] = c.sale_active ? (c.sale_percent || 0) : 0;
    const rows = (await p.query(
      `SELECT id, slug, cat, price, img, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, weight, hit, sort, kcal, protein, fat, carbs,
              sale_active, sale_percent, sale_price, spicy
       FROM menu_items WHERE active = true AND price > 0 ORDER BY sort`)).rows;
    let modsByItem = null;
    try {
      const m = (await p.query(
        `SELECT g.item_id, g.min_amount, g.max_amount, og.id AS group_id, og.title, og.min_qty, og.max_qty,
                o.id AS opt_id, o.name, o.price, o.iiko_product_id, o.is_default
         FROM menu_item_mod_groups g
         JOIN menu_mod_groups og ON og.id = g.group_id
         JOIN menu_mod_options o ON o.group_id = og.id
         ORDER BY g.sort, o.id`)).rows;
      if (m.length) {
        modsByItem = {};
        const gmap = {};
        for (const row of m) {
          const key = row.group_id + '|' + row.item_id;
          if (!gmap[key]) gmap[key] = {
            id: row.group_id, title: row.title,
            min: Number(row.min_qty ?? row.min_amount ?? 0),
            max: Number(row.max_qty ?? row.max_amount ?? 0),
            options: [],
          };
          gmap[key].options.push({ id: row.opt_id, name: row.name, price: Number(row.price) || 0, iiko_id: row.iiko_product_id, default: !!row.is_default });
        }
        for (const row of m) {
          const g = gmap[row.group_id + '|' + row.item_id];
          (modsByItem[row.item_id] = modsByItem[row.item_id] || []).push(g);
        }
        for (const id of Object.keys(modsByItem)) {
          const seen = new Set();
          modsByItem[id] = modsByItem[id].filter((g) => !seen.has(g.id) && seen.add(g.id));
        }
      }
    } catch (me) { console.error('menu mods', me && me.message); }
    const items = rows.map(r => {
      const e = effPrice(r, catPct[r.cat] || 0);
      const out = { ...r, price: e.price, old_price: e.old, sale_percent: e.pct, sale_active: e.old != null };
      if (modsByItem && modsByItem[r.id]) out.mods = modsByItem[r.id];
      return out;
    });
    // Bo'sh qolgan kategoriyalarni klientga yubormaymiz (masalan, faqat
    // ingredientlar bo'lgan guruhlar).
    const haveCats = new Set(items.map((r) => r.cat));
    const catsOut = cats.filter((c) => haveCats.has(c.slug));
    return res.status(200).json({ ok: true, delivery: { fee: Number(process.env.DELIVERY_FEE ?? 0), threshold: Number(process.env.DELIVERY_FREE_THRESHOLD || 200000) }, ...(syncInfo ? { sync: syncInfo } : {}), cats: catsOut, items });
  } catch (e) {
    console.error('menu error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
