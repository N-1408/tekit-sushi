import { Pool } from 'pg';
import { cors } from './_verify.js';
import { checkPaymentWebhookSecret } from './_payment.js';

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  return pool;
}

export const paymentHandler = async (req, res) => {
  cors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  const secret = req.headers['x-webhook-secret'] || req.body?.secret;
  if (!checkPaymentWebhookSecret(secret)) return res.status(401).json({ ok: false, error: 'Bad secret' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('payment webhook', JSON.stringify({ order_id: b.order_id ?? b.external_id ?? b.merchant_trans_id, status: b.status, amount: b.amount }));
    const orderId = b.order_id || b.external_id || b.merchant_trans_id;
    if (!orderId) return res.status(400).json({ ok: false, error: 'order_id yo\u02bbq' });

    // buyurtma bazadan o'qiladi: summa va holatiga ishonch faqat bazaga
    const q = await getPool().query(`SELECT id, total, payment_status FROM orders WHERE id=$1`, [String(orderId)]);
    if (!q.rows.length) return res.status(404).json({ ok: false, error: 'Buyurtma topilmadi' });
    const order = q.rows[0];

    const paid = b.status === 'paid' || b.status === 'success' || b.status === 'completed';
    // idempotentlik: allaqachon to'langan bo'lsa hech narsa o'zgarmaydi
    if (order.payment_status === 'paid') return res.status(200).json({ ok: true, already: true });

    if (paid) {
      // summa tekshiruvi: provayder bergan summa buyurtma summasiga teng bo'masa to'langan deb belgilanmaydi
      const amt = Number(b.amount);
      if (b.amount != null && amt && Math.abs(amt - Number(order.total)) > 1) {
        console.error('payment webhook amount mismatch', { orderId, amt, total: order.total });
        return res.status(409).json({ ok: false, error: 'Summa mos emas' });
      }
      await getPool().query(
        `UPDATE orders SET payment_status='paid', paid_at=now() WHERE id=$1 AND payment_status <> 'paid'`,
        [String(orderId)]
      );
    } else if (order.payment_status !== 'paid') {
      await getPool().query(`UPDATE orders SET payment_status='failed' WHERE id=$1`, [String(orderId)]);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('payment webhook', e?.message);
    return res.status(500).json({ ok: false });
  }
};
