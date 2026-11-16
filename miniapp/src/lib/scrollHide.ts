import React from 'react'

/* Skroll yo'nalishi gisterezisi bilan: yashirish uchun istiqbol yo'nalishda
   MOVE px yig'ilish kerak, qayta ko'rsatish uchun teskari yo'nalishda xuddi
   shuncha. Momentum to'xtashidagi mayda tebranishlar holatni tez-tez
   almashtirmasligi uchun (flikker tuzatildi). showAt ostida doim ko'rinadi. */
export function useScrollHide(showAt = 24, move = 8) {
  const [hidden, setHidden] = React.useState(false)
  const [atTop, setAtTop] = React.useState(true)
  React.useEffect(() => {
    let raf = 0
    let last = Math.max(0, window.scrollY)
    let anchor = last
    let hid = false
    const fn = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY)
        if (y <= showAt) {
          if (hid) { hid = false; setHidden(false) }
          setAtTop(true)
          last = y; anchor = y
          return
        }
        setAtTop(false)
        if (y > last) {
          if (!hid && y - anchor >= move) { hid = true; setHidden(true) }
          anchor = y
        } else if (y < last) {
          if (hid && anchor - y >= move) { hid = false; setHidden(false) }
          anchor = y
        }
        last = y
      })
    }
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => { window.removeEventListener('scroll', fn); cancelAnimationFrame(raf) }
  }, [showAt, move])
  return { hidden, atTop }
}
