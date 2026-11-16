// GET  /api/me — foydalanuvchi mavjudligi, roli va profili (serverdan).
// POST /api/me — profilni saqlash (onboarding yoki manzil o'zgarishi).
// Ported from web/api/me.js (behavior-identical). Mini ilova ochilishida
// darhol chaqiriladi: profil shu yerdan qaytadi, kesh faqat UI holatini saqlaydi.
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { tgUserFrom } from '../lib/security.js';

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const u = tgUserFrom(req);
  if (!u) return reply.code(401).send({ ok: false });
  const id = u.id;
  try {
    await pool.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text, ADD COLUMN IF NOT EXISTS addr text, ADD COLUMN IF NOT EXISTS lat double precision, ADD COLUMN IF NOT EXISTS lon double precision');
    const r = await pool.query('SELECT role, name, phone, addr, lat, lon FROM bot_users WHERE tg_id=$1', [id]);
    const row = r.rows[0] as Record<string, unknown> | undefined;
    const first = String((u as any).first_name || '');
    let name = String(row?.name || first || '');
    let phone = String(row?.phone || '');
    let addr = String(row?.addr || '');
    let lat = row?.lat ?? null;
    let lon = row?.lon ?? null;
    if (!phone || !addr) {
      try {
        const o = await pool.query('SELECT name, phone, address, lat, lon FROM orders WHERE tg_user_id=$1 ORDER BY id DESC LIMIT 1', [id]);
        const ord = o.rows[0] as Record<string, unknown> | undefined;
        if (ord) {
          if (!phone && ord.phone) phone = String(ord.phone);
          if (!name && ord.name) name = String(ord.name);
          if (!addr && ord.address) { addr = String(ord.address); lat = ord.lat ?? lat; lon = ord.lon ?? lon; }
        }
      } catch { /* orders jadvali bo'lmasa jim o'tadi */ }
    }
    // "mavjud" = ishlatiladigan profil bor (telefon yoki manzil); aks holda onboarding
    const exists = !!(phone || addr);
    return reply.code(200).send({ ok: true, exists, role: (row?.role as string | undefined) || null, user: { name, phone, addr, lat, lon } });
  } catch (e) {
    console.error('me error', (e as Error)?.message);
    return reply.code(500).send({ ok: false });
  }
}

export async function mePostHandler(req: FastifyRequest, reply: FastifyReply) {
  const u = tgUserFrom(req);
  if (!u) return reply.code(401).send({ ok: false });
  const id = u.id;
  try {
    await pool.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text, ADD COLUMN IF NOT EXISTS addr text, ADD COLUMN IF NOT EXISTS lat double precision, ADD COLUMN IF NOT EXISTS lon double precision');
    const raw: any = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const b = raw || {};
    const first = String((u as any).first_name || '');
    const name = String(b.name || '').trim().slice(0, 80) || first;
    const phone = String(b.phone || '').trim().slice(0, 24) || null;
    const addr = String(b.addr || '').trim().slice(0, 300) || null;
    const lat = b.lat != null && Number.isFinite(Number(b.lat)) ? Number(b.lat) : null;
    const lon = b.lon != null && Number.isFinite(Number(b.lon)) ? Number(b.lon) : null;
    await pool.query(
      `INSERT INTO bot_users (tg_id, name, username, lang, phone, addr, lat, lon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (tg_id) DO UPDATE SET
         name = COALESCE(NULLIF(EXCLUDED.name, ''), bot_users.name),
         username = COALESCE(EXCLUDED.username, bot_users.username),
         lang = COALESCE(EXCLUDED.lang, bot_users.lang),
         phone = COALESCE(EXCLUDED.phone, bot_users.phone),
         addr = COALESCE(EXCLUDED.addr, bot_users.addr),
         lat = COALESCE(EXCLUDED.lat, bot_users.lat),
         lon = COALESCE(EXCLUDED.lon, bot_users.lon)`,
      [id, name, (u as any).username || null, (u as any).language_code || null, phone, addr, lat, lon]);
    return reply.code(200).send({ ok: true });
  } catch (e) {
    console.error('me post error', (e as Error)?.message);
    return reply.code(500).send({ ok: false });
  }
}
