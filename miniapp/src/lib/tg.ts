import React from 'react'
export const TGA: any = (window as any).Telegram?.WebApp

export function initTelegram() {
  if (!TGA) return
  try {
    TGA.ready()
    TGA.expand()
    TGA.setHeaderColor?.('#F6F7FB')
    TGA.setBackgroundColor?.('#F6F7FB')
    TGA.disableVerticalSwipes?.()
    TGA.requestFullscreen?.()
    const applyInsets = (e?: any) => {
      const cs = e?.contentSafeArea ?? ((TGA as any).contentSafeAreaInset || {})
      const st = document.documentElement.style
      const top = Number(cs.top) || 0
      const bottom = Number(cs.bottom) || 0
      if (top > 0) st.setProperty('--sat', `${top}px`)
      if (bottom > 0) st.setProperty('--sab', `${bottom}px`)
    }
    try { TGA.onEvent?.('viewportChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('safeAreaChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('contentSafeAreaChanged', applyInsets) } catch {}
    applyInsets()
    setTimeout(applyInsets, 600)
    setTimeout(applyInsets, 1800)
  } catch {}
}

export function tgUser(): { id: number; first_name?: string; username?: string; photo_url?: string } | null {
  return TGA?.initDataUnsafe?.user || null
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
