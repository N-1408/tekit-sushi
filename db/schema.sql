-- Tekit Sushi — to'liq ma'lumotlar bazasi sxemasi.
-- Ishga tushirish:  psql "$DATABASE_URL" -f db/schema.sql
-- Eslatma: ilova ishga tushganda kerakli jadvallarni o'zi ham yaratadi
-- (CREATE TABLE IF NOT EXISTS). Bu fayl — nusxa/ko'chirish va yangi server
-- uchun bitta to'liq sxema.

-- ============ foydalanuvchilar (bot + mini app) ============
CREATE TABLE IF NOT EXISTS bot_users (
  tg_id      BIGINT PRIMARY KEY,
  name       TEXT,
  username   TEXT,
  lang       TEXT,
  phone      TEXT,
  addr       TEXT,
  lat        DOUBLE PRECISION,
  lon        DOUBLE PRECISION,
  role       TEXT,                       -- 'admin' — admin panelga kirish huquqi
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ buyurtmalar ============
CREATE TABLE IF NOT EXISTS orders (
  id                  BIGSERIAL PRIMARY KEY,
  tg_user_id          BIGINT,
  name                TEXT,
  phone               TEXT,
  address             TEXT,
  branch              TEXT,                -- olib ketish uchun filial id
  delivery_type       TEXT,                -- 'delivery' | 'pickup'
  payment             TEXT,                -- 'cash' | 'online'
  items               JSONB,               -- [{id, title, q, price}]
  total               INT,                 -- menyudan hisoblangan summa (server)
  note                TEXT,
  delivery_time       TEXT,                -- 'YYYY-MM-DD HH:MM' yoki null (imkon qadar tez)
  promo_code          TEXT,
  discount            INT DEFAULT 0,
  status              TEXT DEFAULT 'new',  -- new|confirmed|delivering|done|cancelled
  status_note         TEXT,
  status_at           TIMESTAMPTZ,
  payment_status      TEXT DEFAULT 'pending', -- pending|paid|failed
  paid_at             TIMESTAMPTZ,
  change_amount       INT,                 -- naqd pul qaytimi
  delivery_provider   TEXT,
  delivery_external_id TEXT,
  delivery_status     TEXT,
  delivery_fee        INT DEFAULT 0,
  grand_total         INT,                 -- total - discount + delivery_fee
  client_ref          TEXT,                -- dublikatdan saqlash (idempotentlik)
  lat                 DOUBLE PRECISION,
  lon                 DOUBLE PRECISION,
  created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_client_ref_uidx ON orders (client_ref);

-- ============ menyu ============
CREATE TABLE IF NOT EXISTS menu_categories (
  slug         TEXT PRIMARY KEY,
  sort         INT DEFAULT 0,
  title_uz     TEXT, title_ru TEXT, title_en TEXT,
  emoji        TEXT,
  active       BOOLEAN DEFAULT true,
  sale_active  BOOLEAN DEFAULT false,
  sale_percent INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id           TEXT PRIMARY KEY,
  slug         TEXT,
  cat          TEXT,
  price        INT DEFAULT 0,
  img          TEXT,                       -- /api/img?id=... yoki /sauces/*.jpg
  t_uz TEXT, t_ru TEXT, t_en TEXT,
  d_uz TEXT, d_ru TEXT, d_en TEXT,
  pcs          INT DEFAULT 0,
  weight       TEXT,
  hit          BOOLEAN DEFAULT false,
  active       BOOLEAN DEFAULT true,
  sort         INT DEFAULT 0,
  sale_active  BOOLEAN DEFAULT false,
  sale_percent INT DEFAULT 0,
  sale_price   INT,
  kcal INT, protein INT, fat INT, carbs INT,
  spicy BOOLEAN,                             -- NULL = eski qator (nom bo'yicha aniqlanadi)
);

-- ============ rasmlar (upload.js yuklaydi, img.js ko'rsatadi) ============
CREATE TABLE IF NOT EXISTS menu_imgs (
  id         TEXT PRIMARY KEY,             -- 'up_<uuid>'
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,               -- rasm BAZADA saqlanadi (katta fayllar DB hajmini oshiradi)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ promo kodlar ============
CREATE TABLE IF NOT EXISTS promos (
  code    TEXT PRIMARY KEY,
  percent INT NOT NULL,
  active  BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO promos (code, percent) VALUES ('TEKIT10', 10) ON CONFLICT (code) DO NOTHING;

-- ============ sozlamalar (admin panel kiritadi) ============
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,                  -- pickup_prep_minutes, pickup_slot_minutes,
                                            -- pickup_days_ahead, delivery_eta_minutes
  value TEXT NOT NULL
);

-- ============ IP-limitlar (_verify.js) ============
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count        INT NOT NULL DEFAULT 0
);
