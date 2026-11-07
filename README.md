# 🍣 Tekit Sushi — Telegram Bot + Mini App

Professional full-screen Telegram Mini App + bot, yaponamama.uz uslubida.
Ranglar: **havorang** (azure #29A8E0) va **delfin** (kulrang-binafsha #5C7683).

## Struktura
- `bot/` — grammY asosidagi bot (`/start`, web_app tugma, buyurtmalarni qabul qilish)
- `miniapp/` — statik full-screen mini ilova (menyu, savat, checkout, buyurtmalar)

## Sozlash
1. BotFather'da `/newbot` → `BOT_TOKEN` oling.
2. Mini ilovani deploy qiling (Vercel/Netlify) → HTTPS URL.
3. BotFather → `/setmenubutton` → URL ni kiriting (yoki `bot.js` dagi InlineKeyboard ishlatadi).
4. `.env`:
   - `BOT_TOKEN` — BotFather'dan
   - `WEBAPP_URL` — mini ilova URL
   - `ADMIN_CHAT_ID` — buyurtma keladigan chat (ixtiyoriy)
5. `cd bot && npm i && npm start`

## Mini App imkoniyatlari (eng yangi Telegram API)
- `requestFullscreen()` — to'liq ekran rejimi
- `safeAreaInset` / `contentSafeAreaInset` — notch ostida kontent
- `disableVerticalSwipes`, `enableClosingConfirmation`, BackButton
- Haptic Feedback (qo'shish, bosish, xato)
- Buyurtmalar `sendData` orqali botga tushadi va `orders.json`ga yoziladi

Dizayn Emil Kowalski design-engineering qoidalari bo'yicha: `:active scale(0.97)`,
`ease-out` 300ms dan kichik transitionlar, `tabular-nums` narxlarda, safe-area,
native scroll feel.
