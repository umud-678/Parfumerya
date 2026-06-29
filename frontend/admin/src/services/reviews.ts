import { apiFetch } from './api';

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getReviews(): Promise<AdminReview[]> {
  return apiFetch<AdminReview[]>('/reviews');
}

export async function deleteReview(id: string): Promise<void> {
  await apiFetch<null>(`/reviews/${id}`, { method: 'DELETE' });
}
