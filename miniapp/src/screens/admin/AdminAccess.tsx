import React from 'react'
import { useStore } from '../../lib/store'
import { haptic } from '../../lib/tg'
import { AdminTopBar, useAdmin } from './common'
import { adminAccess, adminAccessDecide } from '../../lib/api'
import { fmtDT } from '../../lib/admin'

type Row = { tg_id: number; name?: string; username?: string; phone?: string; created_at?: string }

export default function AdminAccess() {
  const { t } = useStore()
  const a = useAdmin()
  const [list, setList] = React.useState<{ admins: Row[]; requests: Row[] } | null>(null)
  const [err, setErr] = React.useState(false)
  const [busy, setBusy] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    const l = await adminAccess()
    if (l) { setList(l); setErr(false) } else setErr(true)
  }, [])
  React.useEffect(() => { load() }, [load])

  const decide = async (tgId: number, approve: boolean) => {
    setBusy(tgId)
    try { await adminAccessDecide(tgId, approve); await load() } catch {}
    setBusy(null)
  }

  const sub = (u: Row) =>
    [u.username ? '@' + u.username : '', u.phone || ''].filter(Boolean).join(' · ') || `ID ${u.tg_id}`

  return (
    <>
      <AdminTopBar
        title={t.aAccTitle}
        right={
          <button onClick={() => { haptic(); load() }} aria-label="refresh"
            className="press w-9 h-9 rounded-xl grid place-items-center text-[var(--mut2)] hover:bg-[var(--soft)] active:scale-95 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
          </button>
        }
      />
      <div className="px-4 pb-28">
        {err && <div className="mt-4 text-[12.5px] font-bold a-bad-text">{t.aCustErr}</div>}
        <div className="bg-[var(--panel)] border border-navy-line rounded-[20px] p-4 mt-3">
          <div className="text-[13.5px] font-extrabold">{t.aAccReqs}</div>
          {!list && !err && <div className="mt-2 text-[12.5px] font-semibold text-[var(--mut)]">{t.aCustLoading}</div>}
          {list && list.requests.length === 0 && <div className="mt-2 text-[12.5px] font-semibold text-[var(--mut)]">{t.aAccNone}</div>}
          {list && list.requests.map((u) => (
            <div key={u.tg_id} className="py-3 border-b border-[var(--line)] last:border-0">
              <div className="text-[13.5px] font-extrabold truncate">{u.name || u.username || `ID ${u.tg_id}`}</div>
              <div className="text-[11.5px] font-semibold text-[var(--mut)] truncate">
                {sub(u)}{u.created_at ? ` · ${fmtDT(u.created_at)}` : ''}
              </div>
              <div className="mt-2 flex gap-2">
                <button disabled={busy === u.tg_id} onClick={() => decide(u.tg_id, true)}
                  className="press px-4 py-2 rounded-xl bg-[var(--btn)] text-[var(--btn-ink)] text-[12.5px] font-extrabold disabled:opacity-40 active:scale-95 transition-all">
                  {t.aAccApprove}
                </button>
                <button disabled={busy === u.tg_id} onClick={() => decide(u.tg_id, false)}
                  className="press px-4 py-2 rounded-xl bg-[rgba(239,68,68,.12)] a-bad-text border border-[rgba(239,68,68,.35)] text-[12.5px] font-extrabold disabled:opacity-40 active:scale-95 transition-all">
                  {t.aAccDeny}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[var(--panel)] border border-navy-line rounded-[20px] p-4 mt-3">
          <div className="text-[13.5px] font-extrabold">{t.aAccAdmins}</div>
          {!list && !err && <div className="mt-2 text-[12.5px] font-semibold text-[var(--mut)]">{t.aCustLoading}</div>}
          {list && list.admins.map((u) => (
            <div key={u.tg_id} className="py-2.5 border-b border-[var(--line)] last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-extrabold truncate">{u.name || u.username || `ID ${u.tg_id}`}</div>
                  <div className="text-[11.5px] font-semibold text-[var(--mut)] truncate">{sub(u)}</div>
                </div>
                <button onClick={() => { if (confirm(`${u.name || u.username || 'ID ' + u.tg_id} adminlikdan olib tashlanadi. Davom etamizmi?`)) decide(u.tg_id, false) }}
                  className="press px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,.1)] a-bad-text border border-[rgba(239,68,68,.3)] text-[11.5px] font-extrabold disabled:opacity-40 active:scale-95 transition-all">
                  {t.aAccRemove}
                </button>
              </div>
            </div>
          ))}
          {list && list.admins.length === 0 && <div className="mt-2 text-[12.5px] font-semibold text-[var(--mut)]">{t.aAccNone}</div>}
        </div>
      </div>
    </>
  )
}
