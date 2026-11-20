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

// Nomenklatura v2: /api/1/nomenclature o'chirilgan (HTTP 410). Yangi kontrakt:
// paginatsiyali /api/nomenclature/v2/product/list va /group/list.
// Katalog API-kalit kontekstiga tegishli; narx = defaultSalePrice (kartochka bazaviy narxi).
async function paged(path, responseField, idField, filters = []) {
  const limit = 500, items = [], seen = new Set();
  for (let offset = 0; offset < 250000;) {
    const d = await call(path, { filters, limit, offset });
    const page = Array.isArray(d && d[responseField]) ? d[responseField] : null;
    if (!page) throw new Error(`iiko ${path}: noto'g'ri javob shakli`);
    for (const it of page) {
      const id = it && it[idField];
      if (!id) throw new Error(`iiko ${path}: yozuvda ${idField} yo'q`);
      if (seen.has(id)) throw new Error(`iiko ${path}: takroriy id`);
      seen.add(id); items.push(it);
    }
    offset += page.length;
    if (Number.isInteger(d.totalCount) && d.totalCount >= 0 && offset >= d.totalCount) return items;
    if (!page.length) return items;
  }
  throw new Error(`iiko ${path}: juda ko'p yozuv`);
}

export async function catalogV2() {
  const filters = [{ field: 'isDeleted', op: 'eq', value: false }];
  const products = await paged('/api/nomenclature/v2/product/list', 'items', 'productId', filters);
  let groups = [];
  try {
    groups = await paged('/api/nomenclature/v2/group/list', 'groups', 'groupId', filters);
  } catch (e) {
    if (String(e).includes('HTTP 401')) throw e;
    // Guruhlar katalogi ixtiyoriy: bo'lmasa toifalarsiz davom etamiz
    groups = [];
  }
  return { products, groups };
}

function priceOf(p) {
  const v = p.defaultSalePrice;
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
}

function slugify(s) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ь:'',э:'e',ю:'yu',я:'ya' };
  return String(s || '').toLowerCase().split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Katalogni DB'ga yozadi (iiko IDlari bilan kalitlanadi). Bizga xos ustunlar
