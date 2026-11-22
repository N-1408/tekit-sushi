import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useStore } from '../../lib/store'
import { tgUser, haptic, useNativeBack } from '../../lib/tg'
import { adminSession } from '../../lib/api'
import { authHeaders, tgOAuthStart, tgOAuthConfigured, tgOAuthFinish, tgOAuthStartUser, tgOAuthFinishUser } from '../../lib/admin'
import { tgWidgetLogin } from '../../lib/api'
import { ThemeToggle } from '../../components/ui'

export type AdminData = {
  orders: any[]; stats: any; cats: any[]; items: any[]; promos: any[]
  risk?: Record<string, number>; settings?: Record<string, string>
}
const EMPTY_DATA: AdminData = { orders: [], stats: null, cats: [], items: [], promos: [] }

export type AdminCtx = {
  key: string; roleOk: boolean; uid?: number
  h: () => Record<string, string>
  ready: boolean
  data: AdminData
  update: (patch: Partial<AdminData>) => void
  refresh: () => void
  refreshRole: () => void
}
const ACtx = React.createContext<AdminCtx>(null as any)
export const useAdmin = () => React.useContext(ACtx)

export function AdminGate({ children, tabs }: { children: React.ReactNode; tabs?: boolean }) {
  const { role, showToast } = useStore()
  const uid = tgUser()?.id
  const [key, setKey] = React.useState(() => { try { return localStorage.getItem('tk-admin') || '' } catch { return '' } })
  const [wasOk] = React.useState(() => { try { return localStorage.getItem('tk-admin-ok') === '1' } catch { return false } })
  const { roleReady } = useStore()
  const [input, setInput] = React.useState('')
  const [err, setErr] = React.useState('')
  const { t } = useStore()
  const [sessOk, setSessOk] = React.useState(false)
  const [tgState, setTgState] = React.useState<'' | 'pending' | 'fail'>('')
  const [data, setData] = React.useState<AdminData | null>(() => {
    try { const v = localStorage.getItem('tk-admin-data'); return v ? JSON.parse(v) : null } catch { return null }
  })
  const roleOk = !!uid && role === 'admin'

  const verify = React.useCallback(async (k: string) => {
    if (!k) return false
    try {
      const r = await fetch('/api/admin?action=promos', { headers: { 'X-Admin-Key': k } })
      if (r.ok) { try { localStorage.setItem('tk-admin', k); localStorage.setItem('tk-admin-ok', '1') } catch {}; return true }
      return false
    } catch { return false }
  }, [])

  React.useEffect(() => {
    if (roleOk) { try { localStorage.setItem('tk-admin-ok', '1') } catch {} ; setErr(''); return }
    if (!key) { setErr(''); return }
    verify(key).then(ok => { if (!ok) { try { localStorage.removeItem('tk-admin') } catch {}; setKey('') } })
  }, [roleOk, key, verify])

  // Brauzer sessiyasi (Telegram Login cookie) va OAuth qaytishi
  React.useEffect(() => {
    let alive = true
    tgOAuthFinish().then((res) => {
      if (!alive) return
      if (res === 'ok') setSessOk(true)
      else if (res) setTgState(res)
    })
    adminSession().then((ok) => { if (alive && ok) setSessOk(true) })
    return () => { alive = false }
  }, [])

  const update = React.useCallback((patch: Partial<AdminData>) => {
    setData(d => {
      const n = { ...(d || EMPTY_DATA), ...patch }
      try { localStorage.setItem('tk-admin-data', JSON.stringify(n)) } catch {}
      return n
    })
  }, [])

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch('/api/admin?action=bootstrap', { headers: authHeaders(key, role, uid) })
      if (!r.ok) return
      const j = await r.json()
      if (j?.ok) {
        const n: AdminData = { orders: j.orders || [], stats: j.stats || null, cats: j.cats || [], items: j.items || [], promos: j.promos || [] }
        setData(n)
        try { localStorage.setItem('tk-admin-data', JSON.stringify(n)) } catch {}
      }
    } catch {}
  }, [key, role, uid])

  React.useEffect(() => {
    if (!(!!key || roleOk)) return
    refresh()
  }, [refresh])
  React.useEffect(() => {
    if (sessOk) refresh()
  }, [sessOk, refresh])

  const H = React.useCallback(() => (sessOk && !key && !roleOk ? {} : authHeaders(key, role, uid)), [sessOk, key, role, uid])
  const refreshSess = React.useCallback(async () => {
    try {
      const r = await fetch('/api/admin?action=bootstrap', { headers: H() })
      if (!r.ok) return
      const j = await r.json()
      if (j?.ok) {
        const n: AdminData = { orders: j.orders || [], stats: j.stats || null, cats: j.cats || [], items: j.items || [], promos: j.promos || [] }
        setData(n)
        try { localStorage.setItem('tk-admin-data', JSON.stringify(n)) } catch {}
      }
    } catch {}
  }, [H])

  const ctx: AdminCtx = {
    key, roleOk, uid,
    h: H,
    ready: !!key || roleOk || sessOk,
    data: data || EMPTY_DATA,
    update, refresh: sessOk ? refreshSess : refresh,
    refreshRole: () => {},
  }

  const authed = !!key || roleOk || sessOk || (wasOk && !roleReady)
  if (!authed) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center justify-center -space-x-3">
            <span className="relative z-10 w-16 h-16 rounded-full bg-[#229ED9] grid place-items-center text-white shadow-lg"><IcPlane s={26} /></span>
            <span className="w-16 h-16 rounded-full tekit-pattern grid place-items-center text-[30px] shadow-lg">🔐</span>
          </div>
          <h1 className="mt-4 text-center text-[19px] font-extrabold">{t.aTgLogin}</h1>
          <p className="mt-1.5 text-center text-[13px] font-medium text-[var(--mut2)] leading-relaxed">{t.aTgSub}</p>
          {tgOAuthConfigured() && !tgUser() && (
            <>
              <button onClick={() => tgOAuthStart()}
                className="press mt-5 w-full py-3.5 rounded-full bg-[#229ED9] text-white text-[15px] font-extrabold shadow-[0_10px_22px_-8px_rgba(34,158,217,.7)] active:scale-[.98] transition-transform flex items-center justify-center gap-2.5">
                <IcPlane s={18} />{t.aTgLogin}
              </button>
            </>
          )}
          {tgState === 'pending' && <div className="mt-3 text-center text-[12.5px] font-bold">{t.aTgPending}</div>}
          {tgState === 'fail' && <div className="mt-2 text-center text-[12.5px] font-bold a-bad-text">{t.aTgErr}</div>}
          <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer"
            className="mt-3 block text-center text-[12.5px] font-bold text-[#229ED9] hover:underline">{t.aTgOpenBot} · @tekitsushi_bot</a>
          <div className="mt-5 flex items-center gap-3 text-[11px] font-bold text-[var(--mut)]">
            <span className="h-px flex-1 bg-[var(--line2)]" /><span>yoki</span><span className="h-px flex-1 bg-[var(--line2)]" />
          </div>
          <p className="mt-4 text-center text-[13px] font-semibold text-[var(--mut3)]">{t.adminPass}</p>
          <input value={input} onChange={e => setInput(e.target.value)} type="password"
            className="mt-2.5 w-full bg-[var(--panel)] border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-[var(--btn)]" placeholder="••••••••" />
          <button onClick={async () => { const ok = await verify(input); if (ok) { setKey(input); haptic('success') } else { setErr('x'); haptic('error') } }}
            className="press mt-3 w-full py-3.5 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[15px] font-extrabold shadow-[0_10px_22px_-8px_rgba(15,30,154,.6)] active:scale-[.98] transition-transform">
            {t.login}
          </button>
          {err && <div className="mt-2 text-center text-[12.5px] font-bold a-bad-text">{t.wrongPass}</div>}
        </div>
      </div>
    )
  }
  return <ACtx.Provider value={ctx}>{children}{tabs && <AdminTabBar />}</ACtx.Provider>
}


