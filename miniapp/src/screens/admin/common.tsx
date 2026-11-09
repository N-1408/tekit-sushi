import React from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../../lib/store'
import { tgUser, haptic, useNativeBack } from '../../lib/tg'
import { authHeaders } from '../../lib/admin'

export type AdminCtx = {
  key: string; roleOk: boolean; uid?: number
  h: () => Record<string, string>
  refreshRole: () => void
}
const ACtx = React.createContext<AdminCtx>(null as any)
export const useAdmin = () => React.useContext(ACtx)

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { role, showToast } = useStore()
  const uid = tgUser()?.id
  const [key, setKey] = React.useState(() => { try { return localStorage.getItem('tk-admin') || '' } catch { return '' } })
  const [input, setInput] = React.useState('')
  const [err, setErr] = React.useState('')
  const { t } = useStore()
  const roleOk = !!uid && role === 'admin'

  const verify = React.useCallback(async (k: string) => {
    if (!k) return false
    try {
      const r = await fetch('/api/admin?action=promos', { headers: { 'X-Admin-Key': k } })
      if (r.ok) { try { localStorage.setItem('tk-admin', k) } catch {}; return true }
      return false
    } catch { return false }
  }, [])

  React.useEffect(() => {
    if (roleOk || !key) { setErr(''); return }
    verify(key).then(ok => { if (!ok) { try { localStorage.removeItem('tk-admin') } catch {}; setKey('') } })
  }, [roleOk, key, verify])

  const ctx: AdminCtx = {
    key, roleOk, uid,
    h: () => authHeaders(key, role, uid),
    refreshRole: () => {},
  }

  if (!roleOk && !key) {
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
  return <ACtx.Provider value={ctx}>{children}</ACtx.Provider>
}

export function AdminTopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  const { t } = useStore()
  useNativeBack(true)
  return (
    <header className="sticky top-0 z-30 bg-paper border-b border-navy-line"
      style={{ paddingTop: 'calc(10px + var(--sat))' }}>
      <div className="flex items-center gap-2.5 px-4 pb-2.5">
        <button onClick={() => history.back()} className="press w-9 h-9 rounded-full bg-white border border-navy-line grid place-items-center text-navy active:scale-90 transition-transform">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-[420px] bg-paper rounded-[24px] p-5 shadow-2xl anim-pop">
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
