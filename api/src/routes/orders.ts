// GET /api/orders — the signed-in user's last 30 orders.
// Ported from web/api/orders.js (behavior-identical).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { tgUserFrom } from '../lib/security.js';

export async function ordersHandler(req: FastifyRequest, reply: FastifyReply) {
  const u = tgUserFrom(req);
  if (!u) return reply.code(401).send({ ok: false, error: 'auth' });
  const tg = String(u.id);
  try {
    const r = await pool.query(
      `SELECT id, created_at, total, grand_total, delivery_fee, discount, promo_code, status, items,
              name, phone, address, branch, delivery_type, delivery_time, payment, payment_status, status_note
       FROM orders WHERE tg_user_id = $1 ORDER BY id DESC LIMIT 30`, [tg]);
    return reply.code(200).send({ ok: true, orders: r.rows });
  } catch (e) {
    console.error('orders error', e);
    return reply.code(500).send({ ok: false, error: 'Server xatosi' });
  }
}
