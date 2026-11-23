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
  /* iiko ba'zan vaqtincha 503 qaytaradi (throttle): kutib yana urinamiz */
  for (let i = 0; (r.status === 503 || r.status === 429) && i < 2; i++) {
    await new Promise((res) => setTimeout(res, i === 0 ? 3000 : 8000));
    r = await raw(path, await getToken(), body);
  }
  if (r.status !== 200) {
    const b = r.data || {};
    const extra = b.errorDescription || b.error || b.description || b.message;
    throw new Error(`iiko ${path} failed (HTTP ${r.status})` + (extra ? ': ' + String(extra).slice(0, 220) : ''));
  }
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
  if (!p) return null;
  let v = p.defaultSalePrice;
  if ((v === null || v === undefined || v === '') && Array.isArray(p.sizePrices) && p.sizePrices.length) {
    const pr = p.sizePrices[0] && p.sizePrices[0].price;
    if (pr && typeof pr === 'object') v = pr.currentPrice != null ? pr.currentPrice : (pr.value != null ? pr.value : null);
    else v = pr;
  }
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? null : n;
}

function slugify(s) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ь:'',э:'e',ю:'yu',я:'ya' };
  return String(s || '').toLowerCase().split('')
    .map((ch) => (map[ch] !== undefined ? map[ch] : ch))
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

/* Restoran mijozga ko'rinadigan menyusi iikoWeb'da "External Menu" sifatida
   qurilgan (masalan "Test (mini app)"). U API-kalitga bog'lanadi va
   /api/2/menu -> /api/menu/v3/by_id orqali o'qiladi. Nomenklatura v2 esa
   xom katalog bo'lib, savatga chiqadigan taomlar shu yerdan kelmadi.
   Quyidagi loader external menyuni nomenklatura shakliga aylantiradi,
   shuning uchun DB yozish kodi o'zgarmaydi. */
