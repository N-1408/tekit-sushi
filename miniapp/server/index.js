/* Tekit Sushi — oddiy Node serveri (VPS uchun).
 *
 * Maqsad: Vercel serverless funksiyalari (miniapp/api/*.js) va qurilgan
 * frontend (dist/) BITTAServerda ishlasin, kodni qayta yozmasdan.
 * Vercel'da hech narsa o'zgarmaydi — bu server faqat VPSda ishlatiladi.
 *
 * Ishga tushirish:  npm run start:server   (PORT orqali port tanlanadi)
 * Qayta yozmalar (vercel.json dagilari bir xil qayta yaratiladi):
 *   /telegram/webhook          -> /api/telegram
 *   /api/webhook/delivery      -> /api/webhook?type=delivery
 *   /api/webhook/payment       -> /api/webhook?type=payment
 *   /api/delivery-quote        -> /api/branches?type=quote
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '..', 'api');
const distDir = path.join(__dirname, '..', 'dist');

const app = express();
app.disable('x-powered-by');

// vercel.json bilan bir xil xavfsizlik sarlavhalari
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Vercel JSON tanani o'zi parse qiladi — shu yerda ham xuddi shunday
app.use(express.json({ limit: '2mb' }));

// api/*.js dagi barcha handlerlar (faqat _ bilan boshlanmaganlari)
const handlers = {};
for (const f of fs.readdirSync(apiDir).filter((f) => f.endsWith('.js') && !f.startsWith('_'))) {
  const name = f.slice(0, -3);
  const mod = await import(path.join(apiDir, f));
  if (typeof mod.default === 'function') handlers[name] = mod.default;
}

// Handlerlar Vercel shaklida (req, res): req.url to'liq bo'lishi kerak
const call = (name, req, res, urlOverride) => {
  const h = handlers[name];
  if (!h) return res.status(404).json({ ok: false, error: 'no handler' });
  if (urlOverride) req.url = urlOverride;
  return Promise.resolve(h(req, res)).catch((e) => {
    console.error(`api ${name}:`, e?.message || e);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'Server xatosi' });
  });
};

// vercel.json rewrites — birma-bir
app.all('/telegram/webhook', (req, res) => call('telegram', req, res, '/api/telegram'));
app.all('/api/webhook/delivery', (req, res) => call('webhook', req, res, '/api/webhook?type=delivery'));
app.all('/api/webhook/payment', (req, res) => call('webhook', req, res, '/api/webhook?type=payment'));
app.all('/api/delivery-quote', (req, res) => {
  req.query = { ...req.query, type: 'quote' };
  return call('branches', req, res, '/api/branches?type=quote');
});
app.all('/api/auth', (req, res) => {
  req.query = { ...req.query, type: 'auth' };
  return call('admin', req, res, '/api/admin?type=auth');
});
app.all('/api/:name', (req, res) => {
  const name = String(req.params.name);
  if (!handlers[name]) return res.status(404).json({ ok: false, error: 'not found' });
  req.url = req.originalUrl; // webhook.js 'type=delivery' ni req.url dan o'qiydi
  return call(name, req, res);
});

// qurilgan frontend: vercel.json bilan bir xil kesh sarlavhalari
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Tekit Sushi serveri ${PORT} portda ishlaydi`));
