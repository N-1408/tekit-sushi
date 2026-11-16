import { Pool } from 'pg';
import { cors, rateLimit } from './_verify.js';
import { createDelivery, quoteDelivery, cityOf, TASHKENT_RE } from './_delivery.js';
import { notifyUser } from './_notify.js';
import { BRANCH_IDS, pickupCfgFrom, readSettings, tkNow } from './_fulfillment.js';

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
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount int DEFAULT 0;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_note text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_at timestamptz;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_amount int;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_provider text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_external_id text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee int DEFAULT 0;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS grand_total int;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_ref text;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS lat double precision;
       ALTER TABLE orders ADD COLUMN IF NOT EXISTS lon double precision;
       CREATE UNIQUE INDEX IF NOT EXISTS orders_client_ref_uidx ON orders (client_ref);`
    ).then(() => true).catch(e => { console.error('ensureSchema', e); return false; });
  }
  return ensured;
}

function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(-9);
  return d.length === 9 ? `+998${d}` : null;
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
    // klient maydon nomlarini moslash
    o.address = o.address || o.addr || null;
    o.payment = o.payment || o.pay || 'cash';
    // eski klientlar 'card' yuborsa ham: integratsiya yo'q bo'lsa faqat naqd (yoki kelajakdagi 'online')
    if (o.payment !== 'cash' && o.payment !== 'online') o.payment = 'cash';
    if (o.delivery_type !== 'delivery' && o.delivery_type !== 'pickup') {
      o.delivery_type = (o.mode === 'pickup') ? 'pickup' : 'delivery';
    }
    if (!Array.isArray(o.items) || o.items.length === 0 || o.items.length > 60) {
      return res.status(400).json({ ok: false, error: 'Buyurtma tarkibi noto\u02bbg\u02bbri' });
    }
    const cleanItems = o.items
      .filter(i => i && typeof i.id === 'string' && Number(i.q) > 0)
      .map(i => ({ id: String(i.id).slice(0, 40), q: Math.min(50, Math.round(Number(i.q))) }));
    if (!cleanItems.length) return res.status(400).json({ ok: false, error: 'Buyurtma tarkibi noto\u02bbg\u02bbri' });

    // Mijoz ma'lumotlari: ism va telefon formati server tomonda tekshiriladi
    const name = String(o.name).trim().slice(0, 80);
    if (name.length < 2) return res.status(422).json({ ok: false, error: 'name_required' });
    const phone = normPhone(o.phone);
    if (!phone) return res.status(422).json({ ok: false, error: 'phone_invalid' });

    // Idempotentlik: bir xil client_ref — bir xil buyurtma (qayta yuborish/dubl xavfsiz)
    const clientRef = String(o.client_ref || '').trim().slice(0, 64) || null;
    if (clientRef) {
      try {
        const ex = await getPool().query(
          'SELECT id, created_at, total, delivery_fee, grand_total FROM orders WHERE client_ref = $1',
          [clientRef]);
        if (ex.rowCount > 0) {
          const r0 = ex.rows[0];
          return res.status(200).json({
            ok: true, duplicate: true, order_id: r0.id, created_at: r0.created_at,
            total: r0.grand_total != null ? r0.grand_total : Number(r0.total) + Number(r0.delivery_fee || 0),
            delivery_fee: Number(r0.delivery_fee || 0),
          });
        }
      } catch (ie) { console.error('client_ref lookup', ie?.message); }
    }

    // Summani serverda menyudan hisoblaymiz; mavjudlik ham tekshiriladi
    const ids = cleanItems.map(i => i.id);
    let serverSum = null, unavailable = [];
    try {
      const pr = await getPool().query('SELECT id, price, active FROM menu_items WHERE id = ANY($1)', [ids]);
      const priceById = new Map(pr.rows.filter(r => r.active !== false).map(r => [r.id, Number(r.price)]));
      unavailable = cleanItems.filter(i => !priceById.has(i.id)).map(i => i.id);
      if (unavailable.length) {
        return res.status(422).json({ ok: false, error: 'unavailable_items', items: unavailable });
      }
      serverSum = cleanItems.reduce((s, i) => s + (priceById.get(i.id) || 0) * i.q, 0);
    } catch (e) { console.error('price lookup', e?.message); }
    if (serverSum == null) {
      return res.status(500).json({ ok: false, error: 'Server xatosi' });
    }

    // promokodni server tomonda tekshiramiz (client total ishonchsiz)
    let promoCode = null, discount = 0;
    let total = serverSum;
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

    // Fulfillment validatsiyasi: filial, vaqt va qamrov — haqiqiy qoidalar bo'yicha
    let pickupCfg = null;
    try {
      pickupCfg = pickupCfgFrom(await readSettings(getPool()));
    } catch { /* sozlanmagan */ }

    if (o.delivery_type === 'pickup') {
      const branch = String(o.branch || '').trim().toLowerCase();
      if (!BRANCH_IDS.includes(branch)) {
        return res.status(422).json({ ok: false, error: 'branch_invalid' });
      }
      o.branch = branch;
      o.address = null;
      o.lat = null; o.lon = null;
      const when = String(o.when || '').trim();
      if (when) {
        if (!pickupCfg) {
          return res.status(422).json({ ok: false, error: 'pickup_schedule_unconfigured' });
        }
        const m = String(when).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
        if (!m) return res.status(422).json({ ok: false, error: 'when_invalid' });
        const [, Y, Mo, D, H, Mi] = m;
        const dt = new Date(Date.UTC(Number(Y), Number(Mo) - 1, Number(D), Number(H), Number(Mi)));
        if (dt.getUTCFullYear() !== Number(Y) || dt.getUTCMonth() !== Number(Mo) - 1 || dt.getUTCDate() !== Number(D)) {
          return res.status(422).json({ ok: false, error: 'when_invalid' });
        }
        if (pickupCfg.slot_minutes && (Number(H) * 60 + Number(Mi)) % pickupCfg.slot_minutes !== 0) {
          return res.status(422).json({ ok: false, error: 'when_not_on_slot' });
        }
        const now = tkNow();
        const wDay = `${Y}-${Mo}-${D}`;
        const wm = Number(H) * 60 + Number(Mi);
        const lead = pickupCfg.prep_minutes || 0;
        if (wDay < now.ymd || (wDay === now.ymd && wm < now.minutes + lead + 1)) {
          return res.status(422).json({ ok: false, error: 'when_too_soon' });
        }
        const maxD = new Date(Date.UTC(Number(now.ymd.slice(0, 4)), Number(now.ymd.slice(5, 7)) - 1, Number(now.ymd.slice(8, 10)) + (pickupCfg.days_ahead || 7)));
        if (wDay > maxD.toISOString().slice(0, 10)) {
          return res.status(422).json({ ok: false, error: 'when_out_of_range' });
        }
        o.when = `${wDay} ${H}:${Mi}`;
      } else {
        o.when = null; // imkon qadar tezroq
      }
    } else {
      // Yetkazib berish: manzil majburiy; kordinata kelsa qamrov tekshiriladi
      o.branch = null;
      o.when = null;
      const addr = String(o.address || '').trim().slice(0, 300);
      if (addr.length < 6) {
        return res.status(422).json({ ok: false, error: 'address_required' });
      }
      o.address = addr;
      const lat = Number(o.lat), lon = Number(o.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        const city = await cityOf(lat, lon);
        if (city && !TASHKENT_RE.test(String(city).trim())) {
          return res.status(422).json({ ok: false, error: 'outside_coverage' });
        }
        o.lat = lat; o.lon = lon;
      } else {
        o.lat = null; o.lon = null;
      }
    }

    // Yetkazib berish narxi: 200 000 so'mdan yuqorida bepul, pastida Millennium/Noor API (yoki standart narx)
    let deliveryFee = 0;
    if (o.delivery_type === 'delivery') {
      const threshold = Number(process.env.DELIVERY_FREE_THRESHOLD || 200000);
      if (finalTotal < threshold) {
        try {
          const q = await quoteDelivery({ address: o.address || '', subtotal: finalTotal, ...(o.lat != null ? { lat: o.lat, lon: o.lon } : {}) });
          deliveryFee = Math.max(0, Math.round(Number(q.price) || 0));
        } catch (qe) { console.error('delivery quote', qe?.message); deliveryFee = Math.max(0, Number(process.env.DELIVERY_FEE ?? 0)); }
      }
    }
    const grandTotal = finalTotal + deliveryFee;
    const pool = getPool();
    const changeAmount = o.change_amount != null ? Math.max(0, Math.round(Number(o.change_amount) || 0)) : null;
    const result = await pool.query(
      `INSERT INTO orders (tg_user_id, name, phone, address, branch, delivery_type, payment, items, total, note, delivery_time, promo_code, discount, change_amount, payment_status, delivery_provider, delivery_fee, grand_total, client_ref, lat, lon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (client_ref) DO NOTHING
       RETURNING id, created_at`,
      [
        o.tg_user_id || null,
        name,
        phone,
        o.address || null,
        o.branch || null,
        o.delivery_type,
        o.payment || 'cash',
        JSON.stringify(cleanItems.map(i => {
          const src = (o.items || []).find(x => x && x.id === i.id) || {};
          return { id: i.id, title: String(src.title || i.id).slice(0, 120), q: i.q, price: Number(src.price) || 0 };
        })),
        finalTotal,
        o.note ? String(o.note).slice(0, 500) : null,
        o.when || null,
        promoCode,
        discount,
        changeAmount,
        'pending',
        (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase(),
        deliveryFee,
        grandTotal,
        clientRef,
        o.lat != null ? o.lat : null,
        o.lon != null ? o.lon : null,
      ]
    );
    let row = result.rows[0];
    let duplicate = false;
    if (!row && clientRef) {
      // poyga: boshqa so'rov bir vaqtda kiritdi — mavjud buyurtmani qaytaramiz
      const ex = await pool.query('SELECT id, created_at FROM orders WHERE client_ref = $1', [clientRef]);
      row = ex.rows[0];
      duplicate = true;
    }
    if (!row) return res.status(500).json({ ok: false, error: 'Server xatosi' });
    // Adapterlar: to'lov va yetkazib berish (mock rejimda no-op, shartnoma kelsa ishlaydi)
    if (!duplicate) {
      try {
        const delivery = await createDelivery({ id: row.id, address: o.address, phone, name, note: o.note, total: finalTotal });
        if (delivery.provider !== 'own' && delivery.external_id) {
          await pool.query('UPDATE orders SET delivery_external_id=$1, delivery_status=$2 WHERE id=$3', [String(delivery.external_id), delivery.status, row.id]);
        }
      } catch (de) { console.error('delivery adapter', de?.message); }
      // Mijozga Telegram xabari (bepul, SMS o'rniga)
      if (o.tg_user_id) {
        const lines = cleanItems.map(i => `• ${(o.items || []).find(x => x && x.id === i.id)?.title || i.id} ×${i.q}`).join('\n');
        const payTxt = o.payment === 'cash'
          ? (changeAmount ? `Naqd pul, qaytim ${changeAmount.toLocaleString('ru-RU')} so'm` : 'Naqd pul')
          : 'Kartaga o\u02bbtkazish';
        void notifyUser(o.tg_user_id, `<b>Buyurtma #${row.id} qabul qilindi</b>\n${lines}\n\nJami: ${grandTotal.toLocaleString('ru-RU')} so'm${deliveryFee ? `\nYetkazib berish: ${deliveryFee.toLocaleString('ru-RU')} so'm` : ''}\nTo'lov: ${payTxt}\n\nTasdiqlash haqida alohida xabar beramiz. Rahmat! \u2764\uFE0F`).catch(() => {});
      }
    }
    return res.status(201).json({ ok: true, order_id: row.id, created_at: row.created_at, total: grandTotal, grand_total: grandTotal, delivery_fee: deliveryFee, duplicate });
  } catch (e) {
    console.error('order insert error', e);
    return res.status(500).json({ ok: false, error: 'Server xatosi' });
  }
};