// (tarjimalar, promo, sort, img, active/hit) saqlanib qoladi: faqat iiko
// beradigan maydonlar yangilanadi. Yangi elementlar activate=true bo'lmasa
// yashirin (active=false) keladi — mijozga ko'rinmaydi.
export async function syncMenu(pool, { activate = true } = {}) {
  const { products, groups } = await catalogV2();
  const groupsById = new Map(groups.map((g) => [g.groupId, g]));
  const byId = new Map(products.map((p) => [p.productId, p]));
  const OK_TYPES = ['GOODS', 'DISH', 'PREPARED', 'SERVICE'];
  const sellable = products.filter((p) => p.name && OK_TYPES.includes(p.type));

  // 1) Toifalar: mahsulotning parentGroupId -> group nomi
  const usedCats = new Set(sellable.map((p) => p.parentGroupId || ''));
  const catRows = [];
  for (const gid of usedCats) {
    const gname = gid && groupsById.get(gid) ? groupsById.get(gid).name : 'Boshqa';
    catRows.push({
      slug: gid ? 'i_' + gid : 'iiko-other',
      title_uz: gname, title_ru: gname, title_en: gname,
      iiko_id: gid || null,
    });
  }
  const catRes = await pool.query(
    `INSERT INTO menu_categories (slug, title_uz, title_ru, title_en, active, source, iiko_id)
     SELECT x.slug, x.title_uz, x.title_ru, x.title_en, true, 'iiko', x.iiko_id
     FROM jsonb_to_recordset($1::jsonb) AS x(slug text, title_uz text, title_ru text, title_en text, iiko_id text)
     ON CONFLICT (slug) DO UPDATE SET title_uz = EXCLUDED.title_uz, title_ru = EXCLUDED.title_ru,
       title_en = EXCLUDED.title_en, source = 'iiko', iiko_id = EXCLUDED.iiko_id`,
    [JSON.stringify(catRows)]
  );

  // 2) Mahsulotlar
  const itemJson = sellable.map((p) => {
    const price = priceOf(p) || 0;
    return {
      id: 'iiko_' + p.productId,
      slug: (slugify(p.name) || 'iiko') + '-' + String(p.productId).slice(0, 6),
      cat: p.parentGroupId ? 'i_' + p.parentGroupId : 'iiko-other',
      price: Math.round(price),
      t_uz: p.name, t_ru: p.name, t_en: p.name,
      d_uz: p.description || '', d_ru: p.description || '', d_en: p.description || '',
      iiko_id: p.productId,
      iiko_prices: { default: Math.round(price) },
    };
  });
  const itemRes = await pool.query(
    `INSERT INTO menu_items (id, slug, cat, price, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, hit, active, source, iiko_id, iiko_prices)
     SELECT x.id, x.slug, x.cat, x.price, x.t_uz, x.t_ru, x.t_en, x.d_uz, x.d_ru, x.d_en, 0, false, $2::boolean, 'iiko', x.iiko_id, x.iiko_prices
     FROM jsonb_to_recordset($1::jsonb) AS x(id text, slug text, cat text, price int, t_uz text, t_ru text, t_en text, d_uz text, d_ru text, d_en text, iiko_id text, iiko_prices jsonb)
     ON CONFLICT (id) DO UPDATE SET
       cat = EXCLUDED.cat, price = EXCLUDED.price,
       t_uz = EXCLUDED.t_uz, t_ru = EXCLUDED.t_ru, t_en = EXCLUDED.t_en,
       d_uz = EXCLUDED.d_uz, d_ru = EXCLUDED.d_ru, d_en = EXCLUDED.d_en,
       iiko_prices = COALESCE(menu_items.iiko_prices, '{}'::jsonb) || EXCLUDED.iiko_prices`,
    [JSON.stringify(itemJson), activate]
  );

  // 3) Modifikatorlar: p.modifiers -> sodda yoki childModifiers bilan guruh
  const gRows = [], oRows = [], mRows = [];
  for (const p of sellable) {
    const mods = Array.isArray(p.modifiers) ? p.modifiers : [];
    mods.forEach((mod, gi) => {
      const children = Array.isArray(mod.childModifiers) && mod.childModifiers.length ? mod.childModifiers : [mod];
      const grouped = Array.isArray(mod.childModifiers) && mod.childModifiers.length > 0;
      const gid = grouped && mod.modifierId ? 'm_' + mod.modifierId : 'ms_' + p.productId;
      const gtitle = grouped ? (groupsById.get(mod.modifierId)?.name || null) : null;
      gRows.push({ id: gid, title: gtitle, min_qty: Math.round(Number(mod.minimumAmount) || 0), max_qty: Math.round(Number(mod.maximumAmount) || 0) });
      children.forEach((entry, i) => {
        const target = byId.get(entry.modifierId);
        oRows.push({
          id: 'o_' + gid + '_' + entry.modifierId, group_id: gid, iiko_product_id: entry.modifierId,
          name: target ? target.name : String(entry.modifierId || ''),
          price: target ? Math.round(priceOf(target) || 0) : 0,
          is_default: (Number(entry.defaultAmount) || 0) > 0,
        });
        mRows.push({
          item_id: 'iiko_' + p.productId, group_id: gid,
          min_amount: entry.minimumAmount ?? (entry.required ? 1 : 0),
          max_amount: entry.maximumAmount ?? null,
          sort: gi * 100 + i,
        });
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

  // iiko yagona manba: mavjud placeholder (iiko'dan kelgan bo'lmagan)
  // kategoriya va mahsulotlar menyudan yashirinadi (buyurtma tarixi uchun qatorlar qoladi).
  await pool.query(`UPDATE menu_items SET active = false WHERE source IS DISTINCT FROM 'iiko'`);
  await pool.query(`UPDATE menu_categories SET active = false WHERE source IS DISTINCT FROM 'iiko'`);

  return [{
    source: 'nomenclature-v2',
    name: 'iiko',
    categories: catRes.rowCount || 0,
    items: itemRes.rowCount || 0,
    modifierGroups: gRes.rowCount || 0,
    modifierOptions: oRes.rowCount || 0,
    itemGroupLinks: mRes.rowCount || 0,
  }];
}
