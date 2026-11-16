// Tekit Sushi dedicated backend (VPS-ready single app).
// Customer routes are ported from web/api/*.js behavior-identically.
// Remaining wave: admin, telegram, webhook, geocode, img, upload routes.
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
import { meHandler } from './routes/me.js';
import { promoHandler } from './routes/promo.js';

const app = Fastify({ logger: true, trustProxy: true });
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Key', 'X-Init-Data', 'X-Tg-Id'],
});

app.get('/healthz', async () => ({ ok: true, integrations: integrationStatus() }));
app.get('/api/menu', menuHandler);
app.get('/api/branches', branchesHandler);
app.all('/api/branches/quote', quoteHandler);
app.post('/api/order', orderHandler);
app.get('/api/orders', ordersHandler);
app.get('/api/me', meHandler);
app.get('/api/promo', promoHandler);

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};
start();
