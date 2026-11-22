// Telegram orqali admin kirish (Telegram Login, OIDC).
// NOTE: Hobby 12-funksiya limiti uchun alohida funksiya emas: _auth.js modul,
// admin.js ichidan chaqiriladi (vercel.json: /api/auth -> /api/admin?type=auth).
// Oqim: frontend oauth.telegram.org'ga yo'naltiriladi → Telegram code bilan
// qaytadi → shu yerda code id_token'ga almashtiriladi (client secret bilan),
// imzo JWKS orqali tekshiriladi → admin bo'lsa sessiya cookie qo'yiladi,
// bo'lmasa role='requested' qilib so'rov yoziladi va adminlarga xabar yuboriladi.
import crypto from 'crypto';
import { getPool } from './_db.js';
import { tgUserFrom, cors, failGuard, recordFail, safeEqual, rateLimit } from './_verify.js';
import { notifyUser } from './_notify.js';
import {
  readSession, makeSessionToken, sessionCookieHeader, clearSessionCookieHeader,
} from './_session.js';

const OIDC_ISS = 'https://oauth.telegram.org';
const JWKS_URL = 'https://oauth.telegram.org/.well-known/jwks.json';
const OIDC_TOKEN = 'https://oauth.telegram.org/token';

let jwksCache = null;
async function getJwks() {
  if (jwksCache && Date.now() - jwksCache.at < 3600e3) return jwksCache.keys;
  const r = await fetch(JWKS_URL);
  if (!r.ok) throw new Error('jwks fetch failed');
  const j = await r.json();
  jwksCache = { keys: j.keys || [], at: Date.now() };
  return jwksCache.keys;
}

const b64ToBuf = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/* id_token'ni tekshirish (RS256, JWKS). claims yoki null. */
async function verifyIdToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try {
    header = JSON.parse(b64ToBuf(parts[0]).toString('utf8'));
    claims = JSON.parse(b64ToBuf(parts[1]).toString('utf8'));
  } catch {
    return null;
  }
  if (header?.alg !== 'RS256' || !header?.kid) return null;
  const key = (await getJwks()).find((k) => k.kid === header.kid);
  if (!key) return null;
  const pub = crypto.createPublicKey({ key: { kty: 'RSA', n: key.n, e: key.e }, format: 'jwk' });
  if (!crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), pub, b64ToBuf(parts[2]))) return null;
  const clientId = await resolveClientId();
  if (!clientId) return null;
  if (claims.iss !== OIDC_ISS) return null;
  if (String(claims.aud) !== clientId) return null;
  if (!claims.exp || Date.now() / 1000 > Number(claims.exp)) return null;
  if (!claims.id) return null;
  return claims;
}

async function exchangeCode(code, code_verifier, redirect_uri) {
  const clientId = await resolveClientId();
  const secret = process.env.TELEGRAM_LOGIN_CLIENT_SECRET || '';
  if (!clientId || !secret || !code) return null;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect_uri || '',
    client_id: clientId,
    code_verifier: code_verifier || '',
  });
  const r = await fetch(OIDC_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    },
    body,
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.id_token || null;
}

let botInfoCache = null;
/* getMe: BOT_TOKEN orqali botning RAQAMLI id'i (oauth client_id shuni talab qiladi). */
let clientIdCache = null;
/* OIDC Client ID: env raqam bo'lsa o'sha, aks holda getMe orqali botning
   raqamli id'i (oauth.telegram.org client_id sifatida raqamni kutadi). */