/* Telegram kuchi: rasmiy paper-plane belgisi */
function IcPlane({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.04 15.51 8.9 19.1c.36 0 .52-.16.71-.35l1.7-1.63 3.53 2.59c.65.36 1.11.17 1.28-.6l2.32-10.9c.21-.98-.35-1.37-.99-1.13L4.09 11.4c-.95.37-.93.9-.16 1.14l3.5 1.09 8.13-5.13c.38-.25.73-.11.44.14z" />
    </svg>
  )
}

/* Telegram Login (yangi OIDC oqimi): popup widget o'rniga to'liq sahifa yo'naltirish.
   scope 'user': mijoz sifatida kirish (Onboarding). Admin oqimi tgOAuthStart bilan. */
export function TelegramWidget({ onResult, scope }: { onResult: (r: 'ok' | 'pending' | 'fail', j?: any) => void; scope?: 'user' }) {
  React.useEffect(() => {
    if (scope !== 'user') return
    const handler = (e: Event) => {
      const j = ((e as CustomEvent).detail || {}) as any
      onResult(j.ok ? 'ok' : (j.pending ? 'pending' : 'fail'), j)
    }
    window.addEventListener('tk-tg-oidc', handler)
    return () => window.removeEventListener('tk-tg-oidc', handler)
  }, [])
  if (scope !== 'user') return null
  return (
    <button onClick={() => { void tgOAuthStartUser() }}
      className="press w-full py-3.5 rounded-2xl bg-[#229ED9] text-white text-[14.5px] font-extrabold shadow-[0_10px_22px_-8px_rgba(34,158,217,.7)] active:scale-[.98] transition-transform flex items-center justify-center gap-2.5">
      <IcPlane s={17} />Telegram orqali kirish
    </button>
  )
}

