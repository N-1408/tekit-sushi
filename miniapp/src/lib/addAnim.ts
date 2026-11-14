/* ---------- Savatga qo'shish animatsiyasi: uch variant, bitta vizual til.
   A — tugma ichida savat ikonkasining harakati (aaroniker/qBEgjjM moslashtirilgan)
   B — tugma ichida neytral quti savatga tushadi (MinzCode/pogqVVX moslashtirilgan,
       Font Awesome o'rniga loyihaning IcBag ikonkasi)
   C — buyum add tugmasidan ko'rinadigan savat boshqaruviga uchadi
       (designcouch/OJPdZxg moslashtirilgan, jQuery o'rniga WAAPI; X/Y
       o'qilari alohida easing bilan — parabola hissi)

   Umumiy qoidalar:
   - Ikonka oilasi, o'lchov, uy easing'i (cubic-bezier(.32,.72,0,1)) va brend
     ranglari barcha variantlarda bir xil.
   - Shuffle-bag: A, B, C aralashtirilib, har biri bir marta ishlatiladi,
     to'plam bo'shagach qayta aralashtiriladi; tsikl chegarasida oxirgi variant
     darhol takrorlanmaydi. Ketma-ketlik faqat sessiya darajasida (modulda)
     saqlanadi — backendga hech narsa yozilmaydi.
   - Animatsiya faqat MUVAFFAQIYATLI qo'shishdan keyin, qo'shish o'zini
     sekinlashtirmasdan chaqiriladi; xato bo'lsa jim o'tkaziladi.
   - Tez bosishlarda birlashtiriladi: faol animatsiya davomida yangi to'liq
     animatsiya o'ynalmaydi (mavjud add-ok tasdig'i qoladi).
   - prefers-reduced-motion: yo'nalishli harakat o'rniga oddiy darhol tasdiq
     (mavjud add-ok belgisi) qoladi.
   - Sinov/rollback uchun ichki sozlama: ADD_ANIM_ENABLED va (faqat dev)
     localStorage 'tk-addanim' = 'a' | 'b' | 'c' | 'off'. ---------- */

type VariantId = 'a' | 'b' | 'c'

export const ADD_ANIM_ENABLED: Record<VariantId, boolean> = { a: true, b: true, c: true }

/* IcBag (ui.tsx) bilan bir xil ikonka: uchuvchi buyum ichida qayta ishlatiladi */
const BAG_SVG =
  '<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M1.89481 1.33334C3.0908 1.33334 4.12244 2.16546 4.36518 3.32594L4.61076 4.50001H13.1524C14.147 4.50001 14.8713 5.43423 14.6151 6.3865L13.8281 9.31083C13.5336 10.4052 12.5334 11.1667 11.3904 11.1667H6.32462C5.12202 11.1667 4.08659 10.3255 3.85074 9.15697C3.48088 7.32445 3.10103 5.49411 2.71827 3.66421C2.63736 3.27738 2.29348 3.00001 1.89481 3.00001H1.50795C1.0435 3.00001 0.666992 2.62691 0.666992 2.16668C0.666992 1.70644 1.0435 1.33334 1.50795 1.33334H1.89481ZM5.5 8.83011L4.96244 6.16668H12.9335L12.203 8.88139C12.1048 9.24619 11.7714 9.50001 11.3904 9.50001H6.32462C5.92375 9.50001 5.57861 9.21963 5.5 8.83011Z"/>' +
  '<path d="M7.30046 13.3333C7.30046 14.0697 6.69804 14.6667 5.95492 14.6667C5.21181 14.6667 4.60939 14.0697 4.60939 13.3333C4.60939 12.597 5.21181 12 5.95492 12C6.69804 12 7.30046 12.597 7.30046 13.3333Z"/>' +
  '<path d="M11.3371 14.6667C12.0802 14.6667 12.6826 14.0697 12.6826 13.3333C12.6826 12.597 12.0802 12 11.3371 12C10.5939 12 9.99152 12.597 9.99152 13.3333C9.99152 14.0697 10.5939 14.6667 11.3371 14.6667Z"/></svg>'

export type AddAnimResult =
  | { kind: 'inline'; v: 'a' | 'b'; k: number }
  | { kind: 'flight'; k: number }
  | null

let bag: VariantId[] = []
let last: VariantId | null = null
let activeUntil = 0
let keySeq = 1

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickVariant(): VariantId | null {
  const enabled = (['a', 'b', 'c'] as VariantId[]).filter(v => ADD_ANIM_ENABLED[v])
  if (!enabled.length) return null
  if (!bag.length || bag.some(v => !enabled.includes(v))) {
    bag = shuffle(enabled)
    // pop() oxirgi elementni oladi: tsikl chegarasida darhol takrorlanmasin
    const top = bag.length - 1
    if (bag[top] === last && bag.length > 1) {
      const j = Math.floor(Math.random() * top)
      ;[bag[top], bag[j]] = [bag[j], bag[top]]
    }
  }
  const v = bag.pop() as VariantId
  last = v
  return v
}

