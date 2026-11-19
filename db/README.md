# Ma'lumotlar bazasi (db/)

## To'liq sxema
`schema.sql` — barcha jadvallarni yaratadi (bot_users, orders, menu_categories,
menu_items, menu_imgs, promos, settings, rate_limits). Yangi serverda bir marta:

    psql "$DATABASE_URL" -f db/schema.sql

Ilova o'zi ham kerakli jadvallarni yaratadi (CREATE TABLE IF NOT EXISTS), shuning
uchun bu fayl majburiy emas — lekin bitta joyda to'liq ko'rinish beradi.

## Zaxira olish (backup)
    pg_dump "$DATABASE_URL" -Fc -f tekit-$(date +%F).dump

Faqat ma'lumot (sxemasiz) kerak bo'lsa:
    pg_dump "$DATABASE_URL" --data-only -Fc -f tekit-data-$(date +%F).dump

## Qayta tiklash (restore)
    pg_restore -d "$DATABASE_URL" --clean --if-exists tekit-2026-01-01.dump

## Rasmlar haqida MUHIM eslatma
Admin panelda yuklangan rasm fayllar bazada saqlanadi (`menu_imgs.data` — BYTEA).
Bu degani:
- Vercelda ham, VPSda ham rasmlar joylashuviga bog'liq emas (baza bilan keladi) — qulay;
- lekin baza hajmi tez o'sadi va har bir rasm so'rovi bazadan o'qiladi.
VPSga ko'chganingizda rasmlarni alohida disk/S3'ga ko'chirishni xohlasangiz,
`upload.js` va `img.js` fayllarini moslash kerak bo'ladi (hozircha zarur emas).
