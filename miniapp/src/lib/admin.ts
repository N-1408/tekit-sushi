
export type AdminOrders = any[]
export type AdminStat = {
  today: { orders: number; revenue: number }; pending: number
  period: { orders: number; revenue: number; nonCancelled: number; prevOrders: number; prevNonCancelled: number; prevRevenue: number }
  byStatus: { status: string; n: number }[]
  days: { d: string; n: number; revenue: number }[]
  hours: { h: number; n: number }[]
  dows: { dow: number; n: number }[]
  topItems: { id: string; title: string; qty: number; revenue: number }[]
  delivery: { k: string; n: number }[]
  payment: { k: string; n: number }[]
  cancels: { n: number; revenue: number; reasons: { reason: string; n: number }[] }
  customers: { name: string; phone: string; n: number; revenue: number }[]
  promos: { code: string; n: number; discount: number }[]
  menuCount: number
}

import { TGA } from './tg'
import { tgLogin } from './api'

export function authHeaders(key: string, role: string | null, uid?: number): Record<string, string> {
  const h: Record<string, string> = uid && role === 'admin' ? { 'X-Tg-Id': String(uid) } : { 'X-Admin-Key': key }
  try { if (TGA?.initData) h['X-Init-Data'] = TGA.initData } catch {}
  return h
}

const TZ = 'Asia/Tashkent'
export function fmtDT(d: string | Date): string {
  try {
    const dt = typeof d === 'string' ? new Date(d.endsWith('Z') || d.includes('+') ? d : d + 'Z') : d
    return new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(dt)
  } catch { return String(d) }
}
export function fmtDay(d: string | Date): string {
  try {
    const dt = typeof d === 'string' ? new Date(d.endsWith('Z') || d.includes('+') ? d : d + 'Z') : d
    return new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: '2-digit', month: 'short' }).format(dt)
  } catch { return String(d) }
}
export function todayTashkent(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date())
}

let audioCtx: AudioContext | null = null
export function beepNewOrder() {
  try {
    audioCtx = audioCtx || new (window as any).AudioContext()
    const ctx = audioCtx
    const t0 = ctx.currentTime
    ;[880, 1174.66].forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, t0 + i * 0.16)
      g.gain.linearRampToValueAtTime(0.22, t0 + i * 0.16 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.16 + 0.15)
      o.connect(g); g.connect(ctx.destination)
      o.start(t0 + i * 0.16); o.stop(t0 + i * 0.16 + 0.16)
    })
  } catch {}
}

let alertTimer: ReturnType<typeof setInterval> | null = null
export function isSoundMuted(): boolean {
  try { return localStorage.getItem('tk-admin-sound') === '0' } catch { return false }
}
export function setSoundMuted(v: boolean) {
  try { localStorage.setItem('tk-admin-sound', v ? '0' : '1') } catch {}
}
export function startAlertLoop() {
  if (isSoundMuted() || alertTimer) return
  beepNewOrder()
  alertTimer = setInterval(() => beepNewOrder(), 5000)
}
export function stopAlertLoop() {
  if (alertTimer) { clearInterval(alertTimer); alertTimer = null }
}

/* ---- Telegram Login (OIDC): brauzerdan admin kirish ---- */
const TG_AUTH = 'https://oauth.telegram.org/auth'
const b64url = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function tgOAuthConfigured(): boolean {
  return !!String(import.meta.env.VITE_TELEGRAM_LOGIN_CLIENT_ID || '').trim()
}

/* PKCE + state bilan oauth.telegram.org'ga to'liq sahifa yo'naltirish.
   Popup emas: webview va COOP muammosiz. */
export async function tgOAuthStart(): Promise<void> {
  let clientId = String(import.meta.env.VITE_TELEGRAM_LOGIN_CLIENT_ID || '').trim()
  /* oauth.telegram.org client_id sifatida botning RAQAMLI id'ini talab qiladi
     (username yuborilsa "bot id required" chiqadi). Server BOT_TOKEN bilan
     getMe orqali raqamli id'ni qaytaradi. */
  try {
    const r = await fetch('/api/auth?action=botinfo')
    if (r.ok) {
      const j = await r.json()
      if (j?.ok && j.id) clientId = String(j.id)
    }
  } catch {}
  if (!clientId || !crypto?.subtle) return
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)))
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = b64url(new Uint8Array(digest))
  const redirect = `${location.origin}/admin`
  try { sessionStorage.setItem('tk-tg-ov', JSON.stringify({ verifier, state })) } catch {}
  const q = new URLSearchParams({
    client_id: clientId, redirect_uri: redirect, response_type: 'code',
    scope: 'openid profile', state, code_challenge: challenge, code_challenge_method: 'S256',
  })
  location.href = `${TG_AUTH}?${q.toString()}`
}

/* Qaytishda URL'dagi code+state bilan loginni tugatish.
   ok | pending | fail | null (callback emas) */
export async function tgOAuthFinish(): Promise<'ok' | 'pending' | 'fail' | null> {
  const q = new URLSearchParams(location.search)
  const code = q.get('code')
  const state = q.get('state')
  if (!code || !state) return null
  let saved: { verifier: string; state: string } | null = null
  try { saved = JSON.parse(sessionStorage.getItem('tk-tg-ov') || 'null') } catch {}
  history.replaceState(null, '', location.pathname)
  if (!saved || saved.state !== state) return 'fail'
  try { sessionStorage.removeItem('tk-tg-ov') } catch {}
  const j = await tgLogin(code, saved.verifier, `${location.origin}/admin`)
  return j.ok ? 'ok' : (j.pending ? 'pending' : 'fail')
}
