// Rahmat PAY adapter (partner-app model). Docs: app.docs.rhmt.uz
//
// How the rail works per the docs: Rahmat forms the payment (QR / payment page
// / deeplink) and routes the user back to the partner app; the partner backend
// receives the operation result (amount, rahmat_trans_id, partner_trans_id,
// pan, ...) and later forwards the fiscal link. Integration is only complete
// after the mandatory test cases in the test contour with the Rahmat team.
//
// The exact request field names below are confirmed during onboarding; the
// shape (create -> callback -> verify -> mark paid) is stable and matches the
// docs, so the order flow never depends on them.
import type { PaymentProvider, PaymentQuote } from './types.js';
import type { Order, IntegrationResult } from '../../../shared/types.js';
import { env } from '../env.js';

export class RahmatProvider implements PaymentProvider {
  readonly name = 'rahmat';
  isConfigured() { return env.rahmat.enabled && !!env.rahmat.appName; }

  async createPayment(order: Order): Promise<IntegrationResult<PaymentQuote>> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'rahmat not configured' };
    try {
      const res = await fetch(`${env.rahmat.meshBaseUrl}/payment/external/${env.rahmat.appName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_trans_id: order.clientRef,
          amount: order.grandTotal,
          phone: order.phone,
          // TODO(onboarding): confirm required fields with the Rahmat team
        }),
      });
      if (!res.ok) return { ok: false, error: `rahmat create failed: HTTP ${res.status}` };
      const data = (await res.json()) as Record<string, unknown>;
      // TODO(onboarding): map the real response field for the hosted checkout URL
      const payUrl = (data.pay_url as string) || `${env.rahmat.checkoutUrl}`;
      return { ok: true, data: { payUrl, externalId: String(data.rahmat_trans_id ?? order.clientRef) } };
    } catch (e) {
      return { ok: false, error: `rahmat create error: ${String(e)}` };
    }
  }

  verifyCallback(payload: Record<string, unknown>, headers: Record<string, string>): IntegrationResult<{ externalId: string; amount: number; paid: boolean }> {
    if (!this.isConfigured()) return { ok: false, disabled: true, error: 'rahmat not configured' };
    // TODO(onboarding): replace with the signature scheme Rahmat specifies.
    if (env.rahmat.callbackSecret) {
      const sig = headers['x-signature'] || '';
      if (sig !== env.rahmat.callbackSecret) return { ok: false, error: 'rahmat callback: bad signature' };
    }
    const externalId = payload.rahmat_trans_id as string | undefined;
    const amount = Number(payload.amount);
    if (!externalId || !Number.isFinite(amount)) return { ok: false, error: 'rahmat callback: missing fields' };
    return { ok: true, data: { externalId, amount, paid: true } };
  }
}
