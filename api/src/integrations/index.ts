// Integration registry. The health endpoint and admin views read status()
// from here; order/menu flows call the interfaces, never a vendor directly.
import { RahmatProvider } from './rahmat.js';
import { IikoProvider } from './iiko.js';
import { TaxiMasterProvider } from './taximaster.js';
import { EskizProvider } from './eskiz.js';
import type { PaymentProvider, MenuProvider, TaxiProvider, SmsProvider } from './types.js';

export const rahmat: PaymentProvider = new RahmatProvider();
export const iiko: MenuProvider = new IikoProvider();
export const taximaster: TaxiProvider = new TaxiMasterProvider();
export const eskiz: SmsProvider = new EskizProvider();

export function integrationStatus() {
  const all = [rahmat, iiko, taximaster, eskiz];
  return all.map((p) => ({ name: p.name, configured: p.isConfigured() }));
}