function forced(): VariantId | 'off' | null {
  try {
    const v = localStorage.getItem('tk-addanim')
    if (v === 'off') return 'off'
    if (v === 'a' || v === 'b' || v === 'c') return v
  } catch { /* privat rejim — e'tibor berilmaydi */ }
  return null
}

function reducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/* Savat boshqaruvi ko'rinadigan va yopilmagan bo'lsa — u uchish nishoni bo'ladi */
function findVisibleCartTarget(): HTMLElement | null {
  const el = document.querySelector<HTMLElement>('[aria-label="cart"]')
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 8 || r.height < 8) return null
  if (r.left < -1 || r.top < -1 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1) return null
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  if (!hit || !(hit === el || el.contains(hit))) return null
  return el
}

function ping(x: number, y: number, sale: boolean) {
  try {
    const el = document.createElement('div')
    el.className = 'tk-fly-ping' + (sale ? ' tk-sale' : '')
    el.setAttribute('aria-hidden', 'true')
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    document.body.appendChild(el)
    const rm = () => el.remove()
    el.addEventListener('animationend', rm)
    window.setTimeout(rm, 700)
  } catch { /* animatsiya xatosi qo'shishga xalaqit bermaydi */ }
}

/* C varianti: manba va nishonni TRIGGER paytida o'lchaydi (sidebar, skroll,
   responsive joylashuv hisobga olinadi), vaqtinchalik element document.bodyga
   qo'yiladi — React qayta renderida yo'qolmaydi va o'zi tozalanadi. */
function flyToCart(source: HTMLElement, sale: boolean): boolean {
  try {
    const target = findVisibleCartTarget()
    if (!target) return false
    const s = source.getBoundingClientRect()
    const t = target.getBoundingClientRect()
    const sx = s.left + s.width / 2, sy = s.top + s.height / 2
    const tx = t.left + t.width / 2, ty = t.top + t.height / 2
    const item = document.createElement('div')
    item.className = 'tk-fly-item' + (sale ? ' tk-sale' : '')
    item.setAttribute('aria-hidden', 'true')
    item.innerHTML = BAG_SVG
    item.style.left = `${sx - 11}px`
    item.style.top = `${sy - 11}px`
    document.body.appendChild(item)
    const dx = tx - sx, dy = ty - sy
    const arc = Math.min(56, Math.max(22, Math.abs(dy) * 0.3))
    const anim = item.animate([
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0, easing: 'cubic-bezier(.33,0,.67,1)' },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - arc}px) scale(.94)`, offset: 0.55, easing: 'cubic-bezier(.32,.72,0,1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: .9, offset: 1 },
    ], { duration: 700, fill: 'forwards' })
    let done = false
    const finish = () => { if (done) return; done = true; ping(tx, ty, sale); item.remove() }
    anim.addEventListener('finish', finish)
    anim.addEventListener('cancel', () => { done = true; item.remove() })
    window.setTimeout(finish, 1500) // xavfsizlik: har qanday holatda tozalanadi
    return true
  } catch { return false }
}

/* Muvaffaqiyatli qo'shishdan KEYIN chaqiriladi. Natija:
   - {kind:'inline', v:'a'|'b'}  → tugma ichida glyph o'ynaydi
   - {kind:'flight'}             → C uchdi, tugmada oddiy add-ok qoladi
   - null                        → bazaviy add-ok tasdig'i (tez bosish,
                                   reduced-motion, o'chirilgan, yashirin tugma) */
export function beginAddToCartAnim(source: HTMLElement | null | undefined, sale: boolean): AddAnimResult {
  const f = forced()
  if (f === 'off') return null
  if (reducedMotion()) return null
  const now = Date.now()
  if (now < activeUntil) return null // tez bosishlarda birlashtirish
  if (!source) return null
  const r = source.getBoundingClientRect()
  if (r.width < 8 || r.height < 8) return null
  const v = f ?? pickVariant()
  if (!v) return null
  activeUntil = now + 900
  const k = keySeq++
  if (v === 'c') {
    if (flyToCart(source, sale)) return { kind: 'flight', k }
    return { kind: 'inline', v: 'a', k } // nishon ko'rinmasa — muvofiq ichki fallback
  }
  return { kind: 'inline', v, k }
}
