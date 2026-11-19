// Umumiy Postgres havzasi: har bir serverless fayl o'z poolini ochmasligi uchun
// bitta yerda yaratiladi (lazy — birinchi so'rovda).
//
// SSL xatti-harakati DATABASE_SSL orqali boshqariladi:
//   no-verify (DEFAULT) — hozirgi xatti-harakat: SSL ishlatiladi, sertifikat tekshirilmaydi
//   verify              — to'liq tekshiruv; qo'shimcha DATABASE_SSL_CA (PEM matni) bersa ishlatiladi
//   off                 — SSL umuman ishlatilmaydi (faqat ichki tarmoqda)
import pg from 'pg';

let pool = null;

function sslOptions() {
  const mode = (process.env.DATABASE_SSL || 'no-verify').trim().toLowerCase();
  if (mode === 'off') return false;
  if (mode === 'verify') {
    const ca = process.env.DATABASE_SSL_CA;
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false }; // no-verify — standart (oldingi xatti-harakat)
}

export function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslOptions(),
      // serverless uchun kichik havza: har bir instansiya ozgina ulanish ochadi
      max: Number(process.env.PGPOOL_MAX || 3),
    });
    pool.on('error', (e) => console.error('pg pool error', e?.message));
  }
  return pool;
}
