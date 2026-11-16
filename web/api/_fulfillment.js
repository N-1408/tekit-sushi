// Fulfillment uchun YAGONA server tomoni manbasi: filiallar va sozlamalar.
//
// TASDIQLANGAN FAKTLAR (2026-11-14, egasidan): ikkita filial bor —
// Nukus ko'cha filiali va Sampi filiali; ikkalasi 24/7 ishlaydi.
// Boshqa hamma operatsion qiymat (manzil, kordinata, tayyorlash vaqti,
// yetkazib berish zonasi, jadval intervallari, gorizontal) hali tasdiqlanmagan
// va ixtiyoriy YOZILMAYDI: null/yo'q qoldiriladi. Qo'shimcha sozlamalar
// `settings` jadvalidan o'qiladi (admin panelda kiritiladi):
//   pickup_prep_minutes   — olib ketish uchun minimal tayyorlanish vaqti
//   pickup_slot_minutes   — jadval sloti uzunligi
//   pickup_days_ahead     — jadval gorizontali (bugundan necha kun)
//   delivery_eta_minutes  — yetkazib berishning taxminiy vaqti
// Sozlanmagan kalitlar frontendga uzatilmaydi va UI o'z holatini halol
// ko'rsatadi ("sozlanmagan", taxminiy qiymat ko'rsatmaydi).

export const BRANCHES = [
  {
    id: 'nukus',
    name: { uz: 'Nukus ko\u2018cha filiali', ru: 'Филиал на Нукус коча' },
    hours_24_7: true,
    address: null,
    lat: null,
    lon: null,
  },
  {
    id: 'sampi',
    name: { uz: 'Sampi filiali', ru: 'Филиал Сампи' },
    hours_24_7: true,
    address: null,
    lat: null,
    lon: null,
  },
]

export const BRANCH_IDS = BRANCHES.map((b) => b.id)

export const SETTING_KEYS = [
  'pickup_prep_minutes',
  'pickup_slot_minutes',
  'pickup_days_ahead',
  'delivery_eta_minutes',
]

export async function readSettings(pool) {
  try {
    const r = await pool.query('SELECT key, value FROM settings')
    const m = {}
    for (const row of r.rows) m[row.key] = row.value
    return m
  } catch {
    return {}
  }
}

// Faqat to'g'ri qiymatli kalitlar qaytadi; sozlanmaganlari yo'qoladi.
export function pickupCfgFrom(settings) {
  const prep = Number(settings.pickup_prep_minutes)
  const slot = Number(settings.pickup_slot_minutes)
  const days = Number(settings.pickup_days_ahead)
  const cfg = {}
  if (Number.isFinite(prep) && prep > 0) cfg.prep_minutes = Math.round(prep)
  if (Number.isFinite(slot) && slot >= 5) cfg.slot_minutes = Math.round(slot)
  if (Number.isFinite(days) && days >= 1) cfg.days_ahead = Math.min(14, Math.round(days))
  return Object.keys(cfg).length ? cfg : null
}

export function deliveryCfgFrom(settings, env) {
  const eta = Number(settings.delivery_eta_minutes)
  return {
    // Tasdiqlangan biznes fakti (2026-11-10): Toshkent bo'ylab yetkazib berish BEPUL.
    fee: Math.max(0, Number(env.DELIVERY_FEE ?? 0)),
    threshold: Math.max(0, Number(env.DELIVERY_FREE_THRESHOLD || 200000)),
    eta_minutes: Number.isFinite(eta) && eta > 0 ? Math.round(eta) : null,
  }
}

// Toshkent vaqti (qurilma soati emas): {ymd, hm, minutes}
export function tkNow() {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const g = (t) => (p.find((x) => x.type === t) || {}).value || ''
  const hm = `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}`
  return {
    ymd: `${g('year')}-${g('month')}-${g('day')}`,
    hm,
    minutes: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5)),
  }
}
