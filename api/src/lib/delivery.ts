// Ported from web/api/_delivery.js (behavior-identical), plus the TaxiMaster
// adapter hook: when TAXIMASTER_ENABLED is true, dispatch goes through
// integrations/taximaster.ts instead of the legacy REST guess.
import type { FastifyRequest } from 'fastify';
import { taximaster } from '../integrations/index.js';

export const GEO_HEADERS: Record<string, string> = {
  'User-Agent': 'TekitSushiMiniApp/1.0 (contact: gigand.group@gmail.com)',
  'Accept-Language': 'uz,ru,en',
};

export const TASHKENT_RE = /^(tosh|tash)kent/i;

export async function cityOf(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14`,
      { headers: GEO_HEADERS, signal: AbortSignal.timeout(6000) },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { address?: Record<string, string> };
    const a = j?.address || {};
    return a.city || a.town || a.municipality || a.county || a.state || null;
  } catch {
    return null;
  }
}

interface DeliveryOrder {
  id: number | string;
  address?: string | null;
  phone?: string | null;
  name?: string | null;
  note?: string | null;
  status_note?: string | null;
  total: number;
  lat?: number | null;
  lon?: number | null;
  branch?: { id: string; address: string; lat: number; lon: number } | null;
}

interface LegacyDeliveryResult { provider: string; status: string; external_id?: string | null; raw?: unknown; }

async function postProvider(base: string, token: string, payload: Record<string, unknown>) {
  const r = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: r.ok, body: j };
}

export async function createDelivery(order: DeliveryOrder): Promise<LegacyDeliveryResult> {
  // New path: TaxiMaster (Millennium) via the adapter when configured.
  if (taximaster.isConfigured() && order.branch && order.lat != null && order.lon != null) {
    const branch = { id: order.branch.id, name: order.branch.id, address: order.branch.address, lat: order.branch.lat, lon: order.branch.lon, active: true };
    const res = await taximaster.dispatch(
      { id: Number(order.id), clientRef: String(order.id), customerName: order.name || '', phone: order.phone || '', items: [], total: order.total, discount: 0, deliveryFee: 0, grandTotal: order.total, fulfillment: 'delivery', address: order.address || undefined, lat: order.lat, lon: order.lon, status: 'confirmed', paymentMethod: 'cash', paymentStatus: 'pending' } as never,
      branch,
    );
    if (res.ok && res.data) return { provider: 'taximaster', status: 'dispatched', external_id: (res.data as { taxiOrderId: string }).taxiOrderId };
    console.error('taximaster dispatch failed', res.error);
    // fall through to legacy/own so an order is never lost
  }
  const provider = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
  if (provider === 'own' || !provider) {
    // own courier: admin panel moves the status by hand
    return { provider: 'own', status: 'manual' };
  }
  const APP_ORIGIN = process.env.APP_ORIGIN || '';
  const payload = {
    external_id: String(order.id),
    address: order.address || '',
    phone: order.phone || '',
    name: order.name || '',
    note: order.note || '',
    comment: order.status_note || '',
    amount: order.total,
    callback_url: `${APP_ORIGIN}/api/webhook/delivery`,
  };
  try {
    if (provider === 'millennium') {
      if (!process.env.MILLENNIUM_API_URL || !process.env.MILLENNIUM_TOKEN) return { provider, status: 'unconfigured' };
      const r = await postProvider(process.env.MILLENNIUM_API_URL, process.env.MILLENNIUM_TOKEN, payload);
      return { provider, status: r.ok ? 'dispatched' : 'error', external_id: (r.body.id as string) || null, raw: r.body };
    }
    if (provider === 'noor') {
      if (!process.env.NOOR_API_URL || !process.env.NOOR_TOKEN) return { provider, status: 'unconfigured' };
      const r = await postProvider(process.env.NOOR_API_URL, process.env.NOOR_TOKEN, payload);
      return { provider, status: r.ok ? 'dispatched' : 'error', external_id: (r.body.id as string) || null, raw: r.body };
    }
  } catch (e) {
    console.error(`delivery ${provider}`, (e as Error)?.message);
    return { provider, status: 'error' };
  }
  return { provider: 'own', status: 'manual' };
}

export function checkDeliveryWebhookSecret(secret: string): boolean {
  const expected = process.env.DELIVERY_WEBHOOK_SECRET;
  return !!expected && secret === expected;
}

// Delivery price: Millennium/Noor API quote once a contract + env exist.
// Until then: DELIVERY_FEE (default 15000).
export async function quoteDelivery(payload: { address?: string; subtotal?: number; lat?: number; lon?: number }): Promise<{ provider: string; price: number; source: string }> {
  const provider = (process.env.DELIVERY_PROVIDER || 'own').trim().toLowerCase();
  const url = provider === 'millennium' ? process.env.MILLENNIUM_API_URL : provider === 'noor' ? process.env.NOOR_API_URL : null;
  if (url) {
    try {
      const token = provider === 'millennium' ? process.env.MILLENNIUM_TOKEN : process.env.NOOR_TOKEN;
      const r = await fetch(String(url).replace(/\/$/, '') + '/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        const price = Number(j.price ?? j.fee ?? j.amount ?? j.cost);
        if (price > 0) return { provider, price, source: 'api' };
      }
    } catch (e) { console.error('delivery quote', (e as Error)?.message); }
  }
  return { provider, price: Number(process.env.DELIVERY_FEE || 15000), source: 'default' };
}

export function clientIp(req: FastifyRequest): string {
  return String((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'x').split(',')[0].trim();
}
