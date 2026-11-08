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
