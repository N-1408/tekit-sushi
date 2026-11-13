import re
f = 'src/components/ui.tsx'
s = open(f, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    if s.count(old) < cnt:
        print('FAIL:', old[:60].replace('\n','|')); return
    s = s.replace(old, new, cnt)

# 1) importlar
rep("import { useNavigate } from 'react-router-dom'",
    "import { useNavigate, useLocation } from 'react-router-dom'")
rep("import { haptic, useNativeBack, tgUser } from '../lib/tg'",
    "import { haptic, useNativeBack, tgUser } from '../lib/tg'\n"
    "import { List as PhList, Bag as PhBag, User as PhUser, MapPin as PhMapPin, Clock as PhClock, Tag as PhTag, Money as PhMoney, MagnifyingGlass as PhSearch, X as PhX, CaretLeft as PhCaretL, CaretRight as PhCaretR, Plus as PhPlus, ArrowsDownUp as PhSort, Sun as PhSun, Moon as PhMoon, ForkKnife as PhFork, Truck as PhTruck, Storefront as PhStore, ArrowUp as PhArrowUp, Crosshair as PhCross } from '@phosphor-icons/react'")

# 2) icon blok: Phosphor asosida
i1 = s.index('/* ---------- ikonkalar')
i2 = s.index('const Heart = ({ on')
NEW_ICONS = '''/* ---------- ikonkalar (Phosphor — yagona uslub) ---------- */
export const IcBurger = ({ s = 18 }: { s?: number }) => <PhList size={s} weight="bold" />
export const IcBag = ({ s = 18 }: { s?: number }) => <PhBag size={s} weight="bold" />
export const IcUser = ({ s = 18 }: { s?: number }) => <PhUser size={s} weight="bold" />
export const IcPin = ({ s = 15 }: { s?: number }) => <PhMapPin size={s} weight="bold" />
export const IcClock = ({ s = 18 }: { s?: number }) => <PhClock size={s} weight="bold" />
export const IcTag = ({ s = 18 }: { s?: number }) => <PhTag size={s} weight="bold" />
export const IcCash = ({ s = 18 }: { s?: number }) => <PhMoney size={s} weight="bold" />
export const IcSearch = ({ s = 17 }: { s?: number }) => <PhSearch size={s} weight="bold" />
export const IcX = ({ s = 14 }: { s?: number }) => <PhX size={s} weight="bold" />
export const IcChevL = ({ s = 18 }: { s?: number }) => <PhCaretL size={s} weight="bold" />
export const IcChevR = ({ s = 18 }: { s?: number }) => <PhCaretR size={s} weight="bold" />
export const IcPlus = ({ s = 16 }: { s?: number }) => <PhPlus size={s} weight="bold" />
export const IcScale = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16M5 8l7-4 7 4" /><path d="M4 20h16" /><path d="M5 8 2.5 13a3 3 0 0 0 5 0L5 8ZM19 8l-2.5 5a3 3 0 0 0 5 0L19 8Z" /></svg>
)
export const IcSauce = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v4c1.8 1.2 3 3.2 3 5.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7.5C6 10.2 7.2 8.2 9 7V3Z" /><path d="M6 13h12" /></svg>
)
export const IcPlate = ({ s = 34 }: { s?: number }) => <PhFork size={s} weight="regular" />
export const IcSort = ({ s = 18 }: { s?: number }) => <PhSort size={s} weight="bold" />
export const IcSun = ({ s = 14 }: { s?: number }) => <PhSun size={s} weight="bold" />
export const IcMoon = ({ s = 14 }: { s?: number }) => <PhMoon size={s} weight="fill" />
export const IcTruck = ({ s = 15 }: { s?: number }) => <PhTruck size={s} weight="bold" />
export const IcStore = ({ s = 15 }: { s?: number }) => <PhStore size={s} weight="bold" />
export const IcArrowUp = ({ s = 20 }: { s?: number }) => <PhArrowUp size={s} weight="bold" />
export const IcLocate = ({ s = 16 }: { s?: number }) => <PhCross size={s} weight="bold" />

'''
s = s[:i1] + NEW_ICONS + s[i2:]

# 3) eski IcSort dublikatini o'chirish (SearchChips yuqorisida)
s = re.sub(r'export const IcSort = \(\) => <svg.*?</svg>\n*', '', s, count=1, flags=re.S)

# 4) bayroqlar: emoji -> SVG
old_flags = "const FLAGS: Record<string, string> = { uz: '🇺🇿', ru: '🇷🇺', en: '🇬🇧' }"
if old_flags not in s:
    print('FAIL: FLAGS line')
else:
    NEW_FLAGS = '''const FlagUZ = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#F4F4F4" />
    <rect width="30" height="6.7" fill="#0099B5" /><rect y="13.3" width="30" height="6.7" fill="#1EB53A" />
    <rect y="6.4" width="30" height="0.6" fill="#CE1126" /><rect y="13" width="30" height="0.6" fill="#CE1126" />
    <circle cx="5" cy="3.3" r="2.1" fill="#fff" /><circle cx="5.9" cy="2.8" r="1.85" fill="#0099B5" />
    <circle cx="9.4" cy="1.7" r="0.55" fill="#fff" /><circle cx="10.6" cy="2.7" r="0.55" fill="#fff" /><circle cx="10.2" cy="4.3" r="0.55" fill="#fff" /><circle cx="8.8" cy="4.7" r="0.55" fill="#fff" /><circle cx="8.2" cy="3.2" r="0.55" fill="#fff" />
  </svg>
)
const FlagRU = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#fff" /><rect y="6.7" width="30" height="6.6" fill="#0039A6" /><rect y="13.3" width="30" height="6.7" fill="#D52B1E" />
  </svg>
)
const FlagEN = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#012169" />
    <path d="M0,0 30,20M30,0 0,20" stroke="#fff" strokeWidth="4" />
    <path d="M0,0 30,20M30,0 0,20" stroke="#C8102E" strokeWidth="1.6" />
    <rect x="12.2" width="5.6" height="20" fill="#fff" /><rect y="7.2" width="30" height="5.6" fill="#fff" />
    <rect x="13.4" width="3.2" height="20" fill="#C8102E" /><rect y="8.4" width="30" height="3.2" fill="#C8102E" />
  </svg>
)
const FLAGS: Record<string, (p: { s?: number }) => React.ReactElement> = { uz: FlagUZ, ru: FlagRU, en: FlagEN }
const FlagOf = ({ l, s = 15 }: { l: string; s?: number }) => { const F = FLAGS[l] || FlagUZ; return <F s={s} /> }'''
    s = s.replace(old_flags, NEW_FLAGS, 1)

rep('<span className="text-[15px] leading-none">{FLAGS[lang]}</span>{lang.toUpperCase()}', '<FlagOf l={lang} s={15} />{lang.toUpperCase()}')
rep('<span className="text-[22px]">{FLAGS[l]}</span>', '<FlagOf l={l} s={22} />')
rep('<span className="text-[15px] leading-none">{FLAGS[l]}</span>{l.toUpperCase()}', '<FlagOf l={l} s={15} />{l.toUpperCase()}')

open(f, 'w', encoding='utf-8').write(s)
print('part1 ok')
