// /api/webhook/delivery and /api/webhook/payment — ported from
// web/api/_webhook_delivery.js and _webhook_payment.js (behavior-identical).
// Secret: x-webhook-secret header or body.secret (TEK_WEBHOOK_SECRET /
// PAY_WEBHOOK_SECRET, defaults as in the Vercel functions).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db.js';
import { checkDeliveryWebhookSecret, checkPaymentWebhookSecret } from '../lib/delivery.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function deliveryWebhook(req: FastifyRequest, reply: FastifyReply) {
  if (req.method !== 'POST') return reply.code(405).send({ ok: false, error: 'POST only' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const secret = (req.headers['x-webhook-secret'] as string) || body.secret;
  if (!checkDeliveryWebhookSecret(secret)) return reply.code(401).send({ ok: false, error: 'Bad secret' });
  try {
    const orderId = body.order_id || body.external_id;
    if (!orderId) return reply.code(400).send({ ok: false, error: 'order_id yo\u02bbq' });
    const st = String(body.status || '').toLowerCase();
    // provider statusini bizning statusga xaritalaymiz
    let ours: string | null = null;
    if (['assigned', 'picked_up', 'en_route', 'delivering'].includes(st)) ours = 'delivering';
    else if (['delivered', 'completed', 'done'].includes(st)) ours = 'done';
    else if (['cancelled', 'failed', 'returned'].includes(st)) ours = 'cancelled';
    // yakunlangan buyurtmani eskirgan callback bilan qayta ochmaymiz
    const q = await pool.query(`SELECT status FROM orders WHERE id=$1`, [String(orderId)]);
    if (!q.rows.length) return reply.code(404).send({ ok: false, error: 'Buyurtma topilmadi' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur: string = (q.rows[0] as Any).status;
    if (['done', 'cancelled'].includes(cur) && ours !== cur) {
      return reply.code(200).send({ ok: true, already: true });
    }
    await pool.query(
      `UPDATE orders SET delivery_status=$1, status_note=$2, status=COALESCE($3, status), status_at=now() WHERE id=$4`,
      [st, body.note || body.reason || null, ours, String(orderId)]);
    return reply.code(200).send({ ok: true });
  } catch (e) {
    console.error('delivery webhook', (e as Error)?.message);
    return reply.code(500).send({ ok: false });
  }
}

export async function paymentWebhook(req: FastifyRequest, reply: FastifyReply) {
  if (req.method !== 'POST') return reply.code(405).send({ ok: false, error: 'POST only' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const secret = (req.headers['x-webhook-secret'] as string) || body.secret;
  if (!checkPaymentWebhookSecret(secret)) return reply.code(401).send({ ok: false, error: 'Bad secret' });
  try {
    console.log('payment webhook', JSON.stringify({ order_id: body.order_id ?? body.external_id ?? body.merchant_trans_id, status: body.status, amount: body.amount }));
    const orderId = body.order_id || body.external_id || body.merchant_trans_id;
    if (!orderId) return reply.code(400).send({ ok: false, error: 'order_id yo\u02bbq' });

    // buyurtma bazadan o'qiladi: summa va holatiga ishonch faqat bazaga
    const q = await pool.query(`SELECT id, total, payment_status FROM orders WHERE id=$1`, [String(orderId)]);
    if (!q.rows.length) return reply.code(404).send({ ok: false, error: 'Buyurtma topilmadi' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: Any = q.rows[0];

    const paid = body.status === 'paid' || body.status === 'success' || body.status === 'completed';
    // idempotentlik: allaqachon to'langan bo'lsa hech narsa o'zgarmaydi
    if (order.payment_status === 'paid') return reply.code(200).send({ ok: true, already: true });

    if (paid) {
      // summa tekshiruvi: provayder bergan summa buyurtma summasiga teng bo'masa to'langan deb belgilanmaydi
      const amt = Number(body.amount);
      if (body.amount != null && amt && Math.abs(amt - Number(order.total)) > 1) {
        console.error('payment webhook amount mismatch', { orderId, amt, total: order.total });
        return reply.code(409).send({ ok: false, error: 'Summa mos emas' });
      }
      await pool.query(
        `UPDATE orders SET payment_status='paid', paid_at=now() WHERE id=$1 AND payment_status <> 'paid'`,
        [String(orderId)]);
    } else if (order.payment_status !== 'paid') {
      await pool.query(`UPDATE orders SET payment_status='failed' WHERE id=$1`, [String(orderId)]);
    }
    return reply.code(200).send({ ok: true });
  } catch (e) {
    console.error('payment webhook', (e as Error)?.message);
    return reply.code(500).send({ ok: false });
  }
}

// Legacy single-endpoint router from webhook.js: /api/webhook with
// type=delivery (or /webhook/delivery) goes to delivery, else payment.
export async function webhookRouter(req: FastifyRequest, reply: FastifyReply) {
  const url = req.url || '';
  const isDelivery = url.includes('type=delivery') || url.includes('/webhook/delivery');
  return isDelivery ? deliveryWebhook(req, reply) : paymentWebhook(req, reply);
}
