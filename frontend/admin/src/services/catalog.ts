import { apiFetch, getAuthToken } from './api';
import { API_URL } from '../config/env';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  primaryImageUrl: string;
  price: number;
  stock: number;
  sku: string;
  volumeMl: number;
  isFeatured: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
  brandId: string;
  imageUrl: string;
  price: number;
  stock: number;
  sku: string;
  volumeMl: number;
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface CreateCategoryInput {
  name: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function mapApiProduct(p: Record<string, unknown>): AdminProduct {
  const variants = p.variants as Array<{
    sku?: string;
    volumeMl?: number;
    price?: number;
    stockQuantity?: number;
  }> | undefined;
  const v = variants?.[0];
  return {
    id: String(p.id),
    name: String(p.name ?? ''),
    slug: String(p.slug ?? ''),
    description: p.description as string | undefined,
    categoryId: String(p.categoryId ?? ''),
    categoryName: String(p.categoryName ?? ''),
    brandId: String(p.brandId ?? ''),
    brandName: String(p.brandName ?? ''),
    primaryImageUrl: String(p.primaryImageUrl ?? ''),
    price: Number(p.minPrice ?? p.price ?? v?.price ?? 0),
    stock: Number(p.stock ?? v?.stockQuantity ?? 0),
    sku: String(p.sku ?? v?.sku ?? ''),
    volumeMl: Number(p.volumeMl ?? v?.volumeMl ?? 50),
    isFeatured: Boolean(p.isFeatured),
    isNew: Boolean(p.isNew),
    createdAt: String(p.createdAt ?? new Date().toISOString()),
  };
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories?tree=false');
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const name = input.name.trim();
  const slug = slugify(name);
  const id = await apiFetch<string>('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name,
      slug,
      description: null,
      imageUrl: null,
      parentId: null,
      sortOrder: 0,
    }),
  });
  return { id, name, slug };
}

export async function getBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>('/brands');
}

export async function createBrand(name: string): Promise<Brand> {
  return apiFetch<Brand>('/brands', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await apiFetch<null>(`/brands/${id}`, { method: 'DELETE' });
}

export async function getProducts(): Promise<AdminProduct[]> {
  const result = await apiFetch<{ items: Record<string, unknown>[] }>('/products');
  return (result.items ?? []).map(mapApiProduct);
}

export async function addProductStock(productId: string, quantity: number): Promise<number> {
  const result = await apiFetch<{ stock: number }>(`/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ add: quantity }),
  });
  return result.stock;
}

export async function subtractProductStock(productId: string, quantity: number): Promise<number> {
  const result = await apiFetch<{ stock: number }>(`/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ subtract: quantity }),
  });
  return result.stock;
}

export async function setProductStock(productId: string, quantity: number): Promise<number> {
  const result = await apiFetch<{ stock: number }>(`/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ set: quantity }),
  });
  return result.stock;
}

export async function createProduct(input: CreateProductInput): Promise<AdminProduct> {
  const categories = await getCategories();
  const brands = await getBrands();
  const category = categories.find((c) => c.id === input.categoryId);
  const brand = brands.find((b) => b.id === input.brandId);

  if (!category) throw new Error('Kateqoriya seçilməyib');
  if (!brand) throw new Error('Brend seçilməyib');

  const product: AdminProduct = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    slug: slugify(input.name),
    description: input.description?.trim(),
    categoryId: category.id,
    categoryName: category.name,
    brandId: brand.id,
    brandName: brand.name,
    primaryImageUrl: input.imageUrl,
    price: input.price,
    stock: input.stock,
    sku: input.sku.trim(),
    volumeMl: input.volumeMl,
    isFeatured: input.isFeatured ?? false,
    isNew: input.isNew ?? true,
    createdAt: new Date().toISOString(),
  };

  await apiFetch<string>('/products', {
    method: 'POST',
    body: JSON.stringify({
      ...product,
      minPrice: product.price,
      variants: [{
        id: `${product.id}-v`,
        sku: product.sku,
        volumeMl: product.volumeMl,
        price: product.price,
        stockQuantity: product.stock,
      }],
    }),
  });
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: 'DELETE' });
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/files/upload?folder=products`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'Yükləmə uğursuz oldu');
  }
  return payload.data as string;
}
