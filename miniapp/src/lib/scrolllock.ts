/* Sahifa skrollini qulflash/ochish.
   index.css'da html, body { overflow-x: clip } bor: shu sababli body'ning
   overflow'i ko'rinish oynasiga (viewport) uzatilmaydi va faqat
   body.style.overflow = 'hidden' yozish sahifa skrollini TO'XTATMAYDI, balki
   sticky header ham o'z o'rnida qotmay qoladi. Shuning uchun qulf ikkala
   elementga (html + body) birga qo'llanadi va tiklanishida ikkalasi ham
   eski holatiga qaytariladi. */
export function lockPageScroll(): () => void {
  const de = document.documentElement
  const b = document.body
  const prevDe = de.style.overflow
  const prevB = b.style.overflow
  de.style.overflow = 'hidden'
  b.style.overflow = 'hidden'
  return () => {
    de.style.overflow = prevDe
    b.style.overflow = prevB
  }
}
