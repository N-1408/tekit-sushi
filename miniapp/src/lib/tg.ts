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
    const applyInsets = (e: any) => {
      const st = document.documentElement.style
      const top = e?.content_safe_area?.top ?? (TGA as any).contentSafeAreaInset?.top ?? 0
      const bottom = e?.content_safe_area?.bottom ?? (TGA as any).contentSafeAreaInset?.bottom ?? 0
      st.setProperty('--sat', `${Number(top) || 0}px`)
      st.setProperty('--sab', `${Number(bottom) || 0}px`)
      if (e?.height) st.setProperty('--svh', `${e.height}px`)
    }
    try { TGA.onEvent?.('viewportChanged', applyInsets) } catch {}
    try { TGA.onEvent?.('contentSafeAreaChanged', applyInsets) } catch {}
    applyInsets({})
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

export function backButtonType() {
  try { TGA?.BackButton } catch {}
}
