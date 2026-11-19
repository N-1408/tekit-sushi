# 🍣 Tekit Sushi — Telegram Bot + Mini App

Professional full-screen Telegram Mini App + bot, yaponamama.uz uslubida.
Hozir **Vercel'da ishlaydi** (`master` branch'dan avtomatik deploy), keyinchalik
VPSga ko'chish uchun hamma tayyorlik ham shu repoda bor (pastda "VPSga ko'chish" bo'limi).

## Ranglar
Brend ko'k **#0F1E9A** (logodagi chuqur ko'k kit) — yagona manba:
`miniapp/src/index.css` dagi `--brand-blue` (tugmalar, chiplar, aksent, Telegram header rangi).
Qorong'u fonda matn/ikonka uchun o'qiladigan och ko'k **#29A8E0** (`--acc-on-dark`).
Promo aksenti to'q sariq (#F97316), muvaffaqiyat yashil (#0E9F6E). Matn va sirt
ranglari Telegram mavzusidan (dark/light) o'qiladi.

## Struktura
- `miniapp/` — React 18 + Vite + Tailwind + TypeScript ilova (menyu, savat, checkout, admin panel)
- `miniapp/api/*.js` — Vercel serverless funksiyalar (backend), Postgres (`DATABASE_URL`)
- `miniapp/server/` — oddiy Node (Express) server: xuddi shu API funksiyalarni VPSda ishga tushiradi
- `bot/` — grammY bot (`/start`, til, raqam, buyurtma; webhook Vercelda)
- `db/` — to'liq DB sxemasi va zaxira qo'llanmasi

## Lokalda ishga tushirish
    cd miniapp
    cp .env.example .env      # qiymatlarni to'ldiring (hech bo'lmasa DATABASE_URL)
    npm ci
    npm run dev               # frontend (http://localhost:5173)
    npm run typecheck         # TypeScript tekshiruvi
    npm run build             # dist/ qurish

Backendni lokalda sinash (DB kerak):

    npm run start:server      # http://localhost:3000 da frontend + /api birga

## Env o'zgaruvchilar
To'liq ro'yxat izohlar bilan: `miniapp/.env.example` va `bot/.env.example`.
Asosiylari: `DATABASE_URL`, `BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `WEBAPP_URL`,
`ADMIN_PASSWORD`. SSL: `DATABASE_SSL=no-verify` (standart, hozirgi holat) —
server sertifikatini tekshirmasdan ulanadi. Tekshiruvni yoqish uchun avval
sinab ko'ring, keyin `DATABASE_SSL=verify` qiling (ixtiyoriy `DATABASE_SSL_CA`).

## Bugungi deploy (Vercel)
- `master` branch'ga push → Vercel avtomatik quradi (buildCommand `npm run build`, `dist/`).
- API funksiyalar `miniapp/api/*.js` dan chiqadi; webhook yo'nalishlari `miniapp/vercel.json`da.
- Vercel env'larda: `DATABASE_URL`, `BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` va qolganlari.
- Telegram webhook: `https://<vercel-url>/telegram/webhook` (sir: `TELEGRAM_WEBHOOK_SECRET`).

## VPSga ko'chish (bosqichma-bosqich)
1. **DB ko'chiring.** Vercel'dagi Postgresdan zaxira: `pg_dump "$DATABASE_URL" -Fc -f tekit.dump`.
   VPSda Postgres o'rnating va tiklang: `pg_restore -d "$DATABASE_URL" --clean --if-exists tekit.dump`.
2. **Ilovani ko'chiring.** Repoda: `cd miniapp && docker build -t tekit-sushi .`
   yoki Dockersiz: `npm ci && npm run build && npm run start:server`.
   Env: `cp .env.example .env` va qiymatlarni Vercel'dagidek to'ldiring
   (`DATABASE_URL` endi VPSdagi baza; lokal tarmoqda `DATABASE_SSL=off` mumkin).
   Namuna `docker-compose.yml` ham bor (ilova + Postgres birga, lokal sinov uchun).
3. **Nginx + HTTPS.** `deploy/nginx.conf.example`ni ko'chirib, `server_name`ni
   o'z domeningizga yozing, keyin: `certbot --nginx -d tekit.uz` (Let's Encrypt, bepul).
4. **Telegram tomonini yangilang:**
   - BotFather → `/setmenubutton` → yangi URL (masalan `https://tekit.uz/`);
   - webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tekit.uz/telegram/webhook&secret_token=<SIR>`
     (sir `TELEGRAM_WEBHOOK_SECRET` bilan bir xil bo'lishi kerak).
5. **Tekshiring:** menyuni oching, test buyurtma bering, admin panelga kiring.

## Zaxira (VPSda ham, Vercelda ham)
Haftada bir marta: `pg_dump "$DATABASE_URL" -Fc -f tekit-$(date +%F).dump` (qarang `db/README.md`).
Admin panelda yuklangan rasmlar bazada saqlanadi — zaxira bilan birga keladi.

## Webhook sirini o'rnatish (majburiy!)
2026-11-19 dan boshlab `TELEGRAM_WEBHOOK_SECRET` o'rnatilmagan bo'lsa bot webhook
QABUL QILMAYDI (503). Ketma-ket amallar:
1. Vercel → loyiha → Settings → Environment Variables → `TELEGRAM_WEBHOOK_SECRET`
   o'zgaruvchisini qo'shing (qiymat — uzun tasodifiy matn, masalan parol generatoridan).
2. Redeploy qiling (Deployments → Redeploy) yoki `improvements`ni masterga merge qiling.
3. Webhookni yangi sir bilan qayta ro'yxatdan o'tkazing:
   brauzerda oching: `https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<domen>/telegram/webhook&secret_token=<SIR>`
   (`<SIR>` — 1-bosqichdagi bilan bir xil bo'lishi KERAK).
4. Tekshirish: `https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo` —
   `last_error_message` bo'lmasligi kerak. Botga /start yuborib sinang.
