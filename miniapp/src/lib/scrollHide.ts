import React from 'react'

/* Yo'nalish gisterezisi: eng kichik pastga surishda ham (MOVE = 2px) sarlavha va
   suzuvchilar yashirinadi; lekin qayta korinishi FAQAT sahifa mutlaqo tepaga
   qaytganda (showAt). Momentum tebranishlari holatni buzmasin deb rAF cheklovi. */
export function useScrollHide(showAt = 8, move = 2) {
  const [hidden, setHidden] = React.useState(false)
  const [atTop, setAtTop] = React.useState(true)
  React.useEffect(() => {
    let raf = 0
    let last = Math.max(0, window.scrollY)
    let cum = 0
    let hid = false
    const fn = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY)
        if (y <= showAt) {
          if (hid) { hid = false; setHidden(false) }
          setAtTop(true)
          last = y; cum = 0
          return
        }
        setAtTop(false)
        if (y > last) {
          cum += y - last
          if (!hid && cum >= move) { hid = true; setHidden(true) }
        } else if (y < last) {
          // yuqoriga qaytish o'rtada yashirin holatni O'ZGARTIRMAYDI:
          // logo faqat mutlaqo tepada paydo bo'ladi.
          cum = 0
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