export async function externalMenuCatalog(orgIds) {
  const orgs = (Array.isArray(orgIds) ? orgIds : [orgIds]).filter(Boolean);
  let menu = null, org = null;
  let lastErr = null;
  for (const o of orgs) {
    try {
      const d = await call(`/api/2/menu?organizationId=${encodeURIComponent(o)}`, {});
      const menus = (d && Array.isArray(d.externalMenus)) ? d.externalMenus : [];
      if (!menus.length) { lastErr = new Error('iiko: org ' + o.slice(0, 8) + ' da external menyu yo\'q'); continue; }
      const want = process.env.IIKO_EXTERNAL_MENU_ID;
      menu = (want && menus.find((m) => String(m.id) === String(want)))
        || menus.find((m) => /mini\s*app/i.test(String(m.name || '')))
        || menus[0];
      org = o;
      break;
    } catch (e) { lastErr = e; }
  }
  if (!menu) throw (lastErr || new Error("iiko: external menyu topilmadi"));
  /* by_id bir org'ga bog'lanadi: bog'lanish o'zgarsa boshqa org va
     versiyalar bilan ham urinamiz (iiko 400/410 qaytarishi mumkin). */
  let d = null, byErr = null;
  const tryOrgs = [org, ...orgs.filter((o) => o !== org)];
  for (const o of tryOrgs) {
    for (const v of [3, 2, 4]) {
      try {
        d = await call('/api/menu/v3/by_id', { externalMenuId: String(menu.id), organizationIds: [o], version: v });
        org = o;
        break;
      } catch (e) { byErr = e; d = null; }
    }
    if (d) break;
  }
  if (!d) throw (byErr || new Error("iiko: menyu o'qilmadi"));
  const cats = Array.isArray(d && (d.itemGroups || d.itemCategories)) ? (d.itemGroups || d.itemCategories) : [];
  const groups = [], products = [];
  for (const c of cats) {
    if (!c || !c.id) continue;
    groups.push({ groupId: c.id, name: c.name || '', imageUrl: c.imageUrl || null });
    const items = (Array.isArray(c.items) && c.items.length) ? c.items : (Array.isArray(c.itemList) ? c.itemList : []);
    for (const it of items) {
      if (!it || !(it.id || it.itemId) || !it.name) continue;
      if (it.isAvailable === false) continue;
      const sizes = Array.isArray(it.sizes) && it.sizes.length ? it.sizes : (Array.isArray(it.itemSizes) && it.itemSizes.length ? it.itemSizes : [{}]);
      const sz = sizes.find((x) => x && x.isDefault) || sizes[0];
      const prices = Array.isArray(sz && sz.prices) ? sz.prices : [];
      const pr = prices.find((x) => x && (!org || !x.organizationId || String(x.organizationId) === String(org))) || prices[0];
      const mods = Array.isArray(sz && sz.itemModifierGroups) ? sz.itemModifierGroups : [];
      products.push({
        productId: String(it.id || it.itemId),
        name: it.name,
        description: it.description || '',
        parentGroupId: c.id,
        iikoImages: (() => {
          const set = new Set();
          const push = (u) => { if (typeof u === 'string' && /^https?:\/\//i.test(u)) set.add(u); };
          push(it.imageUrl); push(it.buttonImageUrl);
          (Array.isArray(it.imageUrls) ? it.imageUrls : []).forEach((u) => push(typeof u === 'string' ? u : u && u.url));
          if (sz) { push(sz.imageUrl); push(sz.buttonImageUrl); push(sz.buttonImage && sz.buttonImage.url); (Array.isArray(sz.imageUrls) ? sz.imageUrls : []).forEach((u) => push(typeof u === 'string' ? u : u && u.url)); }
          push(c.imageUrl); push(c.buttonImageUrl);
          return [...set];
        })(),
        imageUrl: it.imageUrl || it.buttonImageUrl || (sz && (sz.imageUrl || sz.buttonImageUrl || (sz.buttonImage && sz.buttonImage.url))) || c.buttonImageUrl || c.imageUrl || null,
        weight: sz && sz.weight != null ? sz.weight : undefined,
        nutritions: sz && Array.isArray(sz.nutritions) && sz.nutritions.length ? sz.nutritions : undefined,
        type: 'DISH',
        isDeleted: false,
        defaultSalePrice: pr ? Number(pr.price) : null,
        modifiers: mods.map((g) => ({
          modifierId: g.itemGroupModifierId,
          groupName: g.name || null,
          minimumAmount: g.restrictions ? g.restrictions.minQuantity : undefined,
          maximumAmount: g.restrictions ? g.restrictions.maxQuantity : undefined,
          childModifiers: (Array.isArray(g.items) ? g.items : []).map((m) => ({
            modifierId: m.itemId,
            minimumAmount: m.restrictions ? m.restrictions.minQuantity : undefined,
            maximumAmount: m.restrictions ? m.restrictions.maxQuantity : undefined,
            defaultAmount: m.isDefault ? 1 : 0,
          })),
        })),
      });
      // Modifikator variantlarini ham katalogga qo'shamiz (type: MODIFIER, savatga
      // qo'shilmaydi), faqat nom va narx aniqlanishi uchun.
      for (const g of mods) {
        for (const m of (Array.isArray(g.items) ? g.items : [])) {
          if (!m || !m.itemId) continue;
          if (products.some((p) => p.productId === String(m.itemId))) continue;
          products.push({
            productId: String(m.itemId),
            name: m.name || String(m.itemId),
            description: '',
            parentGroupId: null,
            type: 'MODIFIER',
            isDeleted: false,
            defaultSalePrice: m.price != null ? Number(m.price) : null,
            modifiers: [],
          });
        }
      }
    }
  }
  let rawSample = null;
  try {
    const firstCat = cats.find((c) => c && Array.isArray(c.itemList) && c.itemList.length);
    const firstIt = firstCat && firstCat.itemList[0];
    if (firstIt) {
      const fsz = (Array.isArray(firstIt.sizes) && firstIt.sizes[0]) || (Array.isArray(firstIt.itemSizes) && firstIt.itemSizes[0]) || null;
      rawSample = { item: Object.keys(firstIt).join(','), size: fsz ? Object.keys(fsz).join(',') : null };
    }
  } catch (e) { /* diagnostika */ }
  return { products, groups, menuName: menu.name || '', menuId: menu.id, rawSample };
}

// Katalogni DB'ga yozadi (iiko IDlari bilan kalitlanadi). Bizga xos ustunlar
// (tarjimalar, promo, sort, img, active/hit) saqlanib qoladi: faqat iiko
// beradigan maydonlar yangilanadi. Yangi elementlar activate=true bo'lmasa
// yashirin (active=false) keladi — mijozga ko'rinmaydi.
export async function syncMenu(pool, { activate = true } = {}) {
  // Admin qo'lda yashirgan mahsulotni sinxron yana yoqib yubormasin.
  await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS hidden_by_admin boolean DEFAULT false');
  // Admin til nomlari (name_uz/name_en) faqat DB'da: sinxron ularni hech qachon yozmaydi.
  await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_uz text');
  await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_en text');
  await pool.query('ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS iiko_images jsonb');
  let products, groups, emErr = null, emSample = null;
  let srcName = 'nomenclature-v2', menuLabel = '';
  try {
    const em = await externalMenuCatalog([process.env.IIKO_ORGANIZATION_ID, process.env.IIKO_ORG_SAMPI]);
    products = em.products; groups = em.groups;
    emSample = em.rawSample || null;
    srcName = 'external-menu';
    menuLabel = `${em.menuName} (${em.menuId})`;
  } catch (e) {
    emErr = String((e && e.message) || e);
    /* Sinxron manba external menu (iikoWeb'dagi "Test (mini app)"); xom
       nomenklatura savolga yarar sellable beradi, shuning uchun
       zaxira yo'q: xato chiqariladi va menyu oxirgi holatda qoladi. */
    throw new Error(`iiko external menu yuklanmadi: ${emErr}`);
  }
  const groupsById = new Map(groups.map((g) => [g.groupId, g]));
  const byId = new Map(products.map((p) => [p.productId, p]));
  /* iiko 'type' maydoni har xil katta-kichik harfda keladi (GOODS/Good/Dish) —
     solishtirishdan oldin normalizatsiya qilinadi. Aks holda filter hammasini
     tashlab yuboradi va menyu bo'sh qoladi. */
  const OK_TYPES = ['GOOD', 'GOODS', 'DISH', 'PREPARED', 'SERVICE', 'SEMI'];
  const typeOf = (p) => String((p && p.type) || '').trim().toUpperCase();
  let typeCounts = null;
  /* Rasmlar iiko'da taomning o'zida (nomenklatura) saqlanadi: external menu
     javobida rasm maydoni bo'lmasa, nomenklaturadan productId bo'yicha
     olamiz. */
  // ON CONFLICT bir INSERT ichida bir qatorni ikki marta ko'rsa xato beradi —
  // shuning uchun har bir jadval uchun kalit bo'yicha bir marta olib qoldiramiz.
  const dedupe = (rows, key) => {
    const m = new Map();
    for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, r); }
    return [...m.values()];
  };
  const sellable = dedupe(products.filter((p) => p.name && !p.isDeleted && OK_TYPES.includes(typeOf(p))), (p) => p.productId);
  if (!sellable.length && products.length) {
    typeCounts = {};
    for (const p of products) { const t = typeOf(p); typeCounts[t || '?'] = (typeCounts[t || '?'] || 0) + 1; }
  }
  const imgMissing = sellable.filter((p) => !p.imageUrl && !(Array.isArray(p.imageUrls) && p.imageUrls.length));
  let imgFromNom = 0;
  if (imgMissing.length) {
    try {
      const c2 = await catalogV2();
      const imgById = new Map();
      for (const q of c2.products) {
        const u = (Array.isArray(q.imageUrls) && q.imageUrls[0] && (typeof q.imageUrls[0] === 'string' ? q.imageUrls[0] : q.imageUrls[0].url)) || q.imageUrl || null;
        if (u) imgById.set(q.productId, u);
      }
      for (const p of imgMissing) {
        const u = imgById.get(p.productId);
        if (u) { p.imageUrl = u; imgFromNom++; }
      }
    } catch (e) { console.log('rasm uchun nomenklatura olinmadi:', String((e && e.message) || e)); }
  }

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
    [JSON.stringify(dedupe(catRows, (r) => r.slug))]
  );

  // 2) Mahsulotlar
  // nutritions tashkilot bo'yicha keladi: o'z tashkilotimiz yoki birinchi yozuv
  const pickNut = (p, key) => {
    const arr = Array.isArray(p.nutritions) ? p.nutritions : [];
    if (!arr.length) return null;
    const n = arr.find((x) => x && Array.isArray(x.organizations) && x.organizations.length === 0) || arr[0] || {};
    const v = Number(n[key]);
    return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  };
  const itemJson = sellable.filter((p) => String(p.type || '').toUpperCase() !== 'MODIFIER').map((p) => {
    const price = priceOf(p) || 0;
    return {
      id: 'iiko_' + p.productId,
      slug: (slugify(p.name) || 'iiko') + '-' + String(p.productId).slice(0, 6),
      cat: p.parentGroupId ? 'i_' + p.parentGroupId : 'iiko-other',
      price: Math.round(price),
      t_uz: p.name, t_ru: p.name, t_en: p.name,
      d_uz: p.description || '', d_ru: p.description || '', d_en: p.description || '',
      iiko_id: p.productId,
      img: (Array.isArray(p.imageUrls) && p.imageUrls[0] && (typeof p.imageUrls[0] === 'string' ? p.imageUrls[0] : p.imageUrls[0].url)) || p.imageUrl || p.image || null,
      weight: p.weight != null ? String(p.weight) : null,
      // iiko nutritions: sizes.nutritions[] -> { energy(kkal), proteins, fats, carbs, organizations[] }
      kcal: pickNut(p, 'energy'), protein: pickNut(p, 'proteins'), fat: pickNut(p, 'fats'), carbs: pickNut(p, 'carbs'),
      iiko_images: Array.isArray(p.iikoImages) ? p.iikoImages : [],
      iiko_prices: { default: Math.round(price) },
    };
  });
  const itemRes = await pool.query(
    `INSERT INTO menu_items (id, slug, cat, price, img, t_uz, t_ru, t_en, d_uz, d_ru, d_en, pcs, hit, active, source, iiko_id, iiko_prices, weight, kcal, protein, fat, carbs, iiko_images)
     SELECT x.id, x.slug, x.cat, x.price, x.img, x.t_uz, x.t_ru, x.t_en, x.d_uz, x.d_ru, x.d_en, 0, false, $2::boolean, 'iiko', x.iiko_id, x.iiko_prices, x.weight, x.kcal, x.protein, x.fat, x.carbs, x.iiko_images
     FROM jsonb_to_recordset($1::jsonb) AS x(id text, slug text, cat text, price int, img text, t_uz text, t_ru text, t_en text, d_uz text, d_ru text, d_en text, iiko_id text, iiko_prices jsonb, weight text, kcal int, protein int, fat int, carbs int), iiko_images jsonb
     ON CONFLICT (id) DO UPDATE SET
       cat = EXCLUDED.cat, price = EXCLUDED.price,
       t_uz = EXCLUDED.t_uz, t_ru = EXCLUDED.t_ru, t_en = EXCLUDED.t_en,
       d_uz = EXCLUDED.d_uz, d_ru = EXCLUDED.d_ru, d_en = EXCLUDED.d_en,
       iiko_prices = COALESCE(menu_items.iiko_prices, '{}'::jsonb) || EXCLUDED.iiko_prices,
       img = COALESCE(NULLIF(EXCLUDED.img, ''), menu_items.img),
       weight = COALESCE(NULLIF(EXCLUDED.weight, ''), menu_items.weight),
       kcal = COALESCE(EXCLUDED.kcal, menu_items.kcal), protein = COALESCE(EXCLUDED.protein, menu_items.protein),
       fat = COALESCE(EXCLUDED.fat, menu_items.fat), carbs = COALESCE(EXCLUDED.carbs, menu_items.carbs),
       iiko_images = CASE WHEN jsonb_array_length(EXCLUDED.iiko_images) > 0 THEN EXCLUDED.iiko_images ELSE menu_items.iiko_images END,
       active = CASE WHEN COALESCE(menu_items.hidden_by_admin, false) THEN false ELSE $2::boolean END`,
    [JSON.stringify(dedupe(itemJson, (r) => r.id)), activate]
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
    [JSON.stringify(dedupe(gRows, (r) => r.id))]
  );
  const oRes = await pool.query(
    `INSERT INTO menu_mod_options (id, group_id, iiko_product_id, name, price, is_default)
     SELECT x.id, x.group_id, x.iiko_product_id, x.name, x.price, x.is_default
     FROM jsonb_to_recordset($1::jsonb) AS x(id text, group_id text, iiko_product_id text, name text, price int, is_default boolean)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, is_default = EXCLUDED.is_default`,
    [JSON.stringify(dedupe(oRows, (r) => r.id))]
  );
  const mRes = await pool.query(
    `INSERT INTO menu_item_mod_groups (item_id, group_id, min_amount, max_amount, sort)
     SELECT x.item_id, x.group_id, x.min_amount, x.max_amount, x.sort
     FROM jsonb_to_recordset($1::jsonb) AS x(item_id text, group_id text, min_amount real, max_amount real, sort int)
     ON CONFLICT (item_id, group_id) DO UPDATE SET min_amount = EXCLUDED.min_amount, max_amount = EXCLUDED.max_amount, sort = EXCLUDED.sort`,
    [JSON.stringify(dedupe(mRows, (r) => r.item_id + '|' + r.group_id))]
  );

  // iiko yagona manba: iiko'dan kelgan bo'lmagan (eski seed / qo'lda kiritilgan)
  // kategoriya va mahsulotlar bazadan butunlay o'chiriladi. Buyurtmalar o'z
  // paytidagi nusxani saqlaydi, tarix buzilmaydi.
  await pool.query(`DELETE FROM menu_item_mod_groups WHERE item_id NOT IN (SELECT id FROM menu_items)`);
  await pool.query(`DELETE FROM menu_items WHERE source IS DISTINCT FROM 'iiko'`);
  await pool.query(`DELETE FROM menu_categories WHERE source IS DISTINCT FROM 'iiko'`);

  // Eski iiko qatorlari ham qolmasin: shu sinxda kelmagan iiko yozuvlari
  // (eski nomenklatura id'lari, iiko'dan o'chirilgan taomlar) admin
  // ro'yxatidan ham yo'qoladi. Tarix buzilmaydi: buyurtmalar o'z paytidagi
  // nusxani saqlaydi. Faqat sinxron biror narsa olib keldiganida.
  if (sellable.length) {
    const itemIds = JSON.stringify(sellable.map((p) => String(p.productId)));
    await pool.query(
      `DELETE FROM menu_items WHERE source = 'iiko' AND iiko_id IS NOT NULL
       AND NOT (iiko_id = ANY(SELECT value::text FROM jsonb_array_elements_text($1::jsonb)))`,
      [itemIds]
    );
    const catIds = JSON.stringify([...usedCats].filter(Boolean));
    await pool.query(
      `DELETE FROM menu_categories WHERE source = 'iiko' AND iiko_id IS NOT NULL
       AND NOT (iiko_id = ANY(SELECT value::text FROM jsonb_array_elements_text($1::jsonb)))`,
      [catIds]
    );
  }

  const summary = {
    source: srcName,
    name: 'iiko',
    ...(menuLabel ? { menu: menuLabel } : {}),
    categories: catRes.rowCount || 0,
    items: itemRes.rowCount || 0,
    modifierGroups: gRes.rowCount || 0,
    modifierOptions: oRes.rowCount || 0,
    itemGroupLinks: mRes.rowCount || 0,
    withImg: sellable.filter((p) => p.imageUrl || (Array.isArray(p.imageUrls) && p.imageUrls.length)).length,
    imgFromNomenclature: imgFromNom,
    imgDebug: {
      sampleKeys: Object.keys(sellable[0] || {}).join(','),
      itemImgCount: sellable.filter((p) => p.imageUrl).length,
      szImgSeen: (() => { let n = 0; for (const p of sellable) { for (const sz of (Array.isArray(p.sizes) ? p.sizes : [])) { if (sz && (sz.imageUrl || sz.buttonImageUrl || (Array.isArray(sz.imageUrls) && sz.imageUrls.length))) n++; } } return n; })(),
      // Chuqur skaner: iiko javobida rasmga o'xshagan maydon qayerda bo'lsa ham topamiz.
      imgKeysFound: (() => {
        const RE = /image|photo|logo/i; const hits = {};
        for (const p of sellable.slice(0, 300)) {
          const walk = (o, path, depth) => {
            if (!o || typeof o !== 'object' || depth > 4) return;
            if (Array.isArray(o)) { for (const x of o.slice(0, 2)) walk(x, path + '[]', depth + 1); return; }
            for (const k of Object.keys(o)) {
              if (RE.test(k)) hits[path + '.' + k] = (hits[path + '.' + k] || 0) + 1;
              const v = o[k];
              if (v && typeof v === 'object') { try { if (JSON.stringify(v).length < 4000) walk(v, path + '.' + k, depth + 1); } catch {} }
            }
          };
          walk(p, '', 0);
        }
        const ks = Object.keys(hits);
        return ks.length ? ks.slice(0, 12).map((k) => k + ':' + hits[k]).join(' | ') : 'NONE';
      })(),
      nomFallback: imgFromNom > 0 ? 'matched ' + imgFromNom : (imgMissing.length ? 'needed ' + imgMissing.length : 'not needed'),
      rawSample: (() => { const r = emSample; return r ? (r.item + ' || size: ' + (r.size || 'NONE')) : 'n/a'; })(),
      emError: emErr || null,
    },
  };
  if (!sellable.length) {
    summary.note = products.length
      ? `iiko ${products.length} ta mahsulot qaytardi, ammo savatga o'tmadi. type qiymatlari: ` + Object.entries(typeCounts || {}).map(([k, v]) => `${k}=${v}`).join(', ')
      : "iiko bo'sh katalog qaytardi (mahsulot yo'q)";
  }
  return [summary];
}

