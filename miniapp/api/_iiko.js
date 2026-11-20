// iiko Cloud API klienti va nomenklatura sinxronizatsiyasi.
// Hobby rejada 12 funksiya limiti: alohida funksiya emas, admin.js ichidan chaqiriladi.
// Maxfiy qiymatlar faqat env'dan o'qiladi, javoblarga chiqarilmaydi.
const BASE = (process.env.IIKO_BASE_URL || 'https://api-ru.iiko.services').replace(/\/+$/, '');

let tokenCache = null;
let tokenExp = 0;

async function raw(path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* bo'sh javob */ }
  return { status: res.status, data };
}

// Token: v2 (apiKey+appId+clientSecret) birinchi, v1 (apiLogin) zaxira. ~55 daqiqa yashaydi.
export async function getToken(force = false) {
  if (!force && tokenCache && Date.now() < tokenExp) return tokenCache;
  let t = await raw('/api/v2/access_token', null, {
    apiKey: process.env.IIKO_API_LOGIN,
    appId: process.env.IIKO_APP_ID,
    clientSecret: process.env.IIKO_CLIENT_SECRET,
  });
  if (t.status !== 200 || !t.data || !t.data.token) {
    t = await raw('/api/1/access_token', null, { apiLogin: process.env.IIKO_API_LOGIN });
  }
  if (t.status !== 200 || !t.data || !t.data.token) throw new Error(`iiko token failed (HTTP ${t.status})`);
  tokenCache = t.data.token;
  tokenExp = Date.now() + 55 * 60 * 1000;
  return tokenCache;
}

async function call(path, body) {
  let r = await raw(path, await getToken(), body);
  if (r.status === 401) r = await raw(path, await getToken(true), body);
  if (r.status !== 200) throw new Error(`iiko ${path} failed (HTTP ${r.status})`);
  return r.data;
}

export async function orgList() {
  const d = await call('/api/1/organizations', { organizationIds: null, returnAdditionalInfo: false });
  return Array.isArray(d) ? d : (d && Array.isArray(d.organizations) ? d.organizations : []);
}

export async function nomenclature(orgId) {
  return call('/api/1/nomenclature?version=3', { organizationId: orgId, additionalData: ['imageLinks', 'itemDescription'] });
}

function priceOf(p) {
  const s = Array.isArray(p.sizes) ? p.sizes[0] : null;
  if (s && s.price !== undefined && s.price !== null) {
    if (typeof s.price === 'number') return s.price;
    if (typeof s.price.currentPrice === 'number') return s.price.currentPrice;
    if (typeof s.price.price === 'number') return s.price.price;
  }
  return typeof p.price === 'number' ? p.price : null;
}

function slugify(s) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ь:'',э:'e',ю:'yu',я:'ya' };
  return String(s || '').toLowerCase().split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Bir tashkilotning to'liq menyuini DB'ga yozadi (iiko IDlari bilan kalitlanadi).