/* Eski widget oqimi (arxivlangan): ishlatilmaydi, lekin kod saqlanadi. */
function TgWidgetLegacy({ onResult, scope }: { onResult: (r: 'ok' | 'pending' | 'fail', j?: any) => void; scope?: 'user' }) {
  React.useEffect(() => {
    try { (window as any).onTgWidgetAuth = (u: any) => window.dispatchEvent(new CustomEvent('tk-tg-widget', { detail: u })) } catch {}
    const bot = String(import.meta.env.VITE_TELEGRAM_LOGIN_CLIENT_ID || '').trim()
    if (!bot) return
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', bot)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-radius', '10')
    s.setAttribute('data-onauth', 'onTgWidgetAuth(user)')
    s.setAttribute('data-request-access', 'write')
    const slot = document.getElementById('tk-tg-widget-slot')
    slot?.appendChild(s)
    const handler = (e: Event) => {
      const u = (e as CustomEvent).detail
      tgWidgetLogin(u, scope).then((j) => onResult(j.ok ? 'ok' : (j.pending ? 'pending' : 'fail'), j))
    }
    window.addEventListener('tk-tg-widget', handler)
    return () => {
      window.removeEventListener('tk-tg-widget', handler)
      try { slot?.replaceChildren() } catch {}
    }
  }, [])
  return <div id="tk-tg-widget-slot" className="mt-3 flex justify-center [&_iframe]:max-w-full" />
}