async function resolveClientId() {
  if (clientIdCache) return clientIdCache;
  const env = String(process.env.TELEGRAM_LOGIN_CLIENT_ID || '').trim();
  if (/^\d+$/.test(env)) { clientIdCache = env; return env; }
  const info = await getBotInfo();
  if (info?.id) { clientIdCache = String(info.id); return clientIdCache; }
  return env || null;
}
async function getBotInfo() {
  if (botInfoCache && Date.now() - botInfoCache.at < 3600e3) return botInfoCache.info;
  const tok = process.env.BOT_TOKEN || '';
  if (!tok) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${tok}/getMe`);
    const j = await r.json();
    if (!j?.ok || !j.result?.id) return null;
    const info = { id: j.result.id, username: j.result.username };
    botInfoCache = { info, at: Date.now() };
    return info;
  } catch (e) {
    console.error('getMe', e?.message);
    return null;
  }
}

let ensured;
function ensureSchema() {
  if (!ensured) {
    ensured = getPool()
      .query(`ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text`)
      .then(() => true)
      .catch((e) => {
        console.error('auth ensureSchema', e?.message);
        ensured = undefined;
        return false;
      });
  }
  return ensured;
}

/* Adminlikni tekshirish: sessiya cookie → admin parol → Telegram initData admin. */
async function checkAdmin(req) {
  const sess = readSession(req);
  if (sess) {
    try {
      const r = await getPool().query('SELECT role FROM bot_users WHERE tg_id=$1', [sess.tg_id]);
      return r.rows[0]?.role === 'admin';
    } catch {
      return false;
    }
  }
  const key = req.headers['x-admin-key'] || '';
  if (key) {
    if (await failGuard(req, 'pw')) return false;
    if (safeEqual(key, process.env.ADMIN_PASSWORD)) return true;
    await recordFail(req, 'pw');
    return false;
  }
  const u = tgUserFrom(req);
  if (!u) return false;
  try {
    const r = await getPool().query('SELECT role FROM bot_users WHERE tg_id=$1', [u.id]);
    return r.rows[0]?.role === 'admin';
  } catch {
    return false;
  }
}

const cut = (v, n) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, n) : null;
};


/* --- Telegram Login Widget (rasmiy skript) tasdig'i --- */
function widgetCheckString(data) {
  return Object.keys(data)
    .filter((k) => k !== 'hash' && data[k] !== undefined && data[k] !== null && String(data[k]) !== '')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
}

/* Widget hash: secret_key = SHA256(bot_token), HMAC-SHA256(data_check_string). */
function verifyWidget(data, botToken) {
  if (!data || !data.hash || !botToken || !data.id || !data.auth_date) return false;
  try {
    const secret = crypto.createHash('sha256').update(String(botToken)).digest();
    const hmac = crypto.createHmac('sha256', secret).update(widgetCheckString(data)).digest('hex');
    if (!safeEqual(hmac, String(data.hash).toLowerCase())) return false;
    const authDate = Number(data.auth_date);
    if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) return false;
    return true;
  } catch {
    return false;
  }
}

/* Ro'lga qarab: admin bo'lsa sessiya cookie, bo'lmasa 'requested' + adminlarga xabar. */
async function finishLogin(res, p, secure, tgId, name, username, phone) {
  await p.query(
    `INSERT INTO bot_users (tg_id, name, username, phone)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tg_id) DO UPDATE SET
       name = COALESCE(EXCLUDED.name, bot_users.name),
       username = COALESCE(EXCLUDED.username, bot_users.username),
       phone = COALESCE(EXCLUDED.phone, bot_users.phone)`,
    [tgId, name, username, phone]
  );
  const r = await p.query('SELECT role FROM bot_users WHERE tg_id=$1', [tgId]);
  const role = r.rows[0]?.role || null;
  if (role === 'admin') {
    res.setHeader('Set-Cookie', sessionCookieHeader(makeSessionToken(tgId), secure));
    return res.status(200).json({ ok: true, role: 'admin' });
  }
  if (!role) {
    await p.query(`UPDATE bot_users SET role='requested' WHERE tg_id=$1 AND role IS NULL`, [tgId]);
    const admins = await p.query(`SELECT tg_id FROM bot_users WHERE role='admin'`);
    const who = name || (username ? '@' + username : `ID ${tgId}`);
    for (const a of admins.rows) {
      notifyUser(a.tg_id, `Yangi admin so'rovi: ${who}\nTasdiqlash uchun admin panelni oching.`);
    }
  }
  return res.status(200).json({ ok: false, pending: true });
}

