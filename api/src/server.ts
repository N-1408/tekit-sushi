// Tekit Sushi dedicated backend (VPS-ready single app).
// All customer, admin, bot and webhook routes are ported from web/api/*.js
// behavior-identically. Integrations (Rahmat PAY, iiko, TaxiMaster, Eskiz)
// are adapter modules disabled until their env vars are set.
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.js';
import { integrationStatus } from './integrations/index.js';
import { ALLOWED_ORIGINS } from './lib/security.js';
import { menuHandler } from './routes/menu.js';
import { branchesHandler, quoteHandler } from './routes/branches.js';
import { orderHandler } from './routes/order.js';
import { ordersHandler } from './routes/orders.js';
import { meHandler, mePostHandler } from './routes/me.js';
import { promoHandler } from './routes/promo.js';
import { adminGet, adminPost } from './routes/admin.js';
import { telegramHandler, telegramInfo } from './routes/telegram.js';
import { deliveryWebhook, paymentWebhook, webhookRouter } from './routes/webhooks.js';
import { geocodeHandler } from './routes/geocode.js';
import { imgHandler } from './routes/img.js';
import { uploadHandler } from './routes/upload.js';

const app = Fastify({ logger: true, trustProxy: true });
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Key', 'X-Init-Data', 'X-Tg-Id', 'X-Webhook-Secret', 'X-Telegram-Bot-Api-Secret-Token'],
});

app.get('/healthz', async () => ({ ok: true, integrations: integrationStatus() }));

// customer
app.get('/api/menu', menuHandler);
app.get('/api/branches', branchesHandler);
app.all('/api/branches/quote', quoteHandler);
app.post('/api/order', orderHandler);
app.get('/api/orders', ordersHandler);
app.get('/api/me', meHandler);
app.post('/api/me', mePostHandler);
app.get('/api/promo', promoHandler);
app.get('/api/geocode', geocodeHandler);

// admin panel + media
app.get('/api/admin', adminGet);
app.post('/api/admin', adminPost);
app.post('/api/upload', uploadHandler);
app.get('/api/img', imgHandler);

// bot webhook (Telegram sends updates here; secret header checked)
app.get('/api/telegram', telegramInfo);
app.post('/api/telegram', telegramHandler);

// delivery + payment webhooks (secrets checked per handler)
app.post('/api/webhook/delivery', deliveryWebhook);
app.post('/api/webhook/payment', paymentWebhook);
app.post('/api/webhook', webhookRouter);

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};
start();
