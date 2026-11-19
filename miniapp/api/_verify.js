import crypto from 'crypto';
import { getPool } from './_db.js';

// Telegram initData yoshi chegarasi. Foydalanuvchi ilovani soatlab ochiq
// saqlashi mumkinligi uchun 24 soat — ataylab qisqartirilmagan.
export const INIT_DATA_MAX_AGE_SECONDS = 86400;

// Telegram initData imzosini serverda tekshirish (HMAC-SHA256, BOT_TOKEN bilan)
export function verifyInitData(initData) {
  if (!initData || typeof initData !== 'string') return null;
  const token = process.env.BOT_TOKEN;
  if (!token) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');
    params.delete('sig');
    const dataCheck = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const h = crypto.createHmac('sha256', secret).update(dataCheck).digest();
    // solishtirish vaqt-hujumga chidamli usulda
    const given = Buffer.from(hash, 'hex');
    if (given.length !== h.length || !crypto.timingSafeEqual(given, h)) return null;
    const authDate = Number(params.get('auth_date') || 0);
    // initData INIT_DATA_MAX_AGE_SECONDS dan eskirsa qabul qilmaymiz
    if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;
    let user = null;
    try { user = JSON.parse(params.get('user') || 'null'); } catch {}
    if (!user || typeof user.id !== 'number') return null;
    return user;
  } catch {
    return null;
  }
}

export function tgUserFrom(req) {
  return verifyInitData(req.headers['x-init-data']);
}

// Sirlarni solishtirish: vaqt-hujumga chidamli (admin parol, webhook sirlari)
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  if (ba.length !== bb.length) {
    // uzunlik oshkor bo'lmasin: baribir solishtiramiz, natija false
    try { crypto.timingSafeEqual(ba, ba); } catch {}
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------------------
// IP-limitlar: serverless instansiyalar o'rtasida umumiy bo'lishi uchun
// Postgresda saqlanadi (mavjud DATABASE_URL, yangi xizmat yo'q).
// MUHIM: baza yetmasa yoki xato bersa — ZAXIRA xotira-limiter ishlaydi va
// xato loglanadi (FAIL OPEN): haqiqiy xaridor limiter xatosi tufayli
// buyurtma bera olmay qolmaydi.
// ---------------------------------------------------------------------------
const memHits = new Map(); // zaxira limiter (DB yetsa ishlatilmaydi)
const memFails = new Map();

let rateTableReady = null;
function ensureRateTable() {
  const p = getPool();
  if (!p) return Promise.resolve(false);
  if (!rateTableReady) {
    rateTableReady = p.query(
      `CREATE TABLE IF NOT EXISTS rate_limits (
         key text PRIMARY KEY,
         window_start timestamptz NOT NULL DEFAULT now(),
         count int NOT NULL DEFAULT 0)`
    ).then(() => true).catch((e) => {
      console.error('rate_limits jadvali', e?.message);
      rateTableReady = null; // keyingi so'rovda yana urinib ko'riladi
      return false;
    });
  }
  return rateTableReady;
}

function ipKey(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').toString().split(',')[0].trim();
}

const keyOf = (req, key) => `${key}:${ipKey(req)}`;

// Oynani bitta atomik upsert bilan yangilaydi; {count} qaytaradi.
// DB xatosida null qaytaradi (zaxiraga o'tish belgisi).
async function bump(key, windowMs) {
  const p = getPool();
  if (!p) return null;
  if (!await ensureRateTable()) return null;
  try {
    const r = await p.query(
      `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start > now() - make_interval(secs => $2::double precision)
                      THEN rate_limits.count + 1 ELSE 1 END,
         window_start = CASE WHEN rate_limits.window_start > now() - make_interval(secs => $2::double precision)
                      THEN rate_limits.window_start ELSE now() END
       RETURNING count`,
      [key, windowMs / 1000]);
    // eskirgan qatorlarni ba'zan tozalaymiz (jadval kichik qoladi)
    if (Math.random() < 0.02) p.query(`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`).catch(() => {});
    return { count: r.rows[0]?.count ?? 1 };
  } catch (e) {
    console.error('rate limit db', e?.message);
    return null;
  }
}

// Xotira zaxirasi: eskirgan yozuvlarni tozalab, yangi hujumni hisoblaydi
function memBump(map, key, windowMs) {
  const now = Date.now();
  const arr = (map.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  map.set(key, arr);
  return arr;
}
function memCount(map, key, windowMs) {
  const now = Date.now();
  const arr = (map.get(key) || []).filter((t) => now - t < windowMs);
  map.set(key, arr);
  return arr.length;
}

// true = ruxsat (oynada max tadan ko'p bo'lmasa)
export async function rateLimit(req, key, max, windowMs) {
  const k = keyOf(req, key);
  const res = await bump(k, windowMs);
  if (res == null) return memCount(memHits, k, windowMs) < max; // FAIL OPEN: zaxira
  return res.count <= max;
}

// true = bloklangan (oynada kamida max marta xato bo'lgan)
export async function failGuard(req, key, max = 8, windowMs = 15 * 60 * 1000) {
  const k = keyOf(req, key);
  const p = getPool();
  if (p && await ensureRateTable()) {
    try {
      const r = await p.query(
        `SELECT count FROM rate_limits WHERE key = $1 AND window_start > now() - make_interval(secs => $2::double precision)`,
        [k, windowMs / 1000]);
      return (r.rows[0]?.count || 0) >= max;
    } catch (e) {
      console.error('failGuard db', e?.message);
    }
  }
  return memCount(memFails, k, windowMs) >= max; // zaxira
}

// Xatoni qayd etadi (DB yetsa bazada, aks holda xotirada)
export async function recordFail(req, key) {
  const k = keyOf(req, key);
  const res = await bump(k, 15 * 60 * 1000);
  if (res != null) return;
  memBump(memFails, k, 15 * 60 * 1000); // zaxira
}

export const APP_ORIGIN = process.env.WEBAPP_ORIGIN || 'https://tekit-sushi-miniapp.vercel.app';
export function cors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', APP_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key, X-Init-Data, X-Tg-Id');
  res.setHeader('Vary', 'Origin');
}
