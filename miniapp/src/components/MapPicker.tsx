import React from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { API_BASE } from '../lib/api'
import { haptic } from '../lib/tg'
import { IcChevL, IcLocate } from './ui'

type Pt = { lat: number; lon: number }

export default function MapPicker({ open, initial, onPick, onClose, t }: {
  open: boolean
  initial?: Pt | null
  onPick: (addr: string, lat: number | null, lon: number | null) => void
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
  const [manualOpen, setManualOpen] = React.useState(false)
  const [manualTxt, setManualTxt] = React.useState('')

  React.useEffect(() => {
    document.body.dataset.mapOpen = open ? '1' : ''
    return () => { document.body.dataset.mapOpen = '' }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    setManualOpen(false)
    setManualTxt('')
    if (initial) setPt(initial)
    const t0 = setTimeout(() => {
      if (!boxRef.current) return
      if (!mapRef.current) {
        const start = initial || pt
        const m = L.map(boxRef.current, { zoomControl: false, center: [start.lat, start.lon], zoom: 16 })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m)
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--brand-blue);border:3px solid #fff;box-shadow:0 6px 14px rgba(15,30,154,.45)"></div>',
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

  function applyManual() {
    const a = manualTxt.trim()
    if (a.length < 6) return
    haptic('medium')
    onPick(a, null, null)
    onClose()
  }

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
      const r = await fetch(`${API_BASE}/api/geocode?lat=${pt.lat}&lon=${pt.lon}`)
      const j = await r.json().catch(() => null)
      haptic('medium')
      onPick(j?.ok && j.addr ? j.addr : `${pt.lat.toFixed(5)}, ${pt.lon.toFixed(5)}`, pt.lat, pt.lon)
      onClose()
    } catch { setErr(true) }
    setBusy(false)
  }

  if (!open) return null
  const layer = (
    <div className="fixed inset-0 z-[90] bg-[var(--bg2)] flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-[calc(12px+var(--sat))] pb-3 border-b border-[var(--line)] bg-[var(--bg2)]">
        <button onClick={onClose} className="press w-9 h-9 rounded-full bg-[var(--panel)] text-[var(--ink)] grid place-items-center active:scale-90 transition-transform" aria-label="back">
          <IcChevL s={17} />
        </button>
        <div className="text-[15px] font-extrabold flex-1 text-[var(--ink)]">{t.mapTitle}</div>
      </div>
      <div className="flex-1 relative">
        <div ref={boxRef} className="absolute inset-0" />
        <button onClick={locateMe} aria-label="locate"
          className="absolute left-3 bottom-6 z-[500] w-11 h-11 rounded-xl bg-[var(--panel)] text-[var(--ink)] border border-[var(--line2)] shadow-[0_8px_20px_rgba(0,0,0,.22)] grid place-items-center active:scale-90 transition-transform">
          {locBusy ? <span className="w-4 h-4 border-2 border-[var(--line2)] border-t-[var(--ink)] rounded-full animate-spin" /> : (
            <IcLocate s={19} />
          )}
        </button>
      </div>
      <div className="px-4 pt-3 border-t border-[var(--line)] bg-[var(--bg2)]" style={{ paddingBottom: 'calc(14px + var(--sab))' }}>
        {manualOpen ? (
          <div className="space-y-2">
            <input
              value={manualTxt}
              onChange={(e) => setManualTxt(e.target.value)}
              placeholder={t.delWritePh}
              maxLength={200}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] focus:border-[var(--acc)]/60 outline-none text-[14.5px] font-semibold text-[var(--ink)] placeholder:text-[var(--mut2)] placeholder:font-medium"
            />
            <div className="flex gap-2">
              <button onClick={() => setManualOpen(false)} aria-label="back"
                className="press w-12 shrink-0 rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] grid place-items-center active:scale-[.98] transition-transform">
                <IcChevL s={17} />
              </button>
              <button onClick={applyManual} disabled={manualTxt.trim().length < 6}
                className="press flex-1 py-3 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[14.5px] font-extrabold disabled:opacity-40 active:scale-[.98] transition-transform">
                {t.delNext}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-bold text-[var(--mut2)] text-center">{err ? '—' : `${pt.lat.toFixed(5)}, ${pt.lon.toFixed(5)}`}</span>
              <span aria-hidden="true" className="text-[var(--mut2)] opacity-40">·</span>
              <button onClick={() => setManualOpen(true)} className="press text-[12.5px] font-extrabold text-[var(--acc)] active:opacity-70">
                {t.mapManualBtn}
              </button>
            </div>
            <button onClick={pick} disabled={busy}
              className="press mt-2.5 w-full py-3.5 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[15px] font-extrabold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[.98] transition-transform">
              {busy ? '…' : t.mapPick}
            </button>
          </>
        )}
      </div>
    </div>
  )
  return createPortal(layer, document.body)
}
