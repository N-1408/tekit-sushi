// Ported from web/api/_fulfillment.js (behavior-identical).
// Single server-side source for branches and settings. CONFIRMED FACTS
// (2026-11-14, from the owner): two branches, Nukus ko'cha and Sampi, both 24/7.
// Everything else operational stays unset until confirmed in the admin panel;
// the UI shows an honest "unconfigured" state instead of a guess.
import { pool } from '../db.js';

export const BRANCHES = [
  { id: 'nukus', name: { uz: 'Nukus ko\u2018cha filiali', ru: 'Филиал на Нукус коча' }, hours_24_7: true, address: null as string | null, lat: null as number | null, lon: null as number | null },
  { id: 'sampi', name: { uz: 'Sampi filiali', ru: 'Филиал Сампи' }, hours_24_7: true, address: null as string | null, lat: null as number | null, lon: null as number | null },
];

export const BRANCH_IDS = BRANCHES.map((b) => b.id);

export const SETTING_KEYS = ['pickup_prep_minutes', 'pickup_slot_minutes', 'pickup_days_ahead', 'delivery_eta_minutes'];

export async function readSettings(): Promise<Record<string, string>> {
  try {
    const r = await pool.query('SELECT key, value FROM settings');
    const m: Record<string, string> = {};
    for (const row of r.rows as { key: string; value: string }[]) m[row.key] = row.value;
    return m;
  } catch {
    return {};
  }
}

export function pickupCfgFrom(settings: Record<string, string>) {
  const prep = Number(settings.pickup_prep_minutes);
  const slot = Number(settings.pickup_slot_minutes);
  const days = Number(settings.pickup_days_ahead);
  const cfg: { prep_minutes?: number; slot_minutes?: number; days_ahead?: number } = {};
  if (Number.isFinite(prep) && prep > 0) cfg.prep_minutes = Math.round(prep);
  if (Number.isFinite(slot) && slot >= 5) cfg.slot_minutes = Math.round(slot);
  if (Number.isFinite(days) && days >= 1) cfg.days_ahead = Math.min(14, Math.round(days));
  return Object.keys(cfg).length ? cfg : null;
}

export function deliveryCfgFrom(settings: Record<string, string>) {
  const eta = Number(settings.delivery_eta_minutes);
  return {
    // Confirmed business fact (2026-11-10): delivery across Tashkent is FREE.
    fee: Math.max(0, Number(process.env.DELIVERY_FEE ?? 0)),
    threshold: Math.max(0, Number(process.env.DELIVERY_FREE_THRESHOLD || 200000)),
    eta_minutes: Number.isFinite(eta) && eta > 0 ? Math.round(eta) : null,
  };
}

// Tashkent wall-clock time (not the device clock): {ymd, hm, minutes}
export function tkNow() {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => (p.find((x) => x.type === t) || {}).value || '';
  const hm = `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}`;
  return {
    ymd: `${g('year')}-${g('month')}-${g('day')}`,
    hm,
    minutes: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5)),
  };
}
