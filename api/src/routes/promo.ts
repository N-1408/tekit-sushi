// GET /api/promo?code=TEKIT10 — promo check.
// Ported from web/api/promo.js (behavior-identical).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';

let ensured: Promise<boolean> | undefined;
function ensureSchema(): Promise<boolean> {
  if (!ensured) {
    ensured = pool.query(
      `CREATE TABLE IF NOT EXISTS promos (code text PRIMARY KEY, percent int NOT NULL, active boolean NOT NULL DEFAULT true);
       INSERT INTO promos (code, percent) VALUES ('TEKIT10', 10) ON CONFLICT (code) DO NOTHING;`,
    ).then(() => true).catch((e) => { console.error('promo ensureSchema', e); return false; });
  }
  return ensured;
}

export async function promoHandler(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Record<string, string | undefined>;
  const code = (q.code || '').trim().toUpperCase();
  if (!code) return reply.code(400).send({ ok: false, error: 'Kod yo\'q' });
  try {
    if (!(await ensureSchema())) return reply.code(500).send({ ok: false, error: 'Server xatosi' });
    const r = await pool.query('SELECT percent FROM promos WHERE code=$1 AND active=true', [code]);
    if (r.rowCount === 0) return reply.code(404).send({ ok: false, error: 'not_found' });
    return reply.code(200).send({ ok: true, code, percent: (r.rows[0] as { percent: number }).percent });
  } catch (e) {
    console.error('promo error', e);
    return reply.code(500).send({ ok: false, error: 'Server xatosi' });
  }
}
