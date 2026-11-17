import React from 'react'
export const TGA: any = (window as any).Telegram?.WebApp


/* ---------- mavzu: maxsus Telegram tema moduli (lib/theme.ts) ----------
 * Telegram.WebApp.colorScheme + themeParams + themeChanged bir joydan
 * o'qiladi; mustaqil saytda brauzer sozlamasi (prefers-color-scheme). */
import { applyTheme, resolveTheme, initThemeWatch } from './theme'
export {
  applyTheme, resolveTheme, changeTheme, currentTheme, subscribeTheme,
  onSystemThemeChange, initThemeWatch, THEME_BG,
  type ThemeMode,
} from './theme'

export function initTelegram() {
  if (!TGA) return
  // Har chaqiruv o'z try/catch'ida: biror API tashlasa (masalan iOSda
  // requestFullscreen qo'llab-quvvatlanmaydi), insetlar baribir qo'llanilsin.
  try { TGA.ready() } catch {}
  try { TGA.expand() } catch {}
  try { applyTheme(resolveTheme()) } catch {}
  try { initThemeWatch() } catch {}
  try { TGA.disableVerticalSwipes?.() } catch {}
  try { TGA.requestFullscreen?.() } catch {}
  const applyInsets = () => {
    const st = document.documentElement.style
    const ios = TGA?.platform === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
    const andr = TGA?.platform === 'android' || /Android/i.test(navigator.userAgent || '')
    const cs = (TGA as any).contentSafeAreaInset || {}
    const sa = (TGA as any).safeAreaInset || {}
    const top = Number(cs.top) || 0
    const bottom = Number(cs.bottom) || 0
    if (ios) {
      // iOS: Telegram xromi webview ICHIDA bo'lib, contentSafeAreaInset orqali
      // hisobot qilinadi; notch esa env(safe-area-inset-top) bilan qoplanadi
      // (index.html viewport-fit=cover). iOSda qo'shimcha statik strip QO'SHILMAYDI
      // — ikkitalik hisob bo'lmasin. Hech narsa hisobot qilinmasa 59px iPhone
      // notch zaxirasi: top bar hech qachon xrom/notch ostida qolmasin.
      st.setProperty('--tg-extra', '0px')
      const eff = Math.max(top, Number(sa.top) || 0)
      st.setProperty('--tg-csa-top', `${eff > 0 ? eff : 59}px`)
    } else if (andr) {
      // Android: ko'p mijozlar top=0 deb hisobot qilsa-da Telegram tugmalari
      // kontent USTIDA chiziladi — KAMIDA 72px zaxira (hisobot qilingan qiymat
      // katta bo'lsa o'sha olinadi). Fullscreen yoki hisobot yo'q bo'lsa +56px strip.
      st.setProperty('--tg-extra', (TGA?.isFullscreen || !(top > 0)) ? '56px' : '0px')
      const eff = Math.max(top, Number(sa.top) || 0, 72)
      st.setProperty('--tg-csa-top', `${eff}px`)
    } else {
      // Desktop Telegram / oddiy brauzer: insetlar ishonchsiz, tozalansin
      // (CSS tomondan env(safe-area-inset-top) o'zi ishlaydi).
      st.setProperty('--tg-extra', '0px')
      st.removeProperty('--tg-csa-top')
    }
    const effB = Math.max(bottom, Number(sa.bottom) || 0)
    if (effB > 0 && (ios || andr)) st.setProperty('--tg-csa-bottom', `${effB}px`)
    else st.removeProperty('--tg-csa-bottom')
  }
  try { TGA.onEvent?.('viewportChanged', applyInsets) } catch {}
  try { TGA.onEvent?.('safeAreaChanged', applyInsets) } catch {}
  try { TGA.onEvent?.('contentSafeAreaChanged', applyInsets) } catch {}
  try { TGA.onEvent?.('fullscreenChanged', applyInsets) } catch {}
  applyInsets()
  setTimeout(applyInsets, 600)
  setTimeout(applyInsets, 1800)
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
