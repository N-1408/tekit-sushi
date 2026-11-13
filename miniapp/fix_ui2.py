f = 'src/components/ui.tsx'
s = open(f, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    if old not in s:
        print('FAIL:', old[:70].replace('\n','|')); return
    s = s.replace(old, new, cnt)

# 1) ThemeToggle -> iOS switch
OLD_TT = '''export function ThemeToggle() {
  const { theme, setTheme } = useStore()
  const dark = theme === 'dark'
  return (
    <button aria-label="theme" onClick={() => { haptic('light'); setTheme(dark ? 'light' : 'dark') }}
      className={`press shrink-0 w-10 h-10 rounded-full bg-[var(--soft)] text-[var(--ink)] grid place-items-center active:scale-95 transition-transform`}>
      {dark ? <IcSun /> : <IcMoon />}
    </button>
  )
}'''
NEW_TT = '''export function ThemeToggle() {
  const { theme, setTheme } = useStore()
  const dark = theme === 'dark'
  return (
    <button aria-label="theme" onClick={() => { haptic('light'); setTheme(dark ? 'light' : 'dark') }}
      className={`press relative shrink-0 w-[52px] h-[30px] rounded-full border border-[var(--line2)] transition-colors ${dark ? 'bg-[var(--soft)]' : 'bg-[#E4E9F2]'}`}>
      <span className={`absolute top-[3px] w-6 h-6 rounded-full grid place-items-center shadow-[0_2px_6px_rgba(0,0,0,.25)] transition-all duration-300 ${dark ? 'left-[25px] bg-[#2A3442] text-[#E9EDF1]' : 'left-[3px] bg-white text-[#0A2194]'}`}>
        {dark ? <IcMoon s={13} /> : <IcSun s={13} />}
      </span>
    </button>
  )
}'''
rep(OLD_TT, NEW_TT)

# 2) Header: savatni olib tashlash, shahar textini olib tashlash, manzil box
rep('          <ThemeToggle />\n          <CartBtn />\n', '          <ThemeToggle />\n')
OLD_CITY = '''          <button onClick={() => nav('/profile')} className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-bold text-[var(--ink)] active:opacity-80 transition-opacity">
            <IcPin /> {t.city}
          </button>
'''
rep(OLD_CITY, '')
OLD_ADDR = '''          <button onClick={() => nav('/profile')} className="hidden lg:flex items-center gap-1.5 border border-[var(--line2)] rounded-xl px-3.5 py-2.5 text-[12.5px] font-bold text-[var(--ink)] active:opacity-80 transition-opacity">
            <IcPin /> {t.spAddr}
          </button>'''
rep(OLD_ADDR, '          <AddressBox />')
OLD_MODE = '''                className={`px-4 py-2 rounded-full text-[12.5px] font-extrabold transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                {m === 'delivery' ? t.deliveryMode : t.pickup}'''
NEW_MODE = '''                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-extrabold transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                <span className="flex items-center gap-1.5">{m === 'delivery' ? <IcTruck s={14} /> : <IcStore s={14} />}{m === 'delivery' ? t.deliveryMode : t.pickup}</span>'''
rep(OLD_MODE, NEW_MODE)

# 3) TopBar: savatni olib tashlash
rep('''          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartBtn />
            <LangPicker dark />
          </div>''', '''          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LangPicker dark />
          </div>''')

# 4) ProductCard: butunlay qayta yozish (flex-col, tugma nomga yopiq, tekis)
i1 = s.index('/* ---------- mahsulot kartochkasi ---------- */')
i2 = s.index('export function Sheet(')
NEW_CARD = '''/* ---------- mahsulot kartochkasi ---------- */
export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, setQty, lang, favs, toggleFav, t, openP } = useStore()
  const fav = favs.includes(p.id)
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  const wtxt = p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')
  return (
    <article onClick={() => { haptic(); openP(p) }}
      className="anim-up cursor-pointer flex flex-col h-full"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className="relative aspect-[11/10] rounded-[12px] overflow-hidden bg-[var(--sheet)] shrink-0">
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); toggleFav(p.id); haptic(fav ? 'light' : 'medium') }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-[var(--bg2)]/80 grid place-items-center active:scale-90 transition-transform">
          <Heart on={fav} s={15} />
        </button>
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-[var(--bg2)]/85 text-white text-[10.5px] font-extrabold px-1.5 py-1 rounded-[8px]">
          <IcStar /> {((p as any).rating ?? RSEED(p.id)).toFixed(1)}
        </span>
        {sale ? (
          <span className="absolute top-11 left-2 flex flex-col items-start gap-1">
            <span className="bg-gradient-to-r from-[#FF8A3C] to-[#F5493D] text-white text-[10.5px] font-extrabold tracking-wide px-2 py-1 rounded-[8px]">−{p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)}%</span>
            <span className="bg-black/45 text-white text-[10px] font-bold px-2 py-0.5 rounded-[8px] line-through">{fmt(p.old_price)} UZS</span>
          </span>
        ) : p.hit ? <span className="absolute top-11 left-2 bg-[var(--bg2)]/85 text-white text-[10.5px] font-extrabold tracking-wide px-2 py-1 rounded-[8px]">{t.hit}</span> : null}
        {wtxt && <span className="absolute bottom-2 left-2 bg-black/45 text-white text-[10.5px] font-bold px-2 py-1 rounded-[8px] backdrop-blur-[2px]">{wtxt}</span>}
      </div>
      <div className="mt-auto pt-2 flex flex-col">
        <div className="text-[14.5px] font-bold leading-snug text-[var(--ink)] line-clamp-2">{pName(p, lang)}</div>
        {q > 0 ? (
          <div className="mt-1.5 w-full h-[44px] rounded-[12px] bg-[var(--btn)] text-[var(--bg2)] flex items-center justify-between px-1.5">
            <button onClick={e => { e.stopPropagation(); setQty(p.id, q - 1); haptic('light') }}
              className="press w-9 h-9 rounded-[9px] grid place-items-center active:scale-90 transition-transform">
              <IcX s={14} />
            </button>
            <span className="text-[14px] font-extrabold">{q}</span>
            <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium') }}
              className="press w-9 h-9 rounded-[9px] grid place-items-center active:scale-90 transition-transform">
              <IcPlus s={15} />
            </button>
          </div>
        ) : (
          <button onClick={e => { e.stopPropagation(); add(p.id); haptic('medium') }}
            className="press mt-1.5 w-full h-[44px] rounded-[12px] bg-[var(--btn)] text-[var(--bg2)] flex items-center justify-center gap-2 text-[14.5px] font-extrabold active:scale-[.98] transition-transform">
            <IcBag s={17} /> {fmt(p.price)} <span className="text-[11px] font-bold opacity-70">UZS</span>
          </button>
        )}
      </div>
    </article>
  )
}

'''
s = s[:i1] + NEW_CARD + s[i2:]
open(f, 'w', encoding='utf-8').write(s)
print('part2 ok')