// ---------------------------------------------------------------------------
// Buyurtmani iiko'ga yaratish (oshxona darhol ko'radi).
// Filial -> organizatsiya xaritasi (env bilan almashtiriladi):
//   IIKO_ORG_SAMPI, IIKO_ORG_NUKUS. Yetkazib berish buyurtmalarida filial
// tanlanmaguncha IIKO_ORGANIZATION_ID (standart) ishlatiladi.
// Muhim: xato bo'lsa buyurtma baribir mahalliy bazada saqlanadi — iiko
// integratsiyasi buyurtma qabul qilinishiga to'sqinlik qilmaydi.
// ---------------------------------------------------------------------------
const BRANCH_TO_ORG = {
  sampi: process.env.IIKO_ORG_SAMPI || '65317b0c-a016-453e-91a9-beefaef771dc',
  nukus: process.env.IIKO_ORG_NUKUS || 'a030af58-a576-4952-a539-d9a7abc80fd1',
};

const tgCache = {}; // orgId -> { id, at }
async function firstTerminalGroup(orgId) {
  const c = tgCache[orgId];
  if (c && c.id && Date.now() - c.at < 5 * 60 * 1000) return c.id;
  const d = await call('/api/1/terminal_groups', { organizationIds: [orgId] });
  const list = Array.isArray(d && d.terminalGroups) ? d.terminalGroups : [];
  const g = list[0] || null;
  const id = (g && g.id) || (g && Array.isArray(g.items) && g.items[0] && g.items[0].id) || null;
  tgCache[orgId] = { id, at: Date.now() };
  return id;
}

