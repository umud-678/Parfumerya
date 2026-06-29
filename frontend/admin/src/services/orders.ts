import { apiFetch } from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userEmail?: string;
  status: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number; totalPrice: number }>;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountPercent?: number;
  value: number;
  applicableCategorySlug?: string;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/notifications');
}

export async function getUnreadCount(): Promise<number> {
  const result = await apiFetch<{ count: number }>('/notifications/unread-count');
  return result.count;
}

export async function markAsRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'PATCH' });
}

export async function getOrders(): Promise<Order[]> {
  return apiFetch<Order[]>('/orders');
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>('/coupons');
}

export async function createCoupon(input: {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  discountPercent?: number;
  applicableCategorySlug?: string;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  minOrderAmount?: number;
}): Promise<Coupon> {
  return apiFetch<Coupon>('/coupons', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiFetch<null>(`/coupons/${id}`, { method: 'DELETE' });
}

export async function getDashboardStats() {
  return apiFetch<{
    totalSales: number;
    dailyRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    unreadNotifications: number;
  }>('/dashboard/stats');
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'İndi';
  if (mins < 60) return `${mins} dəq əvvəl`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  return `${Math.floor(hours / 24)} gün əvvəl`;
}

export { timeAgo };
