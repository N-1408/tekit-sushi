f = 'src/components/ui.tsx'
s = open(f, encoding='utf-8').read()

APPEND = '''

/* ---------- manzil box (bosh sahifa: xaritadan tanlash + avto-aniqlash) ---------- */
export function AddressBox({ mobile }: { mobile?: boolean }) {
  const { t, user, saveUser } = useStore()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const addr = user?.addr || ''
  async function detect() {
    if (busy) return
    setBusy(true)
    try {
      const mod = (await import('../lib/tg')) as any
      const loc = await mod.requestLocation()
      if (loc?.lat) {
        const r = await fetch(`/api/geocode?lat=${loc.lat}&lon=${loc.lon}`)
        const j = r.ok ? await r.json() : null
        saveUser(j?.ok && j.addr ? { addr: j.addr, lat: loc.lat, lon: loc.lon } : { lat: loc.lat, lon: loc.lon })
      }
    } catch {}
    setBusy(false)
  }
  const box = mobile
    ? 'press flex items-center gap-2 w-full bg-[var(--panel)] border border-[var(--line2)] rounded-xl pl-3 pr-1.5 py-1.5 lg:hidden'
    : 'hidden lg:flex items-center gap-1.5 border border-[var(--line2)] rounded-xl pl-3 pr-1 py-1 min-w-0 w-[240px] xl:w-[300px]'
  return (
    <>
      <div className={box}>
        <span className="text-[var(--mut2)] shrink-0"><IcPin /></span>
        <span onClick={() => setOpen(true)} className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-[var(--ink)] cursor-pointer py-1.5">{addr || t.addrPick}</span>
        <button onClick={detect} aria-label="locate" className="press w-8 h-8 rounded-lg grid place-items-center text-[#29A8E0] shrink-0 active:scale-90 transition-transform">
          {busy ? <span className="w-3.5 h-3.5 border-2 border-[#29A8E0]/30 border-t-[#29A8E0] rounded-full animate-spin" /> : <IcLocate s={15} />}
        </button>
      </div>
      <MapPicker
        open={open}
        initial={user?.lat && user?.lon ? { lat: user.lat, lon: user.lon } : null}
        onPick={(a, lat, lon) => { saveUser({ addr: a, lat, lon }) }}
        onClose={() => setOpen(false)}
        t={t}
      />
    </>
  )
}

/* ---------- suzuvchi savat tugmasi ---------- */
export function FloatingCart() {
  const { cartCount } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  if (loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  return (
    <button onClick={() => { haptic(); nav('/cart') }} aria-label="cart"
      className="press fixed right-4 z-[45] w-14 h-14 rounded-[18px] bg-navy text-white grid place-items-center shadow-[0_14px_30px_-8px_rgba(10,33,148,.6)] active:scale-95 transition-transform lg:!bottom-8"
      style={{ bottom: 'calc(92px + var(--sab))' }}>
      <IcBag s={26} />
      {cartCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8462B] text-white text-[11px] font-extrabold grid place-items-center leading-none border-2 border-[var(--bg)]">{cartCount}</span>
      )}
    </button>
  )
}

/* ---------- yuqoriga chiqish tugmasi ---------- */
export function ScrollTop() {
  const [show, setShow] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 480)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [loc.pathname])
  if (!show || loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="up"
      className="press fixed left-4 z-[45] w-12 h-12 rounded-[16px] bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] grid place-items-center shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)] active:scale-95 transition-transform lg:!bottom-8"
      style={{ bottom: 'calc(92px + var(--sab))' }}>
      <IcArrowUp s={20} />
    </button>
  )
}

/* ---------- bepul yetkazib berish progress popup ---------- */
export function FreeDeliveryPopup() {
  const { cartSum, t, deliveryCfg } = useStore()
  const [open, setOpen] = useState(false)
  const [sum, setSum] = useState(0)
  const prev = useRef<number | null>(null)
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (prev.current == null) { prev.current = cartSum; return }
    if (cartSum > prev.current) {
      setSum(cartSum); setOpen(true); haptic('medium')
      if (timer.current) clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setOpen(false), 4200)
    }
    prev.current = cartSum
  }, [cartSum])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  if (!open) return null
  const threshold = deliveryCfg?.threshold || 200000
  const pct = Math.min(1, sum / threshold)
  const left = Math.max(0, threshold - sum)
  const R = 26, C = 2 * Math.PI * R
  const close = () => { if (timer.current) clearTimeout(timer.current); setOpen(false) }
  return createPortal(
    <div className="fixed inset-0 z-[75] grid place-items-center px-6">
      <div className="absolute inset-0 bg-black/45 anim-fade" onClick={close} />
      <div className="relative anim-pop bg-[var(--sheet)] rounded-[26px] px-6 py-7 w-full max-w-[360px] text-center shadow-[0_30px_80px_rgba(0,0,0,.35)]">
        <button onClick={close} className="press absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--panel)] grid place-items-center text-[var(--mut2)]"><IcX /></button>
        <div className="relative w-16 h-16 mx-auto">
          <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="var(--line2)" strokeWidth="5" />
            <circle cx="32" cy="32" r={R} fill="none" stroke="#0A2194" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.32,.72,0,1)' }} />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[#0A2194]"><IcTruck s={24} /></span>
        </div>
        {left > 0 ? (
          <>
            <div className="mt-3 text-[17px] font-extrabold text-[var(--ink)]">{t.fdLeft.replace('{x}', fmt(left))}</div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-[var(--mut2)]">{t.fdTo}</div>
          </>
        ) : (
          <>
            <div className="mt-3 text-[17px] font-extrabold text-[var(--ink)]">{t.fdDone}</div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-[var(--mut2)]">{t.fdDoneSub}</div>
          </>
        )}
        <button onClick={close} className="press mt-4 w-full py-3 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[14px] font-extrabold">{t.cityOk}</button>
      </div>
    </div>,
    document.body
  )
}
'''
s += APPEND
# NUL artefaktlarini tozalash
s = s.replace('\\x00KEEP\\x00', '')
open(f, 'w', encoding='utf-8').write(s)
print('part3 ok, NUL left:', s.count('\\\\x00KEEP\\\\x00') + s.count('\x00'))
