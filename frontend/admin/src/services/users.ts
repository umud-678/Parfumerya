import { apiFetch } from './api';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roles: string[];
  isBlocked: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/users');
}

export async function blockUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${id}/block`, { method: 'PATCH' });
}

export async function unblockUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${id}/unblock`, { method: 'PATCH' });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export { formatUserRole } from '../utils/azLabels';
