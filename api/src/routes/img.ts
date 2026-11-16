// /api/img — binary image served from the menu_imgs table (ported from img.js).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';

let ensured: Promise<boolean> | undefined;
function ensureSchema(): Promise<boolean> {
  if (!ensured) {
    ensured = pool.query(`CREATE TABLE IF NOT EXISTS menu_imgs (
      id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz DEFAULT now())`)
      .then(() => true).catch(() => false);
  }
  return ensured;
}

export async function imgHandler(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as Record<string, string | undefined>;
  const id = String(q.id || '').slice(0, 60);
  if (!/^up_[a-z0-9-]+$/i.test(id)) return reply.code(400).send({ ok: false });
  if (!(await ensureSchema())) return reply.code(500).send({ ok: false });
  try {
    const r = await pool.query('SELECT mime, data FROM menu_imgs WHERE id=$1', [id]);
    if (!r.rowCount) return reply.code(404).send({ ok: false });
    const row = r.rows[0] as { mime: string; data: Buffer };
    reply.type(row.mime || 'image/jpeg');
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    return reply.send(Buffer.from(row.data));
  } catch (e) {
    return reply.code(500).send({ ok: false, error: (e as Error)?.message });
  }
}
