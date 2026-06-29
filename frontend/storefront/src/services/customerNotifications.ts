import { apiFetch } from './api';

export interface CustomerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  status?: string;
  previousStatus?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getMyNotifications(): Promise<CustomerNotification[]> {
  return apiFetch<CustomerNotification[]>('/my-notifications');
}

export async function getUnreadNotificationCount(): Promise<number> {
  const result = await apiFetch<{ count: number }>('/my-notifications/unread-count');
  return result.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/my-notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/my-notifications/read-all', { method: 'PATCH' });
}
