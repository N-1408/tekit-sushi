# Tekit Sushi — Telegram Bot + Mini App + Dedicated Backend

Monorepo (branch `feat/vps-monorepo`) prepared for the VPS phase. `master`
still deploys the old single-folder layout to Vercel until the switch.

## Struktura
- `web/` — React + TypeScript + Vite mini app (Telegram) va standalone website
- `api/` — dedicated backend: bitta Node/TypeScript app (Fastify), VPS-ready
  - `src/integrations/` — clean adapter modules, DISABLED until env flags:
    - `rahmat.ts` — Rahmat PAY (payments, docs app.docs.rhmt.uz)
    - `iiko.ts` — menu + order sync (docs api.iiko.help)
    - `taximaster.ts` — Millennium taxi dispatch (docs help.taximaster.ru TM_API)
    - `eskiz.ts` — SMS phone confirmation (docs notify.eskiz.uz)
- `bot/` — grammY bot
- `admin/` — admin panel (uz/ru/en)
- `shared/` — shared TypeScript types (Order, Branch, ...)

## Sozlash (api)
```
cd api && cp .env.example .env  # fill values; adapters stay off until flags set
npm install && npm run dev
```

Dizayn Emil Kowalski design-engineering qoidalari bo'yicha.
