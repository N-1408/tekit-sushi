import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useStore } from '../../lib/store'
import { T } from '../../lib/i18n'
import { tgUser, haptic, useNativeBack } from '../../lib/tg'
import { authHeaders } from '../../lib/admin'

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
  const t: any = T.en
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

  const ctx: AdminCtx = {
    key, roleOk, uid,
    h: () => authHeaders(key, role, uid),
    ready: !!key || roleOk,
    data: data || EMPTY_DATA,
    update, refresh,
    refreshRole: () => {},
  }

  const authed = !!key || roleOk || (wasOk && !roleReady)
  if (!authed) {
    return (
      <div className="pb-28">
        <div className="px-4 mt-8">
          <div className="tekit-pattern w-20 h-20 rounded-[22px] mx-auto grid place-items-center text-[36px] shadow-lg">🔐</div>
          <p className="mt-4 text-center text-[14px] font-semibold text-[#4A5270]">{t.adminPass}</p>
          <input value={input} onChange={e => setInput(e.target.value)} type="password"
            className="mt-4 w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-navy" placeholder="••••••••" />
          <button onClick={async () => { const ok = await verify(input); if (ok) { setKey(input); haptic('success') } else { setErr('x'); haptic('error') } }}
            className="press mt-3 w-full py-4 rounded-2xl bg-navy text-white text-[15.5px] font-extrabold shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform">
            {t.login}
          </button>
          {err && <div className="mt-2 text-center text-[12.5px] font-bold text-red-500">{t.wrongPass}</div>}
        </div>
      </div>
    )
  }
  return <ACtx.Provider value={ctx}>{children}{tabs && <AdminTabBar />}</ACtx.Provider>
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
      className={`press relative w-[46px] h-[28px] rounded-full transition-colors duration-200 ${on ? 'bg-navy' : 'bg-[#D8DCEA]'}`}>
      <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-[21px]' : 'left-[3px]'}`} />
    </button>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-[#8A93B8] mb-1.5">{label}</div>
      {children}
    </label>
  )
}
export const inputCls = "w-full bg-white border border-navy-line rounded-xl px-3.5 py-3 text-[14px] font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 placeholder:text-[#A2A9C6]"

export function Btn({ children, onClick, kind = 'primary', disabled, small }: {
  children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'danger' | 'soft'; disabled?: boolean; small?: boolean
}) {
  const cls = {
    primary: 'bg-navy text-white shadow-[0_8px_18px_-8px_rgba(10,33,148,.55)]',
    ghost: 'bg-white text-navy-ink border border-navy-line',
    soft: 'bg-navy-soft text-navy-ink',
    danger: 'bg-red-50 text-red-600 border border-red-200',
  }[kind]
  return (
    <button onClick={onClick} disabled={disabled} className={`press ${small ? 'px-3 py-2 text-[12.5px] rounded-xl' : 'w-full py-3.5 text-[14.5px] rounded-2xl'} font-extrabold ${cls} disabled:opacity-40 active:scale-[.97] transition-all`}>
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-navy-deep/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="anim-sheet absolute inset-x-0 bottom-0 bg-paper rounded-t-[26px] px-5 pt-3 shadow-[0_-18px_40px_-20px_rgba(10,33,148,.35)]"
        style={{ paddingBottom: 'calc(20px + var(--sab))' }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D8DCEA]" />
        <div className="text-[17px] font-extrabold">{title}</div>
        <div className="mt-3">{children}</div>
      </div>
    </div>, document.body)
}

export function StatTile({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className={`rounded-[20px] p-4 ${accent ? 'tekit-pattern text-white shadow-[0_12px_28px_-12px_rgba(10,33,148,.5)]' : 'bg-white border border-navy-line'}`}>
      <div className={`text-[11.5px] font-bold uppercase tracking-wide ${accent ? 'text-white/75' : 'text-[#8A93B8]'}`}>{label}</div>
      <div className="mt-1.5 text-[21px] font-extrabold tracking-tight leading-none">{value}</div>
      {sub && <div className={`mt-1 text-[11.5px] font-semibold ${accent ? 'text-white/75' : 'text-[#8A93B8]'}`}>{sub}</div>}
    </div>
  )
}


