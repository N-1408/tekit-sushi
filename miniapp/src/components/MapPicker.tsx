import React from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { haptic } from '../lib/tg'

type Pt = { lat: number; lon: number }

export default function MapPicker({ open, initial, onPick, onClose, t }: {
  open: boolean
  initial?: Pt | null
  onPick: (addr: string, lat: number, lon: number) => void
  onClose: () => void
  t: any
}) {
  const boxRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const mkRef = React.useRef<L.Marker | null>(null)
  const [pt, setPt] = React.useState<Pt>(initial || { lat: 41.3111, lon: 69.2797 })
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState(false)
  const [locBusy, setLocBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (initial) setPt(initial)
    const t0 = setTimeout(() => {
      if (!boxRef.current) return
      if (!mapRef.current) {
        const start = initial || pt
        const m = L.map(boxRef.current, { zoomControl: false, center: [start.lat, start.lon], zoom: 16 })
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(m)
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0A2194;border:3px solid #fff;box-shadow:0 6px 14px rgba(10,33,148,.45)"></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        })
        const mk = L.marker([start.lat, start.lon], { draggable: true, icon }).addTo(m)
        mk.on('drag', () => { const p = mk.getLatLng(); setPt({ lat: p.lat, lon: p.lng }) })
        m.on('click', (e: L.LeafletMouseEvent) => { mk.setLatLng(e.latlng); setPt({ lat: e.latlng.lat, lon: e.latlng.lng }); haptic('light') })
        L.control.zoom({ position: 'bottomright' }).addTo(m)
        mapRef.current = m
        mkRef.current = mk
      } else {
        mapRef.current.setView([pt.lat, pt.lon], mapRef.current.getZoom() || 16)
        mkRef.current?.setLatLng([pt.lat, pt.lon])
      }
      mapRef.current?.invalidateSize()
    }, 60)
    return () => clearTimeout(t0)
  }, [open])

  function locateMe() {
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

  async function pick() {
    if (busy) return
    setBusy(true)
    try {
      const r = await fetch(`/api/geocode?lat=${pt.lat}&lon=${pt.lon}`)
      const j = await r.json().catch(() => null)
      haptic('medium')
      onPick(j?.ok && j.addr ? j.addr : `${pt.lat.toFixed(5)}, ${pt.lon.toFixed(5)}`, pt.lat, pt.lon)
      onClose()
    } catch { setErr(true) }
    setBusy(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-[calc(12px+var(--sat))] pb-3 border-b border-navy-line bg-white">
        <button onClick={onClose} className="press w-9 h-9 rounded-full bg-navy-soft grid place-items-center active:scale-90 transition-transform" aria-label="back">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0A2194" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="text-[15px] font-extrabold flex-1">{t.mapTitle}</div>
      </div>
      <div className="flex-1 relative">
        <div ref={boxRef} className="absolute inset-0" />
        <button onClick={locateMe} aria-label="locate"
          className="absolute left-3 bottom-6 z-[500] w-11 h-11 rounded-xl bg-white text-[#0A2194] shadow-[0_8px_20px_rgba(0,0,0,.22)] grid place-items-center active:scale-90 transition-transform">
          {locBusy ? <span className="w-4 h-4 border-2 border-[#0A2194]/30 border-t-[#0A2194] rounded-full animate-spin" /> : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
          )}
        </button>
      </div>
      <div className="px-4 pt-3 border-t border-navy-line bg-white" style={{ paddingBottom: 'calc(14px + var(--sab))' }}>
        <div className="text-[11.5px] font-bold text-[#7A8494] text-center">{err ? '—' : `${pt.lat.toFixed(5)}, ${pt.lon.toFixed(5)}`}</div>
        <button onClick={pick} disabled={busy}
          className="press mt-2.5 w-full py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[.98] transition-transform">
          {busy ? '…' : t.mapPick}
        </button>
      </div>
    </div>
  )
}
