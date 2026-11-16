// /api/upload — admin-only base64 image upload into menu_imgs (ported from upload.js).
import crypto from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { tgUserFrom, rateLimit, failGuard, recordFail } from '../lib/security.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function isAdmin(req: FastifyRequest): Promise<boolean> {
  const key = (req.headers['x-admin-key'] as string) || '';
  if (key) {
    if (failGuard(req, 'pw')) return false;
    if (key === (process.env.ADMIN_PASSWORD || '')) return true;
    recordFail(req, 'pw');
    return false;
  }
  const u = tgUserFrom(req);
  if (!u) return false;
  try {
    const r = await pool.query('SELECT role FROM bot_users WHERE tg_id=$1', [u.id]);
    return (r.rows[0] as Any)?.role === 'admin';
  } catch { return false; }
}

export async function uploadHandler(req: FastifyRequest, reply: FastifyReply) {
  if (req.method !== 'POST') return reply.code(405).send({ ok: false });
  if (!rateLimit(req, 'upl', 10, 10 * 60 * 1000)) return reply.code(429).send({ ok: false, error: 'Juda ko\u02bbp urinish' });
  if (!(await isAdmin(req))) return reply.code(401).send({ ok: false, error: 'auth' });
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: Any = (req.body || {}) as Any;
    const m = String(b.data || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return reply.code(400).send({ ok: false, error: 'Rasm formati noto\u02bbg\u02bbri' });
    const mime = m[1], buf = Buffer.from(m[2], 'base64');
    if (buf.length > 1024 * 1024) return reply.code(400).send({ ok: false, error: 'Rasm juda katta' });
    const id = 'up_' + crypto.randomUUID();
    await pool.query('INSERT INTO menu_imgs (id, mime, data) VALUES ($1,$2,$3)', [id, mime, buf]);
    return reply.code(200).send({ ok: true, id });
  } catch (e) {
    return reply.code(500).send({ ok: false, error: (e as Error)?.message });
  }
}
