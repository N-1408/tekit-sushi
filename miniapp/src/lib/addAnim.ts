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

/* ---------- Bosh menyudan savatga uchib borish: bosilgan kartochka rasmi
   kichrayib, yoy chizib, suzuvchi savat tugmasiga uchib boradi; yetib
   borganda savat nishoni allaqachon "cart-beat" bilan urib qoladi.
   - Faqat muvaffaqiyatli qo'shishdan KEYIN chaqiriladi; yo'nalish
     birlashtirilgan (activeUntil) bo'lsa o'ynamaydi — tez bosishlarda jim.
   - prefers-reduced-motion: umuman o'ynamaydi, faqat tasdiq belgisi.
   - Suzuvchi savat ekranda yo'q bo'lsa (masalan savat sahifasida) jim o'tadi.
   - Web Animations API: layoutni buzmaydi, element o'zi keyin o'chadi. ---------- */

export function flyProductToCart(img: HTMLImageElement | null | undefined): void {
  if (!img || !img.src) return
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  } catch { /* o'ynaydi */ }
  if (Date.now() < activeUntil) return // tez bosishlarda birlashtirish
  const target = document.querySelector<HTMLElement>('.tk-float-cart')
  if (!target) return
  const tr = target.getBoundingClientRect()
  const ir = img.getBoundingClientRect()
  if (tr.width < 8 || tr.height < 8 || ir.width < 8 || ir.height < 8) return
  const size = Math.max(40, Math.min(72, ir.width * 0.5))
  const clone = img.cloneNode(false) as HTMLImageElement
  clone.removeAttribute('loading')
  clone.setAttribute('aria-hidden', 'true')
  const st = clone.style
  st.position = 'fixed'
  st.left = '0'
  st.top = '0'
  st.width = `${size}px`
  st.height = `${size}px`
  st.borderRadius = '14px'
  st.objectFit = 'cover'
  st.boxShadow = '0 12px 28px rgba(0,0,0,.35)'
  st.zIndex = '90'
  st.pointerEvents = 'none'
  st.willChange = 'transform, opacity'
  const sx = ir.left + ir.width / 2 - size / 2
  const sy = ir.top + ir.height / 2 - size / 2
  const tx = tr.left + tr.width / 2 - size / 2
  const ty = tr.top + tr.height / 2 - size / 2
  const mx = sx + (tx - sx) / 2
  const my = Math.min(sy, ty) - 56 // yoy: yo'lda biroz yuqoriga ko'tariladi
  st.transform = `translate(${sx}px, ${sy}px) scale(1)`
  document.body.appendChild(clone)
  const anim = clone.animate([
    { transform: `translate(${sx}px, ${sy}px) scale(1)`, opacity: 1, offset: 0 },
    { transform: `translate(${mx}px, ${my}px) scale(.78)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${tx}px, ${ty}px) scale(.2)`, opacity: 0.12, offset: 1 },
  ], { duration: 720, easing: 'cubic-bezier(.3,.75,.4,1)', fill: 'forwards' })
  anim.onfinish = () => clone.remove()
  anim.oncancel = () => clone.remove()
}
