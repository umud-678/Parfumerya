import { apiFetch } from './api';
import type { CartItem } from '../types';

export interface CouponValidation {
  valid: boolean;
  message?: string;
  code?: string;
  discountType?: string;
  discountPercent?: number | null;
  applicableCategorySlug?: string | null;
  discountAmount?: number;
  applicableSubTotal?: number;
}

export interface OrderStatusHistoryEntry {
  status: string;
  previousStatus?: string | null;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion?: string;
  deliveryType?: 'express' | 'standard';
  createdAt: string;
  updatedAt?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  items: Array<{
    productId?: string;
    productSlug?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    categorySlug?: string;
  }>;
}

export interface CreateOrderInput {
  items: CartItem[];
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion?: string;
  deliveryType?: 'express' | 'standard';
  couponCode?: string;
  notes?: string;
}

function mapCartItemsForApi(items: CartItem[]) {
  return items.map((i) => ({
    productId: i.productId,
    productVariantId: i.variantId,
    productName: i.name,
    sku: i.variantId,
    volumeMl: i.volumeMl,
    quantity: i.quantity,
    unitPrice: i.price,
    categorySlug: i.categorySlug,
  }));
}

export async function validateCoupon(code: string, items: CartItem[]): Promise<CouponValidation> {
  const subTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return apiFetch<CouponValidation>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      code: code.trim().toUpperCase(),
      subTotal,
      items: mapCartItemsForApi(items),
    }),
  });
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiFetch<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      shippingFullName: input.shippingFullName,
      shippingPhone: input.shippingPhone,
      shippingAddress: input.shippingAddress,
      shippingCity: input.shippingCity,
      shippingRegion: input.shippingRegion,
      deliveryType: input.deliveryType ?? 'express',
      couponCode: input.couponCode,
      notes: input.notes,
      items: mapCartItemsForApi(input.items),
    }),
  });
}

export async function getMyOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/orders/my');
}