export async function createIikoOrder(pool, order) {
  try {
    const orgId = (order.branch && BRANCH_TO_ORG[order.branch]) || process.env.IIKO_ORGANIZATION_ID || null;
    if (!orgId) return { skipped: true, reason: 'org_not_set' };

    const ids = (order.items || []).map((i) => i.id);
    const r = await pool.query('SELECT id, iiko_id, price FROM menu_items WHERE id = ANY($1)', [ids]);
    const byId = new Map(r.rows.map((x) => [x.id, x]));
    // Modifikatorlar: iiko_product_id menyudagi variantlardan olinadi
    const optIds = [];
    for (const it of order.items || []) for (const g of (it.mods || [])) for (const op of (g.options || [])) if (op && op.option_id) optIds.push(op.option_id);
    const optMap = new Map();
    if (optIds.length) {
      try {
        const or_ = await pool.query('SELECT id, iiko_product_id, price FROM menu_mod_options WHERE id = ANY($1)', [...new Set(optIds)]);
        for (const r of or_.rows) optMap.set(r.id, r);
      } catch (me) { console.error('iiko mods lookup', me && me.message); }
    }
    const iikoItems = [];
    for (const it of order.items || []) {
      const m = byId.get(it.id);
      if (!m || !m.iiko_id) continue; // qo'lda qo'shilgan elementlar iiko'ga bormaydi
      const entry = { productId: m.iiko_id, type: 'Product', amount: it.q, price: Number(m.price) || 0 };
      const mods = [];
      for (const g of (it.mods || [])) for (const op of (g.options || [])) {
        const row = optMap.get(op.option_id);
        if (row && row.iiko_product_id) mods.push({ productId: row.iiko_product_id, type: 'Product', amount: Number(op.q) || 1, price: Number(row.price) || 0 });
      }
      if (mods.length) entry.modifiers = mods;
      iikoItems.push(entry);
    }
    if (!iikoItems.length) return { skipped: true, reason: 'no_iiko_items' };

    const isPickup = order.delivery_type === 'pickup';
    const orderBody = {
      items: iikoItems,
      phone: order.phone || '',
      orderServiceType: isPickup ? 'DeliveryPickUp' : 'DeliveryByCourier',
      customer: { name: String(order.name || '').slice(0, 120), type: 'regular' },
      customerComment: [order.note, order.name ? `Ism: ${order.name}` : null].filter(Boolean).join('; ') || undefined,
      payments: [{ paymentTypeKind: 'Cash', sum: Number(order.grand_total || order.total) || 0 }],
    };
    if (!isPickup && order.address) {
      orderBody.deliveryPoint = { address: { street: { name: String(order.address) }, house: '' } };
    }
    if (order.when && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(String(order.when))) {
      try { orderBody.deliveryDate = new Date(String(order.when).replace(' ', 'T') + ':00+05:00').toISOString(); } catch (te) {}
    }
    const terminalGroupId = await firstTerminalGroup(orgId).catch(() => null);
    const payload = { organizationId: orgId, ...(terminalGroupId ? { terminalGroupId } : {}), order: orderBody };
    const rr = await raw('/api/1/deliveries/create', await getToken(), payload);
    if (rr.status !== 200 || !rr.data) {
      const msg = (rr.data && (rr.data.errorDescription || rr.data.error || rr.data.description)) || `HTTP ${rr.status}`;
      return { ok: false, error: String(msg).slice(0, 300) };
    }
    const iikoId = (rr.data && rr.data.orderInfo && rr.data.orderInfo.id) || (rr.data && rr.data.id) || null;
    return { ok: true, iikoId };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e).slice(0, 300) };
  }
}
