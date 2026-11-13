import re
def edit(f, fn):
    s = open(f, encoding='utf-8').read()
    s2 = fn(s)
    if s2 is None: print('SKIP', f); return
    open(f, 'w', encoding='utf-8').write(s2)
    print('ok', f)

def rep_factory(s, log):
    def rep(old, new, cnt=1):
        nonlocal_s = None
    return None

# --- NUL qoldiqlari ---
def nulfix(s):
    n = s.count('\x00')
    return s.replace('\x00KEEP\x00', '').replace('\\x00KEEP\\x00', '')
edit('src/components/ui.tsx', nulfix)
edit('src/screens/Product.tsx', nulfix)

# --- index.css: light rejim asosiy rang brend ko'k ---
def css(s):
    old = "  --btn:#101821; --btn-ink:#FFFFFF; --chip-on:#101821; --chip-on-ink:#FFFFFF;"
    if old not in s: print('FAIL css'); return s
    return s.replace(old, "  --btn:#0A2194; --btn-ink:#FFFFFF; --chip-on:#0A2194; --chip-on-ink:#FFFFFF;", 1)
edit('src/index.css', css)

# --- store.tsx: deliveryCfg ---
def store(s):
    rep = lambda old, new: s.replace(old, new, 1)
    a = rep("  theme: ThemeMode\n  setTheme: (t: ThemeMode) => void\n}",
            "  theme: ThemeMode\n  setTheme: (t: ThemeMode) => void\n  deliveryCfg: { fee: number; threshold: number }\n}")
    b = rep("  const [mode, setModeS] = useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))",
            "  const [mode, setModeS] = useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))\n"
            "  const [deliveryCfg, setDeliveryCfg] = useState<{ fee: number; threshold: number }>(() => ({ fee: 15000, threshold: 200000 }))")
    c = rep("      setProducts(j.items)\n      try { localStorage.setItem('tk-menu-v2', JSON.stringify(j.items)) } catch {}",
            "      setProducts(j.items)\n      if (j.delivery) setDeliveryCfg({ fee: Number(j.delivery.fee) || 15000, threshold: Number(j.delivery.threshold) || 200000 })\n"
            "      try { localStorage.setItem('tk-menu-v2', JSON.stringify(j.items)) } catch {}")
    d = rep("mode, setMode, theme, setTheme }", "mode, setMode, theme, setTheme, deliveryCfg }")
    e = rep("openOb, closeOb, mode, setMode, theme, setTheme])", "openOb, closeOb, mode, setMode, theme, setTheme, deliveryCfg])")
    out = a if False else s
    for old, new in [("  theme: ThemeMode\n  setTheme: (t: ThemeMode) => void\n}",
                      "  theme: ThemeMode\n  setTheme: (t: ThemeMode) => void\n  deliveryCfg: { fee: number; threshold: number }\n}"),
                     ("  const [mode, setModeS] = useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))",
                      "  const [mode, setModeS] = useState<'delivery' | 'pickup'>(() => (localStorage.getItem('tk-mode') === 'pickup' ? 'pickup' : 'delivery'))\n  const [deliveryCfg, setDeliveryCfg] = useState<{ fee: number; threshold: number }>(() => ({ fee: 15000, threshold: 200000 }))"),
                     ("      setProducts(j.items)\n      try { localStorage.setItem('tk-menu-v2', JSON.stringify(j.items)) } catch {}",
                      "      setProducts(j.items)\n      if (j.delivery) setDeliveryCfg({ fee: Number(j.delivery.fee) || 15000, threshold: Number(j.delivery.threshold) || 200000 })\n      try { localStorage.setItem('tk-menu-v2', JSON.stringify(j.items)) } catch {}"),
                     ("mode, setMode, theme, setTheme }", "mode, setMode, theme, setTheme, deliveryCfg }"),
                     ("openOb, closeOb, mode, setMode, theme, setTheme])", "openOb, closeOb, mode, setMode, theme, setTheme, deliveryCfg])")]:
        if old not in out: print('FAIL store:', old[:50]); continue
        out = out.replace(old, new, 1)
    return out
edit('src/lib/store.tsx', store)

# --- Home.tsx: grid 3 ustun + manzil box mobil ---
def home(s):
    out = s.replace('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4',
                    'grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7')
    if out == s: print('FAIL home grid')
    out = out.replace("<CityBanner />", "<div className=\"px-4 lg:hidden\"><AddressBox mobile /></div>\n        <CityBanner />", 1)
    out = out.replace("import { Header, SearchChips, CityBanner, HeroSlider, InfoTiles, ProductCard } from '../components/ui'",
                      "import { Header, SearchChips, CityBanner, HeroSlider, InfoTiles, ProductCard, AddressBox } from '../components/ui'")
    return out
edit('src/screens/Home.tsx', home)

def cat(s):
    out = s.replace('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4',
                    'grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-7')
    if out == s: print('FAIL cat grid')
    return out
edit('src/screens/Cat.tsx', cat)

# --- App.tsx ---
def app(s):
    out = s.replace("import { TabBar, ProductSheet } from './components/ui'",
                    "import { TabBar, ProductSheet, FloatingCart, ScrollTop, FreeDeliveryPopup } from './components/ui'")
    out = out.replace("      {!isAdmin && <TabBar />}",
                      "      {!isAdmin && <><TabBar /><FloatingCart /><ScrollTop /><FreeDeliveryPopup /></>}")
    return out
edit('src/App.tsx', app)

# --- MapPicker: CARTO tile + lokatsiya tugmasi ---
def mp(s):
    out = s.replace("L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m)",
                    "L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(m)")
    if out == s: print('FAIL mp tile')
    out = out.replace("  const [err, setErr] = useState(false)",
                      "  const [err, setErr] = useState(false)\n  const [locBusy, setLocBusy] = useState(false)")
    out = out.replace('''  async function pick() {''', '''  function locateMe() {
    if (locBusy || !navigator.geolocation) return
    setLocBusy(true)
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      setPt(p)
      mapRef.current?.setView([p.lat, p.lon], 16)
      mkRef.current?.setLatLng([p.lat, p.lon])
      haptic('light')
      setLocBusy(false)
    }, () => setLocBusy(false), { enableHighAccuracy: true, timeout: 8000 })
  }

  async function pick() {''', 1)
    out = out.replace('      <div ref={boxRef} className="flex-1 relative" />', '''      <div className="flex-1 relative">
        <div ref={boxRef} className="absolute inset-0" />
        <button onClick={locateMe} aria-label="locate"
          className="absolute left-3 bottom-6 z-[500] w-11 h-11 rounded-xl bg-white text-[#0A2194] shadow-[0_8px_20px_rgba(0,0,0,.22)] grid place-items-center active:scale-90 transition-transform">
          {locBusy ? <span className="w-4 h-4 border-2 border-[#0A2194]/30 border-t-[#0A2194] rounded-full animate-spin" /> : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
          )}
        </button>
      </div>''', 1)
    return out
edit('src/components/MapPicker.tsx', mp)
