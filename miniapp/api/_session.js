// Admin sessiyasi: imzolangan cookie (HMAC-SHA256).
// DBda sessiya saqlanmaydi: token o'zida ma'lumot + imzo; "admin"lik har
// so'rovda bazadan tekshiriladi, shuning uchun huquqni olish/olish bekor
// qilish darhol kuchga kiradi.
import crypto from 'crypto';

const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.TELEGRAM_WEBHOOK_SECRET ||
  process.env.BOT_TOKEN ||
  '';
export const SESSION_COOKIE = 'tk-sess';
const MAX_AGE = 12 * 3600; // 12 soat (sessiya timeout)
/* Sessiya Telegram bilan bog'langan: tgv = oxirgi muvaffaqiyatli Telegram
   tasdig'i (kirish yoki initData touch). Telegram'da sessiya yopilsa,
   sayt ham eng ko'p shu muddatdan keyin tushiradi. */
const TG_RECHECK_MAX = 12 * 3600;

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function sessionEnabled() {
  return !!SECRET;
}

export function makeSessionToken(tgId, tgv = Math.floor(Date.now() / 1000)) {
  const payload = Buffer.from(
    JSON.stringify({ tg_id: tgId, tgv: Number(tgv) || Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + MAX_AGE })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSession(req) {
  if (!SECRET) return null;
  const raw = String(req.headers.cookie || '');
  const m = raw.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!m) return null;
  const [payload, sig] = String(m[1]).split('.');
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Date.now() / 1000;
    if (!data?.tg_id || !data?.exp || now > Number(data.exp)) return null;
    if (!data?.tgv || now - Number(data.tgv) > TG_RECHECK_MAX) return null;
    return data;
  } catch {
    return null;
  }
}

function cookieHeader(token, maxAge, secure) {
  const base = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
  return secure ? `${base}; Secure` : base;
}

export function sessionCookieHeader(token, secure = true) {
  return cookieHeader(token, MAX_AGE, secure);
}
export function clearSessionCookieHeader(secure = true) {
  return cookieHeader('', 0, secure);
}
