import { Pool } from 'pg';
import { cors } from '../_verify.js';
import { checkPaymentWebhookSecret } from '../payment.js';

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
  if (!checkPaymentWebhookSecret(secret)) return res.status(401).json({ ok: false, error: 'Bad secret' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const orderId = b.order_id || b.external_id || b.merchant_trans_id;
    const paid = b.status === 'paid' || b.status === 'success' || b.status === 'completed';
    if (!orderId) return res.status(400).json({ ok: false, error: 'order_id yo\\u02bbq' });
    await getPool().query(
      `UPDATE orders SET payment_status=$1, paid_at=CASE WHEN $1='paid' THEN now() ELSE paid_at END WHERE id=$2`,
      [paid ? 'paid' : 'failed', String(orderId)]
    );
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('payment webhook', e?.message);
    return res.status(500).json({ ok: false });
  }
};