// Bizga xos ustunlar (tarjimalar, promo, sort, img) saqlanib qoladi: faqat
// iiko beradigan maydonlar yangilanadi.
export async function syncMenu(pool, orgIds, { activate = false } = {}) {
  const results = [];
  for (const orgId of orgIds) {
    const nom = await nomenclature(orgId);
    const cats = Array.isArray(nom.productCategories) ? nom.productCategories : [];
    const groups = Array.isArray(nom.groups) ? nom.groups : [];
    const products = (Array.isArray(nom.products) ? nom.products : []).filter((p) => !p.isDeleted && !p.isComponent);
    const byId = new Map(products.map((p) => [p.id, p]));
    const orgName = (nom.organization && (nom.organization.name || nom.organization.companyName)) || orgId.slice(0, 8);

    // 1) Kategoriyalar
    const catJson = JSON.stringify(cats.map((c) => ({
      slug: 'i_' + c.id, title_uz: c.name || '', title_ru: c.name || '', title_en: c.name || '', iiko_id: c.id,
    })));
    const catRes = await pool.query(
      `INSERT INTO menu_categories (slug, title_uz, title_ru, title_en, active, source, iiko_id)
       SELECT x.slug, x.title_uz, x.title_ru, x.title_en, true, 'iiko', x.iiko_id
       FROM jsonb_to_recordset($1::jsonb) AS x(slug text, title_uz text, title_ru text, title_en text, iiko_id text)
       ON CONFLICT (slug) DO UPDATE SET title_uz = EXCLUDED.title_uz, title_ru = EXCLUDED.title_ru,
         title_en = EXCLUDED.title_en, source = 'iiko', iiko_id = EXCLUDED.iiko_id`,
      [catJson]
    );

    // 2) Mahsulotlar
    const itemJson = JSON.stringify(products.map((p) => {
      const price = priceOf(p);
      const name = p.name || '';
      const desc = p.description || '';
      return {
        id: 'iiko_' + p.id,
        slug: (slugify(name) || 'iiko') + '-' + p.id.slice(0, 6),
        cat: p.productCategoryId ? 'i_' + p.productCategoryId : 'iiko-other',
        price: price === null ? 0 : Math.round(price),
        t_uz: name, t_ru: name, t_en: name,
        d_uz: desc, d_ru: desc, d_en: desc,
        iiko_id: p.id,
        iiko_prices: { [orgId]: price === null ? null : Math.round(price) },
      };
    }));
    const itemRes = await pool.query(
      `INSERT INTO menu_items (id, slug, cat, price, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, hit, active, source, iiko_id, iiko_prices)
       SELECT x.id, x.slug, x.cat, x.price, x.t_uz, x.t_ru, x.t_en, x.d_uz, x.d_ru, x.d_en, 0, false, $2::boolean, 'iiko', x.iiko_id, x.iiko_prices
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, slug text, cat text, price int, t_uz text, t_ru text, t_en text, d_uz text, d_ru text, d_en text, iiko_id text, iiko_prices jsonb)
       ON CONFLICT (id) DO UPDATE SET
         cat = EXCLUDED.cat, price = EXCLUDED.price,
         t_uz = EXCLUDED.t_uz, t_ru = EXCLUDED.t_ru, t_en = EXCLUDED.t_en,
         d_uz = EXCLUDED.d_uz, d_ru = EXCLUDED.d_ru, d_en = EXCLUDED.d_en,
         iiko_prices = COALESCE(menu_items.iiko_prices, '{}'::jsonb) || EXCLUDED.iiko_prices`,
      [itemJson, activate]
    );

    // 3) Modifikator guruhlari (souslar, qo'shimchalar)
    const gRows = [], oRows = [], mRows = [];
    for (const p of products) {
      // Sodda modifikatorlar: bitta yashirin guruh
      const mods = Array.isArray(p.modifiers) ? p.modifiers : [];
      if (mods.length) {
        const gid = 'ms_' + p.id;
        gRows.push({ id: gid, title: null, min_qty: 0, max_qty: 0 });
        mods.forEach((m, i) => {
          const mp = byId.get(m.productId);
          oRows.push({ id: 'o_' + gid + '_' + m.productId, group_id: gid, iiko_product_id: m.productId,
            name: mp ? mp.name : '', price: mp ? (priceOf(mp) || 0) : 0, is_default: !!m.byDefault });
          mRows.push({ item_id: 'iiko_' + p.id, group_id: gid, min_amount: m.minAmount, max_amount: m.maxAmount, sort: i });
        });
      }
      // Murakkab guruhlar (itemGroupId)
      const gms = Array.isArray(p.groupModifiers) ? p.groupModifiers : [];
      gms.forEach((gm, gi) => {
        if (!gm || !gm.itemGroupId) return;
        const gid = 'm_' + gm.itemGroupId;
        const gdef = groups.find((g) => g.id === gm.itemGroupId);
        gRows.push({ id: gid, title: gdef ? gdef.name : null, min_qty: gm.minAmount ?? 0, max_qty: gm.maxAmount ?? 0 });
        (gm.modifiers || []).forEach((m, i) => {
          const mp = byId.get(m.productId);
          oRows.push({ id: 'o_' + gid + '_' + m.productId, group_id: gid, iiko_product_id: m.productId,
            name: mp ? mp.name : '', price: mp ? (priceOf(mp) || 0) : 0, is_default: !!m.byDefault });
          mRows.push({ item_id: 'iiko_' + p.id, group_id: gid, min_amount: m.minAmount, max_amount: m.maxAmount, sort: gi * 100 + i });
        });
      });
    }
    const gRes = await pool.query(
      `INSERT INTO menu_mod_groups (id, title, min_qty, max_qty)
       SELECT x.id, x.title, x.min_qty, x.max_qty FROM jsonb_to_recordset($1::jsonb) AS x(id text, title text, min_qty int, max_qty int)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, min_qty = EXCLUDED.min_qty, max_qty = EXCLUDED.max_qty`,
      [JSON.stringify(gRows)]
    );
    const oRes = await pool.query(
      `INSERT INTO menu_mod_options (id, group_id, iiko_product_id, name, price, is_default)
       SELECT x.id, x.group_id, x.iiko_product_id, x.name, x.price, x.is_default
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, group_id text, iiko_product_id text, name text, price int, is_default boolean)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, is_default = EXCLUDED.is_default`,
      [JSON.stringify(oRows)]
    );
    const mRes = await pool.query(
      `INSERT INTO menu_item_mod_groups (item_id, group_id, min_amount, max_amount, sort)
       SELECT x.item_id, x.group_id, x.min_amount, x.max_amount, x.sort
       FROM jsonb_to_recordset($1::jsonb) AS x(item_id text, group_id text, min_amount real, max_amount real, sort int)
       ON CONFLICT (item_id, group_id) DO UPDATE SET min_amount = EXCLUDED.min_amount, max_amount = EXCLUDED.max_amount, sort = EXCLUDED.sort`,
      [JSON.stringify(mRows)]
    );

    results.push({
      orgId, name: orgName,
      categories: catRes.rowCount || 0,
      items: itemRes.rowCount || 0,
      modifierGroups: gRes.rowCount || 0,
      modifierOptions: oRes.rowCount || 0,
      itemGroupLinks: mRes.rowCount || 0,
    });
  }
  return results;
}
