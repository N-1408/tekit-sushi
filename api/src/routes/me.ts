// GET /api/me — role of the signed-in Telegram user.
// Ported from web/api/me.js (behavior-identical).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { tgUserFrom } from '../lib/security.js';

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const u = tgUserFrom(req);
  if (!u) return reply.code(401).send({ ok: false });
  const id = u.id;
  try {
    await pool.query('ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS role text');
    const r = await pool.query('SELECT role FROM bot_users WHERE tg_id=$1', [id]);
    return reply.code(200).send({ ok: true, role: (r.rows[0] as { role?: string } | undefined)?.role || null });
  } catch (e) {
    console.error('me error', (e as Error)?.message);
    return reply.code(500).send({ ok: false });
  }
}
