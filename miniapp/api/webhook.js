import { deliveryHandler } from './_webhook_delivery.js';
import { paymentHandler } from './_webhook_payment.js';

// Bitta serverless funksiya ikkala webhookni boshqaradi (Vercel Hobby: max 12 funksiya).
// /api/webhook/delivery -> deliveryHandler, /api/webhook/payment -> paymentHandler
export default async (req, res) => {
  const url = req.url || '';
  const isDelivery = url.includes('type=delivery') || url.includes('/webhook/delivery');
  return isDelivery ? deliveryHandler(req, res) : paymentHandler(req, res);
};
