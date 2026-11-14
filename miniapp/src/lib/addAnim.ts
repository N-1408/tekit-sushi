/* ---------- Savatga qo'shish animatsiyasi: YAGONA variant — chapdan o'ngga
   savat yo'nalishi (MinzCode/pogqVVX havolasiga asoslangan: savatning
   gorizontal yo'nalishi saqlanadi; demo'dagi to'liq sahifa CSS'i, shrift,
   ikonka kutubxonasi va qutining tushishi loyihada kerak emas).

   - Savat ikonkasi bosilgan tugmaning CHAP tomonidan kirib, tugma bo'ylab
     gorizontal uchib, O'NG tomondan chiqadi; matn yo'nalish davomida
     yashirinadi va yakunda qaytadi. Yo'nalish tugadi — tugma mavjud
     holatiga qaytadi (kartada miqdor boshqaruvi chiqadi).
   - Animatsiya faqat MUVAFFAQIYATLI qo'shishdan KEYIN chaqiriladi;
     qo'shish o'zini kutib turmaydi. Xato bo'lsa animatsiya umuman
     o'ynamaydi — savat ishlashi hech qachon bloklanmaydi.
   - Tez bosishlarda birlashtiriladi: faol yo'nalish davomida yangi
     to'liq yo'nalish o'ynamaydi (mavjud add-ok tasdig'i qoladi).
   - prefers-reduced-motion: yo'nalish o'rniga oddiy darhol tasdiq
     (mavjud add-ok belgisi) qoladi.
   - Yo'nalish tugma ichida, transform asosida: layout siljishi yo'q,
     masofa real tugma kengligiga qarab --tk-jw orqali moslanadi. ---------- */

export type AddAnimResult = { k: number } | null

let activeUntil = 0
let keySeq = 1

export const ADD_ANIM_MS = 800

/* Muvaffaqiyatli qo'shishdan KEYIN chaqiriladi. Natija null bo'lsa tugmada
   bazaviy add-ok tasdig'i qoladi (tez bosish, reduced-motion, yashirin tugma). */
export function beginAddToCartAnim(source: HTMLElement | null | undefined): AddAnimResult {
  if (!source) return null
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  } catch { /* emas — o'ynaydi */ }
  const now = Date.now()
  if (now < activeUntil) return null // tez bosishlarda birlashtirish
  const r = source.getBoundingClientRect()
  if (r.width < 40 || r.height < 16) return null // yashirin yoki juda kichik tugma
  activeUntil = now + ADD_ANIM_MS
  return { k: keySeq++ }
}
