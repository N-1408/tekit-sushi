// TaxiMaster TM_API adapter (Millennium Taxi). Docs: help.taximaster.ru/index.php/TM_API
//
// TM_API runs on the taxi company's own server (https://ip:port) with
// signature-based auth: every request carries a Signature header computed from
// the sorted request params concatenated with the API key (MD5). Millennium
// must enable TM API and hand over host/port + key; nothing here is guessed
// before that.
import crypto from 'node:crypto';
import type { TaxiProvider } from './types.js';
import type { Order, IntegrationResult, Branch } from '../../../shared/types.js';
import { env } from '../env.js';

export class TaxiMasterProvider implements TaxiProvider {
  readonly name = 'taximaster';
  isConfigured() { return env.taximaster.enabled && !!env.taximaster.apiUrl && !!env.taximaster.apiKey; }

  // Signature = MD5(sorted "key=value&" params + API key) per TM_API docs.
  private sign(params: Record<string, string>): string {
    const base = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
    return crypto.createHash('md5').update(base + env.taximaster.apiKey).digest('hex');
  }

  private async call(endpoint: string, params: Record<string, string>): Promise<IntegrationResult<Record<string, unknown>>> {
    try {
      const body = new URLSearchParams(params);
      const res = await fetch(`${env.taximaster.apiUrl}/common_api/1.0/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Signature: this.sign(params),
        },
        body,
      });
      if (!res.ok) return { ok: false, error: `taximaster ${endpoint} failed: HTTP ${res.status}` };
      const data = (await res.json()) as { code: number; descr: string; data?: Record<string, unknown> };
      if (data.code !== 0) return { ok: false, error: `taximaster ${endpoint}: ${data.code} ${data.descr}` };
      return { ok: true, data: data.data || {} };
    } catch (e) {
      return { ok: false, error: `taximaster ${endpoint} error: ${String(e)}` };
    }
  }

  async dispatch(order: Order, branch: Branch): Promise<IntegrationResult<{ taxiOrderId: string }>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'taximaster not configured' };
    if (!order.lat || !order.lon) return { ok: false, error: 'taximaster dispatch needs customer coordinates' };
    // TODO(onboarding): confirm with Millennium which crew group serves
    // sushi-delivery runs and the exact address/comment field format.
    const params: Record<string, string> = {
      phone: order.phone,
      comment: `Tekit Sushi delivery ${order.clientRef}`,
      source_time: new Date().toISOString().slice(11, 19),
      // From = branch kitchen, To = customer. TM_API address fields are
      // confirmed during onboarding; coordinates are the stable path.
      addresses_from: JSON.stringify([{ lat: branch.lat, lon: branch.lon, address: branch.address }]),
      addresses_to: JSON.stringify([{ lat: order.lat, lon: order.lon, address: order.address || '' }]),
    };
    if (env.taximaster.crewGroupId) params.order_crew_group_id = env.taximaster.crewGroupId;
    const res = await this.call('create_order', params);
    if (!res.ok) return { ok: false, error: res.error, disabled: res.disabled };
    const orderId = res.data?.order_id != null ? String(res.data.order_id) : '';
    if (!orderId) return { ok: false, error: 'taximaster create_order returned no order_id' };
    return { ok: true, data: { taxiOrderId: orderId } };
  }

  async status(taxiOrderId: string): Promise<IntegrationResult<unknown>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'taximaster not configured' };
    return this.call('get_orders_state', { order_ids: taxiOrderId });
  }
}
