import React from 'react'
export const TGA: any = (window as any).Telegram?.WebApp


/* ---------- mavzu (dark/light) ---------- */
export type ThemeMode = 'dark' | 'light'
export const THEME_BG: Record<ThemeMode, string> = { dark: '#0F1720', light: '#F6F7FB' }

export function resolveTheme(): ThemeMode {
  try {
    const m = localStorage.getItem('tk-theme')
    if (m === 'light' || m === 'dark') return m
  } catch {}
  try {
    const cs = TGA?.colorScheme
    if (cs === 'light' || cs === 'dark') return cs
  } catch {}
  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  } catch {}
  return 'dark'
}

/* --- kichik tema moduli: tema holati store kontekstdan chiqarildi.
   Sabab: theme kontekst qiymatida turganda har almashtirish BUTUN
   daraxtni (~1000 tugun) qayta render qilardi — qotishning asosiy sababi.
   Endi faqat ThemeToggle obuna bo'ladi. --- */
type ThemeSub = (t: ThemeMode) => void
const themeSubs = new Set<ThemeSub>()
let curTheme: ThemeMode = 'dark'

export function currentTheme(): ThemeMode {
  return curTheme
}

export function subscribeTheme(cb: ThemeSub): () => void {
  themeSubs.add(cb)
  return () => { themeSubs.delete(cb) }
}

export function applyTheme(t: ThemeMode) {
  curTheme = t
  try { document.documentElement.dataset.theme = t } catch {}
  try {
    TGA?.setHeaderColor?.(THEME_BG[t])
    TGA?.setBackgroundColor?.(THEME_BG[t])
    // Telegram-native pastki bar: mavjud bo'lsa (yangi klientlar) tema bilan birga yangilanadi.
    // HTML navigatsiyasi bilan aralashtirilmaydi — bu faqat native xrom rangi.
    TGA?.setBottomBarColor?.(THEME_BG[t])
  } catch {}
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_BG[t])
  themeSubs.forEach(cb => { try { cb(t) } catch {} })
}

/* --- tema almashtirish: ochilish effekti Magic UI AnimatedThemeToggler
   komponentida (View Transitions, doira tugmadan ochiladi).
   Bu yerda faqat saqlash + qo'llash; hech qanday VT kod yo'q. --- */
export function changeTheme(next: ThemeMode) {
  try { localStorage.setItem('tk-theme', next) } catch {}
  applyTheme(next)
}



export function onSystemThemeChange(cb: () => void) {
  try { TGA?.onEvent?.('themeChanged', cb) } catch {}
  try { window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', cb) } catch {}
}

export function initTelegram() {
  if (!TGA) return
  try {
    TGA.ready()
    TGA.expand()
    applyTheme(resolveTheme())
    try { TGA.onEvent?.('themeChanged', () => {
      try { if (localStorage.getItem('tk-theme')) return } catch {}
      applyTheme(resolveTheme())
    }) } catch {}
    TGA.disableVerticalSwipes?.()
    TGA.requestFullscreen?.()
    const applyInsets = () => {
      const st = document.documentElement.style
      const ios = TGA?.platform === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
      const mob = ios || TGA?.platform === 'android' || /Android/i.test(navigator.userAgent || '')
      const cs = (TGA as any).contentSafeAreaInset || {}
      const top = Number(cs.top) || 0
      const bottom = Number(cs.bottom) || 0
      // contentSafeAreaInset Telegram xromi balandligini o'zi hisoblab beradi —
      // u mavjud bo'lsa qo'shimcha 44px IKKI MARSA hisoblanadi va logo juda past
      // tushardi. Qo'shimcha faqat fullscreen yoki csa bermaydigan eski klientda.
      st.setProperty('--tg-extra', (mob && (TGA?.isFullscreen || !(top > 0))) ? '44px' : '0px')
      if (top > 0 && mob) st.setProperty('--tg-csa-top', `${top}px`)
      else st.removeProperty('--tg-csa-top')
      if (bottom > 0 && mob) st.setProperty('--tg-csa-bottom', `${bottom}px`)
      else st.removeProperty('--tg-csa-bottom')
    }
    try { TGA.onEvent?.('viewportChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('safeAreaChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('contentSafeAreaChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('fullscreenChanged', applyInsets) } catch {}
    applyInsets()
    setTimeout(applyInsets, 600)
    setTimeout(applyInsets, 1800)
  } catch {}
}

export function tgUser(): { id: number; first_name?: string; username?: string; photo_url?: string } | null {
  return TGA?.initDataUnsafe?.user || null
}

export function requestLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise(resolve => {
    let done = false
    const fin = (v: any) => { if (!done) { done = true; resolve(v) } }
    try {
      if (TGA?.requestLocation) {
        try { TGA.requestLocation((r: any) => {
          if (r && r.latitude != null && r.longitude != null) fin({ lat: r.latitude, lon: r.longitude })
          else fin(null)
        }) } catch { fin(null) }
        setTimeout(() => fin(null), 20000)
        return
      }
    } catch {}
    try {
      if (navigator.geolocation?.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(
          p => fin({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => fin(null), { timeout: 12000, enableHighAccuracy: false })
        return
      }
    } catch {}
    fin(null)
  })
}

export function haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  try {
    if (kind === 'success' || kind === 'error') TGA?.HapticFeedback?.notificationOccurred(kind)
    else TGA?.HapticFeedback?.impactOccurred(kind)
  } catch {}
}

export function sendData(data: unknown) {
  try { TGA?.sendData(JSON.stringify(data)) } catch {}
}

export function useNativeBack(active: boolean) {
  React.useEffect(() => {
    const bb = TGA?.BackButton
    if (!bb?.show) return
    if (!active) { try { bb.hide() } catch {} ; return }
    const go = () => history.back()
    try { bb.onClick(go); bb.show() } catch {}
    return () => { try { bb.offClick?.(go); bb.hide() } catch {} }
  }, [active])
}