export function AdminTopBar({ title, right, back }: { title: string; right?: React.ReactNode; back?: boolean }) {
  useNativeBack(!!back)
  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-navy-line"
      style={{ paddingTop: 'calc(10px + var(--sat))' }}>
      <div className="flex items-center gap-2.5 px-4 pb-2.5">
        <div className="text-[16.5px] font-extrabold flex-1 truncate">{title}</div>
        {right}
      </div>
    </header>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={e => { e.stopPropagation(); onChange(!on); haptic() }}
      className={`press relative w-[46px] h-[28px] rounded-full transition-colors duration-200 ${on ? 'bg-[var(--chip-on)]' : 'bg-[var(--line2)]'}`}>
      <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-[var(--chip-on-ink)] shadow transition-all duration-200 ${on ? 'left-[21px]' : 'left-[3px]'}`} />
    </button>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-[var(--mut)] mb-1.5">{label}</div>
      {children}
    </label>
  )
}
export const inputCls = "w-full bg-[var(--panel)] border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-[var(--btn)] focus:ring-2 focus:ring-[rgba(41,168,224,.3)] placeholder:text-[var(--ink3)]"

export function Btn({ children, onClick, kind = 'primary', disabled, small }: {
  children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'danger' | 'soft'; disabled?: boolean; small?: boolean
}) {
  const cls = {
    primary: 'bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_8px_18px_-8px_rgba(15,30,154,.55)]',
    ghost: 'bg-[var(--panel)] text-navy-ink border border-navy-line',
    soft: 'bg-navy-soft text-navy-ink',
    danger: 'bg-[rgba(239,68,68,.12)] a-bad-text border border-[rgba(239,68,68,.35)]',
  }[kind]
  return (
    <button onClick={onClick} disabled={disabled} className={`press ${small ? 'px-3 py-2 text-[12.5px] rounded-xl' : 'w-full py-3.5 text-[14.5px] rounded-2xl'} font-extrabold ${cls} disabled:opacity-40 active:scale-[.97] transition-all`}>
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-end lg:items-center lg:justify-center pointer-events-none px-0 lg:px-4">
        <div
          className="anim-sheet pointer-events-auto w-full lg:w-[440px] bg-paper rounded-t-[26px] lg:rounded-[26px] px-5 pt-3 shadow-[0_-18px_40px_-20px_rgba(15,30,154,.35)] lg:shadow-[0_24px_60px_rgba(15,30,154,.28)]"
          style={{ paddingBottom: 'calc(20px + var(--sab))' }}>
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line2)] lg:hidden" />
          <div className="text-[17px] font-extrabold">{title}</div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>, document.body)
}

export function StatTile({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className={`rounded-[20px] p-4 ${accent ? 'tekit-pattern text-white shadow-[0_12px_28px_-12px_rgba(15,30,154,.5)]' : 'bg-[var(--panel)] border border-navy-line'}`}>
      <div className={`text-[11.5px] font-bold uppercase tracking-wide ${accent ? 'text-white/75' : 'text-[var(--mut)]'}`}>{label}</div>
      <div className="mt-1.5 text-[21px] font-extrabold tracking-tight leading-none">{value}</div>
      {sub && <div className={`mt-1 text-[11.5px] font-semibold ${accent ? 'text-white/75' : 'text-[var(--mut)]'}`}>{sub}</div>}
    </div>
  )
}


const TAB_ICON: Record<string, JSX.Element> = {
  orders: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M8 11h8M8 15h5" /></svg>,
  menu: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>,
  promos: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>,
  customers: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  dash: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>,
  access: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate tabs>
      <AdminSidebar />
      <div className="tk-admin lg:pl-[248px]">{children}</div>
    </AdminGate>
  )
}

function AdminSidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { t } = useStore()
  const a = useAdmin()
  const pending = (a.data?.orders || []).filter((o: any) => o.status === 'new').length
  const items = [
    { id: 'orders', to: '/admin', label: t.aTabO, icon: TAB_ICON.orders },
    { id: 'menu', to: '/admin/menu', label: t.aTabM, icon: TAB_ICON.menu },
    { id: 'promos', to: '/admin/promos', label: t.aTabP, icon: TAB_ICON.promos },
    { id: 'dash', to: '/admin/dash', label: t.aTabD, icon: TAB_ICON.dash },
    { id: 'customers', to: '/admin/customers', label: t.aTabC, icon: TAB_ICON.customers },
    { id: 'access', to: '/admin/access', label: t.aTabA, icon: TAB_ICON.access },
  ]
  const on = (to: string) => to === '/admin' ? loc.pathname === '/admin' || loc.pathname === '/admin/orders' : loc.pathname.startsWith(to)
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[248px] z-40 bg-[var(--panel)] border-r border-navy-line flex-col">
      <div className="px-5 pt-5 pb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10 rounded-xl bg-navy-soft" alt="" />
          <div>
            <div className="text-[15px] font-extrabold text-[var(--btn)] leading-tight">Tekit</div>
            <div className="text-[10px] font-extrabold text-[var(--mut)] uppercase tracking-[0.18em] mt-0.5">Admin panel</div>
          </div>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(it => {
          const act = on(it.to)
          return (
            <button key={it.id} onClick={() => { if (!act) { haptic(); nav(it.to) } }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13.5px] font-extrabold transition-colors ${act ? 'bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_8px_18px_-8px_rgba(15,30,154,.55)]' : 'text-[var(--mut3)] hover:bg-navy-soft'}`}>
              <span className={act ? 'text-[var(--btn-ink)]' : 'text-[var(--mut)]'}>{it.icon}</span>
              <span className="flex-1 text-left">{it.label}</span>
              {it.id === 'orders' && !!pending && (
                <span className="min-w-[19px] h-[19px] px-1 rounded-full bg-red-600 text-white text-[10.5px] font-extrabold grid place-items-center leading-none">{pending}</span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="px-5 py-4 text-[10.5px] font-bold text-[var(--ink3)]">Tekit Sushi · v1.0</div>
    </aside>
  )
}

function AdminTabBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { t } = useStore()
  const a = useAdmin()
  const pending = (a.data?.orders || []).filter((o: any) => o.status === 'new').length

  const tabs = [
    { id: 'orders', to: '/admin', label: t.aTabO, icon: 'orders' },
    { id: 'menu', to: '/admin/menu', label: t.aTabM, icon: 'menu' },
    { id: 'promos', to: '/admin/promos', label: t.aTabP, icon: 'promos' },
    { id: 'dash', to: '/admin/dash', label: t.aTabD, icon: 'dash' },
    { id: 'customers', to: '/admin/customers', label: t.aTabC, icon: 'customers' },
    { id: 'access', to: '/admin/access', label: t.aTabA, icon: 'access' },
  ]
  const on = (to: string) => to === '/admin' ? loc.pathname === '/admin' || loc.pathname === '/admin/orders' : loc.pathname.startsWith(to)
  return (
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-[var(--panel)] border-t border-navy-line lg:hidden"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex">
        {tabs.map(tb => {
          const act = on(tb.to)
          return (
            <button key={tb.id} onClick={() => { if (!act) { haptic(); nav(tb.to) } }}
              className={`press flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-bold transition-colors ${act ? 'text-[var(--chip-on)]' : 'text-[var(--ink3)]'}`}>
              <span className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${act ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)] px-4 py-1' : 'px-1 py-1'}`}>
                {TAB_ICON[tb.id]}
                {tb.id === 'orders' && !!pending && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-red-600 text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-[var(--panel)]">{pending}</span>
                )}
              </span>
              {tb.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