export async function handleAuth(req, res) {
  cors(res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const p = getPool();
  if (!p) return res.status(503).json({ ok: false, error: 'db' });
  if (!(await ensureSchema())) return res.status(503).json({ ok: false, error: 'db' });
  const secure = req.headers['x-forwarded-proto'] === 'https';

  if (req.method === 'GET') {
    const action = String(req.query.action || 'me');
    if (action === 'me') {
      const sess = readSession(req);
      if (!sess) return res.status(200).json({ ok: false });
      try {
        const r = await p.query('SELECT role, name FROM bot_users WHERE tg_id=$1', [sess.tg_id]);
        if (r.rows[0]?.role === 'admin') return res.status(200).json({ ok: true, role: 'admin', name: r.rows[0].name });
        return res.status(200).json({ ok: false });
      } catch (e) {
        console.error('auth me', e?.message);
        return res.status(500).json({ ok: false });
      }
    }
    if (action === 'botinfo') {
      if (!(await rateLimit(req, 'botinfo', 60, 60 * 1000))) return res.status(429).json({ ok: false });
      const info = await getBotInfo();
      if (!info) return res.status(200).json({ ok: false });
      return res.status(200).json({ ok: true, id: info.id, username: info.username });
    }
    if (action === 'access') {
      if (!(await checkAdmin(req))) return res.status(401).json({ ok: false, error: 'auth' });
      const [admins, reqs] = await Promise.all([
        p.query(`SELECT tg_id, name, username, phone, created_at FROM bot_users WHERE role='admin' ORDER BY created_at`),
        p.query(`SELECT tg_id, name, username, phone, created_at FROM bot_users WHERE role='requested' ORDER BY created_at DESC`),
      ]);
      return res.status(200).json({ ok: true, admins: admins.rows, requests: reqs.rows });
    }
    return res.status(400).json({ ok: false });
  }

  if (req.method === 'POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = String(b.action || '');
    if (action === 'touch') {
      /* Telegram sessiyasi tirikligini tekshirish: amaldagi sessiya + yangi,
         imzolangan initData (shu foydalanuvchi) bo'lsa sessiya uzaytiriladi.
         initData yo'q, eski yoki boshqa foydalanuvnikisa — sessiya qolmaydi. */
      const sess = readSession(req);
      if (!sess) return res.status(401).json({ ok: false, error: 'session_expired' });
      const u = tgUserFrom(req);
      if (!u || String(u.id) !== String(sess.tg_id)) {
        return res.status(401).json({ ok: false, error: 'session_expired' });
      }
      res.setHeader('Set-Cookie', sessionCookieHeader(makeSessionToken(sess.tg_id), secure));
      return res.status(200).json({ ok: true });
    }

    if (action === 'tg-login' || action === 'widget-login') {
      if (!(await rateLimit(req, 'auth', 20, 10 * 60 * 1000))) return res.status(429).json({ ok: false, error: 'rate' });
    }

    if (action === 'tg-login') {
      try {
        const idToken = await exchangeCode(b.code, b.code_verifier, b.redirect_uri);
        if (!idToken) return res.status(401).json({ ok: false, error: 'auth' });
        const claims = await verifyIdToken(idToken);
        if (!claims) return res.status(401).json({ ok: false, error: 'auth' });
        const tgId = Number(claims.id);
        const name = cut(claims.name || claims.given_name, 80);
        const username = cut(claims.preferred_username, 40);
        const phone = cut(claims.phone_number, 24);
        if (String(b.scope || '') === 'user') {
          /* Mijoz sifatida kirish (OIDC): admin tasdig'i shart emas. */
          await p.query(
            `INSERT INTO bot_users (tg_id, name, username)
             VALUES ($1,$2,$3)
             ON CONFLICT (tg_id) DO UPDATE SET
               name = COALESCE(EXCLUDED.name, bot_users.name),
               username = COALESCE(EXCLUDED.username, bot_users.username)`,
            [tgId, name, username]
          );
          await p.query(`UPDATE bot_users SET role='user' WHERE tg_id=$1 AND role IS NULL`, [tgId]);
          return res.status(200).json({ ok: true, role: 'user', tg_id: tgId, name });
        }
        return finishLogin(res, p, secure, tgId, name, username, phone);
      } catch (e) {
        console.error('tg-login', e?.message);
        return res.status(500).json({ ok: false, error: 'server' });
      }
    }


    if (action === 'widget-login') {
      try {
        const u = b.user || {};
        if (!verifyWidget(u, process.env.BOT_TOKEN)) return res.status(401).json({ ok: false, error: 'auth' });
        const tgId = Number(u.id);
        if (!Number.isFinite(tgId)) return res.status(400).json({ ok: false });
        const name = cut([u.first_name, u.last_name].filter(Boolean).join(' '), 80);
        const username = cut(u.username, 40);
        if (String(b.scope || '') === 'user') {
          /* Mijoz sifatida kirish: admin tasdig'i shart emas. */
          await p.query(
            `INSERT INTO bot_users (tg_id, name, username)
             VALUES ($1,$2,$3)
             ON CONFLICT (tg_id) DO UPDATE SET
               name = COALESCE(EXCLUDED.name, bot_users.name),
               username = COALESCE(EXCLUDED.username, bot_users.username)`,
            [tgId, name, username]
          );
          await p.query(`UPDATE bot_users SET role='user' WHERE tg_id=$1 AND role IS NULL`, [tgId]);
          return res.status(200).json({ ok: true, role: 'user', tg_id: tgId, name });
        }
        return finishLogin(res, p, secure, tgId, name, username, null);
      } catch (e) {
        console.error('widget-login', e?.message);
        return res.status(500).json({ ok: false, error: 'server' });
      }
    }
    if (action === 'access-decide') {
      if (!(await checkAdmin(req))) return res.status(401).json({ ok: false, error: 'auth' });
      const tgId = Number(b.tg_id);
      if (!Number.isFinite(tgId)) return res.status(400).json({ ok: false });
      const approve = b.approve === true || b.approve === 'true';
      if (approve) {
        await p.query(`UPDATE bot_users SET role='admin' WHERE tg_id=$1`, [tgId]);
        notifyUser(tgId, `Sizga admin panelga kirish huquqi berildi. Panel: ${process.env.WEBAPP_URL || ''}admin`);
      } else {
        await p.query(`UPDATE bot_users SET role=NULL WHERE tg_id=$1 AND role='requested'`, [tgId]);
        notifyUser(tgId, `Admin so'rovingiz rad etildi.`);
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'logout') {
      res.setHeader('Set-Cookie', clearSessionCookieHeader(secure));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false });
  }

  return res.status(405).json({ ok: false });
};
