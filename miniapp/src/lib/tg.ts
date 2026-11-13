import React from 'react'
export const TGA: any = (window as any).Telegram?.WebApp

export function initTelegram() {
  if (!TGA) return
  try {
    TGA.ready()
    TGA.expand()
    TGA.setHeaderColor?.('#0F1720')
    TGA.setBackgroundColor?.('#0F1720')
    TGA.disableVerticalSwipes?.()
    TGA.requestFullscreen?.()
    const applyInsets = () => {
      const st = document.documentElement.style
      const ios = TGA?.platform === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
      // Telegram suzuvchi Close/Back tugmalari kontent ustida turadi (iOS ham, fullscreen ham):
      // yuqoriga qo'shimcha bo'shlik ajratamiz
      st.setProperty('--tg-extra', (TGA?.isFullscreen || ios) ? '44px' : '0px')
      const cs = (TGA as any).contentSafeAreaInset || {}
      const top = Number(cs.top) || 0
      const bottom = Number(cs.bottom) || 0
      if (top > 0) st.setProperty('--tg-csa-top', `${top}px`)
      else st.removeProperty('--tg-csa-top')
      if (bottom > 0) st.setProperty('--tg-csa-bottom', `${bottom}px`)
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
    if (!active) return
    const bb = TGA?.BackButton
    if (!bb?.show) return
    const go = () => history.back()
    try { bb.onClick(go); bb.show() } catch {}
    return () => { try { bb.offClick?.(go); bb.hide() } catch {} }
  }, [active])
}
