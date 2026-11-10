import crypto from 'crypto';

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
    const h = crypto.createHmac('sha256', secret).update(dataCheck).digest('hex');
    if (h !== hash) return null;
    const authDate = Number(params.get('auth_date') || 0);
    // initData 1 soatdan eskirsa qabul qilmaymiz
    if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
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

// Oddiy IP-limit: mapga tayangan engil cheklov
const hits = new Map();
export function rateLimit(req, key, max, windowMs) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').toString().split(',')[0].trim();
  const k = `${key}:${ip}`;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  hits.set(k, arr);
  return true;
}

const fails = new Map();
export function failGuard(req, key, max = 8, windowMs = 15 * 60 * 1000) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').toString().split(',')[0].trim();
  const k = `${key}:${ip}`;
  const now = Date.now();
  const arr = (fails.get(k) || []).filter(t => now - t < windowMs);
  fails.set(k, arr);
  return arr.length >= max;
}
export function recordFail(req, key) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').toString().split(',')[0].trim();
  const k = `${key}:${ip}`;
  const arr = fails.get(k) || [];
  arr.push(Date.now());
  fails.set(k, arr);
}

export const APP_ORIGIN = process.env.WEBAPP_ORIGIN || 'https://tekit-sushi-miniapp.vercel.app';
export function cors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', APP_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key, X-Init-Data, X-Tg-Id');
  res.setHeader('Vary', 'Origin');
}
