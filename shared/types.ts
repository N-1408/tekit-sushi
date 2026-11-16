// Shared types used by web/, api/, bot/ and admin/. Keep these aligned with the
// Neon `orders` table columns the Vercel functions already use.

export type Lang = 'uz' | 'ru' | 'en';

export type OrderStatus = 'new' | 'confirmed' | 'delivering' | 'done' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card';
export type FulfillmentType = 'delivery' | 'pickup';

export interface Localized {
  uz: string;
  ru: string;
  en: string;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number; // UZS
  qty: number;
}

export interface Order {
  id: number;
  clientRef: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  total: number;
  discount: number;
  promoCode?: string;
  deliveryFee: number;
  grandTotal: number;
  fulfillment: FulfillmentType;
  address?: string;
  lat?: number;
  lon?: number;
  branchId?: string;
  note?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  active: boolean;
}

// Every integration call returns one of these so callers never depend on a
// specific vendor's error shape.
export interface IntegrationResult<T = unknown> {
  ok: boolean;
  disabled?: boolean; // adapter not configured via env yet
  data?: T;
  error?: string;
}
