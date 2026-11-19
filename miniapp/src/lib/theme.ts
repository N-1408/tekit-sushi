/* ---------- Maxsus Telegram tema moduli (core.telegram.org/apps/webapps) ----------
 * Telegram Mini App muhitida:
 *   - Telegram.WebApp.colorScheme: 'light' | 'dark'  — klientning joriy mavzusi
 *   - Telegram.WebApp.themeParams: bg_color, text_color, hint_color,
 *     secondary_bg_color, header_bg_color, bottom_bar_bg_color,
 *     accent_text_color, section_bg_color, section_header_text_color,
 *     subtitle_text_color, link_color, button_color, button_text_color,
 *     destructive_text_color
 *   - 'themeChanged' hodisasi — klient mavzusi almashganda
 * Bu modul ularni bir joydan o'qiydi va butun ilovaga CSS o'zgaruvchilari
 * orqali qo'llaydi (sirtlar Tekit brend palitrasida, Telegram krom ranglari
 * — header/bottom bar — themeParams dan keladi, bo'lmasa brend fon).
 * Telegram tashqarisida (mustaqil sayt): brauzer sozlamasi
 * (prefers-color-scheme) asos bo'ladi. Foydalanuvchining qo'lda tanlovi
 * ('tk-theme') har doim ustun turadi. */
import { TGA } from './tg'

export type ThemeMode = 'dark' | 'light'
export const THEME_BG: Record<ThemeMode, string> = { dark: '#0F1720', light: '#F6F7FB' }

/* Brend ko'k: yorug'lik rejimdagi header yuzasi (index.css --hdr-bg bilan BIR XIL qiymat) */
export const BRAND_BLUE = '#0F1E9A'

/* Mobil header yuzasi mavzuga qarab: index.css dagi --hdr-bg tokeni bilan bir xil.
   Telegram xromi (setHeaderColor/setBackgroundColor + theme-color) shu rangda turadi. */
export const HEADER_BG: Record<ThemeMode, string> = { light: '#0F1E9A', dark: '#1B2330' }

/* themeParams faqat hex rang beradi; boshqa qiymat (bo'sh, tema nomi) e'tiborga olinmaydi */
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
const tp = (): Record<string, string> => (TGA && typeof TGA.themeParams === 'object' ? (TGA.themeParams as any) : {})

export function resolveTheme(): ThemeMode {
  try { const m = localStorage.getItem('tk-theme'); if (m === 'light' || m === 'dark') return m } catch {}
  try { const cs = TGA?.colorScheme; if (cs === 'light' || cs === 'dark') return cs } catch {}
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

export function currentTheme(): ThemeMode { return curTheme }

export function subscribeTheme(cb: ThemeSub): () => void {
  themeSubs.add(cb)
  return () => { themeSubs.delete(cb) }
}

/* Telegram klientining xrom ranglari (header/bottom bar): themeParams dan,
   kelmasa brend foni. Shu bilan Telegramning o'z qoplUGI ilova bilan bir rangda turadi. */
function chromeColor(t: ThemeMode): string {
  const p = tp()
  if (t === 'dark') return isHex(p.header_bg_color) ? p.header_bg_color : THEME_BG.dark
  return isHex(p.secondary_bg_color) || isHex(p.header_bg_color)
    ? (p.secondary_bg_color || p.header_bg_color)
    : THEME_BG.light
}

export function applyTheme(t: ThemeMode) {
  curTheme = t
  try { document.documentElement.dataset.theme = t } catch {}
  /* themeParams → CSS o'zgaruvchilari: Telegram klienti bergan ranglar
     butun ilovada ishlatilishi mumkin (var(--tg-*)). */
  try {
    const p = tp()
    const st = document.documentElement.style
    const set = (k: string, v: unknown) => { if (isHex(v)) st.setProperty(k, v as string); else st.removeProperty(k) }
    set('--tg-text', p.text_color)
    set('--tg-hint', p.hint_color)
    set('--tg-link', p.link_color)
    set('--tg-accent', p.accent_text_color)
    set('--tg-secondary', p.secondary_bg_color)
    set('--tg-section', p.section_bg_color)
    set('--tg-destructive', p.destructive_text_color)
    set('--tg-header-bg', p.header_bg_color)
    set('--tg-bottom-bar', p.bottom_bar_bg_color)
  } catch {}
  /* Mobil qurilmalarda yuqori xrom va fon brend ko'k: ko'k header bloki
     Telegram tugmalari ortigacha uzluksiz davom etadi (oq bo'shliq yo'q).
     Desktopda themeParams ranglari qoladi. */
  const mobile = TGA?.platform === 'ios' || TGA?.platform === 'android'
  /* Mobil header yuzasi MAVZU BILAN o'zgaradi: yorug'likda brend ko'k, tunda qorong'i.
     applyTheme har tema almashganida darhol ishlaydi (qo'lda va Telegramning o'zidan). */
  const hdr = HEADER_BG[t]
  try {
    const chrome = chromeColor(t)
    TGA?.setHeaderColor?.(mobile ? hdr : chrome)
    TGA?.setBackgroundColor?.(mobile ? hdr : chrome)
    // Telegram-native pastki bar: mavjud bo'lsa (yangi klientlar) tema bilan birga yangilanadi.
    TGA?.setBottomBarColor?.(chrome)
  } catch {}
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mobile ? hdr : THEME_BG[t])
  themeSubs.forEach(cb => { try { cb(t) } catch {} })
}

/* --- tema almashtirish: ochilish effekti Magic UI AnimatedThemeToggler
   komponentida (View Transitions, doira tugmadan ochiladi).
   Bu yerda faqat saqlash + qo'llash; hech qanday VT kod yo'q. --- */
export function changeTheme(next: ThemeMode) {
  try { localStorage.setItem('tk-theme', next) } catch {}
  applyTheme(next)
}

/* Klient/brauzer mavzusi almashganda qayta qo'llash (qo'lda tanlov ustun) */
export function onSystemThemeChange(cb: () => void) {
  try { TGA?.onEvent?.('themeChanged', cb) } catch {}
  try { window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', cb) } catch {}
}

export function initThemeWatch() {
  onSystemThemeChange(() => {
    try { if (localStorage.getItem('tk-theme')) return } catch {}
    applyTheme(resolveTheme())
  })
}
