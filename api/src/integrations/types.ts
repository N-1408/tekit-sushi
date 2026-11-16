// Interfaces every vendor adapter implements. Callers depend on these, never
// on a vendor's SDK or error shape, so swapping/adding a vendor touches one
// file only.
import type { IntegrationResult, Order, Branch } from '../../../shared/types.js';

export interface PaymentQuote {
  payUrl: string; // hosted checkout / deeplink the user is sent to
  externalId: string; // vendor transaction id to reconcile later
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  // Start a payment for an order; returns the URL the user confirms at.
  createPayment(order: Order): Promise<IntegrationResult<PaymentQuote>>;
  // Validate a vendor callback before granting any value.
  verifyCallback(payload: Record<string, unknown>, headers: Record<string, string>): IntegrationResult<{ externalId: string; amount: number; paid: boolean }>;
}

export interface MenuProvider {
  readonly name: string;
  isConfigured(): boolean;
  // Pull the vendor menu; the sync layer maps it onto menu_categories/menu_items.
  fetchMenu(): Promise<IntegrationResult<unknown>>;
  // Push a confirmed order to the vendor POS.
  createDeliveryOrder(order: Order): Promise<IntegrationResult<{ externalId: string }>>;
}

export interface TaxiProvider {
  readonly name: string;
  isConfigured(): boolean;
  // Send a courier/taxi from the branch to the customer's address.
  dispatch(order: Order, branch: Branch): Promise<IntegrationResult<{ taxiOrderId: string }>>;
  status(taxiOrderId: string): Promise<IntegrationResult<unknown>>;
}

export interface SmsProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(phone: string, text: string): Promise<IntegrationResult<null>>;
  // Phone-confirmation flow: issue a code, then verify what the user typed.
  sendCode(phone: string): Promise<IntegrationResult<null>>;
  verifyCode(phone: string, code: string): IntegrationResult<null>;
}