const TAB_ICON: Record<string, JSX.Element> = {
  orders: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M8 11h8M8 15h5" /></svg>,
  menu: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>,
  promos: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>,
  dash: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>,
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate tabs>
      <AdminSidebar />
      <div className="lg:pl-[248px]">{children}</div>
    </AdminGate>
  )
}

function AdminSidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const t: any = T.en
  const a = useAdmin()
  const pending = (a.data?.orders || []).filter((o: any) => o.status === 'new').length
  const items = [
    { id: 'orders', to: '/admin', label: t.aTabO, icon: TAB_ICON.orders },
    { id: 'menu', to: '/admin/menu', label: t.aTabM, icon: TAB_ICON.menu },
    { id: 'promos', to: '/admin/promos', label: t.aTabP, icon: TAB_ICON.promos },
    { id: 'dash', to: '/admin/dash', label: t.aTabD, icon: TAB_ICON.dash },
  ]
  const on = (to: string) => to === '/admin' ? loc.pathname === '/admin' || loc.pathname === '/admin/orders' : loc.pathname.startsWith(to)
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[248px] z-40 bg-white border-r border-navy-line flex-col">
      <div className="px-5 pt-5 pb-6 flex items-center gap-3">
        <img src="/logo.png" className="w-10 h-10 rounded-xl bg-navy-soft" alt="" />
        <div>
          <div className="text-[15px] font-extrabold text-navy leading-tight">Tekit</div>
          <div className="text-[10px] font-extrabold text-[#8A93B8] uppercase tracking-[0.18em] mt-0.5">Admin panel</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(it => {
          const act = on(it.to)
          return (
            <button key={it.id} onClick={() => { if (!act) { haptic(); nav(it.to) } }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13.5px] font-extrabold transition-colors ${act ? 'bg-navy text-white shadow-[0_8px_18px_-8px_rgba(10,33,148,.55)]' : 'text-[#4A5270] hover:bg-navy-soft'}`}>
              <span className={act ? 'text-white' : 'text-[#8A93B8]'}>{it.icon}</span>
              <span className="flex-1 text-left">{it.label}</span>
              {it.id === 'orders' && !!pending && (
                <span className="min-w-[19px] h-[19px] px-1 rounded-full bg-red-600 text-white text-[10.5px] font-extrabold grid place-items-center leading-none">{pending}</span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="px-5 py-4 text-[10.5px] font-bold text-[#A2A9C6]">Tekit Sushi · v1.0</div>
    </aside>
  )
}

function AdminTabBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const t: any = T.en
  const a = useAdmin()
  const pending = (a.data?.orders || []).filter((o: any) => o.status === 'new').length

  const tabs = [
    { id: 'orders', to: '/admin', label: t.aTabO, icon: 'orders' },
    { id: 'menu', to: '/admin/menu', label: t.aTabM, icon: 'menu' },
    { id: 'promos', to: '/admin/promos', label: t.aTabP, icon: 'promos' },
    { id: 'dash', to: '/admin/dash', label: t.aTabD, icon: 'dash' },
  ]
  const on = (to: string) => to === '/admin' ? loc.pathname === '/admin' || loc.pathname === '/admin/orders' : loc.pathname.startsWith(to)
  return (
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-navy-line lg:hidden"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex">
        {tabs.map(tb => {
          const act = on(tb.to)
          return (
            <button key={tb.id} onClick={() => { if (!act) { haptic(); nav(tb.to) } }}
              className={`press flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-bold transition-colors ${act ? 'text-navy' : 'text-[#A2A9C6]'}`}>
              <span className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${act ? 'bg-navy-soft px-4 py-1' : 'px-1 py-1'}`}>
                {TAB_ICON[tb.id]}
                {tb.id === 'orders' && !!pending && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-red-600 text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-white">{pending}</span>
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
