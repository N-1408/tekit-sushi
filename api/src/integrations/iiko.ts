// iiko Cloud API adapter. Docs: api.iiko.help
// Requires an iikoDelivery API license on the restaurant side.
import type { MenuProvider } from './types.js';
import type { Order, IntegrationResult } from '../../../shared/types.js';
import { env } from '../env.js';

export class IikoProvider implements MenuProvider {
  readonly name = 'iiko';
  private token: { value: string; expiresAt: number } | null = null;
  isConfigured() { return env.iiko.enabled && !!env.iiko.apiLogin && !!env.iiko.organizationId; }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value;
    const res = await fetch(`${env.iiko.baseUrl}/api/1/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiLogin: env.iiko.apiLogin }),
    });
    if (!res.ok) throw new Error(`iiko auth failed: HTTP ${res.status}`);
    const data = (await res.json()) as { correlationId?: string; token: string };
    this.token = { value: data.token, expiresAt: Date.now() + 55 * 60 * 1000 };
    return data.token;
  }

  async fetchMenu(): Promise<IntegrationResult<unknown>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'iiko not configured' };
    try {
      const token = await this.getToken();
      const res = await fetch(`${env.iiko.baseUrl}/api/1/nomenclature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: env.iiko.organizationId }),
      });
      if (!res.ok) return { ok: false, error: `iiko menu failed: HTTP ${res.status}` };
      return { ok: true, data: await res.json() };
    } catch (e) {
      return { ok: false, error: `iiko menu error: ${String(e)}` };
    }
  }

  async createDeliveryOrder(order: Order): Promise<IntegrationResult<{ externalId: string }>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'iiko not configured' };
    try {
      const token = await this.getToken();
      const res = await fetch(`${env.iiko.baseUrl}/api/1/deliveries/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          organizationId: env.iiko.organizationId,
          terminalGroupId: env.iiko.terminalGroupId || undefined,
          // TODO(iiko mapping): map order.items -> items[].productId via the
          // nomenclature sync table once the branch's iiko ids are known.
          order: {
            phone: order.phone,
            comment: order.note || undefined,
            items: order.items.map((i) => ({ productId: i.id, amount: i.qty })),
          },
        }),
      });
      if (!res.ok) return { ok: false, error: `iiko order failed: HTTP ${res.status}` };
      const data = (await res.json()) as { orderInfo?: { id?: string } };
      return { ok: true, data: { externalId: data.orderInfo?.id || '' } };
    } catch (e) {
      return { ok: false, error: `iiko order error: ${String(e)}` };
    }
  }
}
