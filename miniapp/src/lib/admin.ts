
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

export function authHeaders(key: string, role: string | null, uid?: number): Record<string, string> {
  if (uid && role === 'admin') return { 'X-Tg-Id': String(uid) }
  return { 'X-Admin-Key': key }
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
