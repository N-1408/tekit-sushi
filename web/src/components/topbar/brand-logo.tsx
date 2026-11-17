import { useEffect, useState } from 'react'
import { currentTheme, subscribeTheme } from '../../lib/theme'

/* ---------- brend logotipi: yangi kit logotipi, temaga mos (yorug' — to'q kit,
   tungi — oq kit) 300ms crossfade bilan almashadi; mount'da kichik pop. ---------- */
export function BrandLogo({ size = 36, className = '' }: { size?: number; className?: string }) {
  const [dark, setDark] = useState(() => currentTheme() === 'dark')
  useEffect(() => subscribeTheme(th => setDark(th === 'dark')), [])
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src="/logo.png" alt="" width={size} height={size}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${dark ? 'opacity-0' : 'opacity-100'}`} />
      <img src="/logo-light.png" alt="" width={size} height={size}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${dark ? 'opacity-100' : 'opacity-0'}`} />
    </span>
  )
}
