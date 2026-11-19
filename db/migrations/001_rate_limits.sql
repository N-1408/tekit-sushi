-- rate_limits: serverless instansiyalar o'rtasida umumiy IP-limit va
-- xato-sanog'i (failGuard/recordFail). Kod ham birinchi ishlatilishda
-- shu jadvalni o'zi yaratadi (CREATE TABLE IF NOT EXISTS), shuning uchun
-- bu faylni qo'lda ishga tushirish shart emas — lekin istasangiz:
--   psql "$DATABASE_URL" -f db/migrations/001_rate_limits.sql
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count int NOT NULL DEFAULT 0
);
