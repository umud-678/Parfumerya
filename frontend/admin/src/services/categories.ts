import { apiFetch } from './api';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

export async function getCategories(): Promise<AdminCategory[]> {
  return apiFetch<AdminCategory[]>('/categories');
}

export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  return apiFetch<AdminCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<AdminCategory> {
  return apiFetch<AdminCategory>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<null>(`/categories/${id}`, { method: 'DELETE' });
}
