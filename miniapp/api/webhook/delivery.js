import { Pool } from 'pg';
import { cors } from '../_verify.js';
import { checkDeliveryWebhookSecret } from '../delivery.js';

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}

export default async (req, res) => {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  const secret = req.headers['x-webhook-secret'] || req.body?.secret;
  if (!checkDeliveryWebhookSecret(secret)) return res.status(401).json({ ok: false, error: 'Bad secret' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const orderId = b.order_id || b.external_id;
    if (!orderId) return res.status(400).json({ ok: false, error: 'order_id yo\\u02bbq' });
    const st = String(b.status || '').toLowerCase();
    // provider statusini bizning statusga xaritalaymiz
    let ours = null;
    if (['assigned', 'picked_up', 'en_route', 'delivering'].includes(st)) ours = 'delivering';
    else if (['delivered', 'completed', 'done'].includes(st)) ours = 'done';
    else if (['cancelled', 'failed', 'returned'].includes(st)) ours = 'cancelled';
    await getPool().query(
      `UPDATE orders SET delivery_status=$1, status_note=$2, status=COALESCE($3, status), status_at=now() WHERE id=$4`,
      [st, b.note || b.reason || null, ours, String(orderId)]
    );
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('delivery webhook', e?.message);
    return res.status(500).json({ ok: false });
  }
};
