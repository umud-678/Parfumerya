import { apiFetch } from './api';
import type { Category, HeroSlide, Product, ProductQuery } from '../types';

function mapProduct(p: Record<string, unknown>): Product {
  const price = Number(p.minPrice ?? p.price ?? 0);
  return {
    id: String(p.id),
    name: String(p.name),
    slug: String(p.slug),
    description: p.description as string | undefined,
    brandName: String(p.brandName ?? ''),
    categoryId: String(p.categoryId ?? ''),
    categorySlug: String(p.categorySlug ?? ''),
    categoryName: String(p.categoryName ?? ''),
    primaryImageUrl: String(p.primaryImageUrl ?? ''),
    secondaryImageUrl: p.secondaryImageUrl as string | undefined,
    minPrice: price,
    averageRating: Number(p.averageRating ?? 0) || undefined,
    isFeatured: Boolean(p.isFeatured),
    isNew: Boolean(p.isNew),
    variants: (p.variants as Product['variants']) ?? [{
      id: `${p.id}-v`,
      sku: String(p.sku ?? ''),
      volumeMl: Number(p.volumeMl ?? 50),
      price,
      stockQuantity: Number(p.stock ?? 0),
    }],
  };
}

function buildQuery(params?: ProductQuery): string {
  if (!params) return '';
  const q = new URLSearchParams();
  if (params.categorySlug) q.set('categorySlug', params.categorySlug);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.featured) q.set('featured', 'true');
  if (params.trending) q.set('trending', 'true');
  if (params.search) q.set('search', params.search);
  if (params.sort) q.set('sort', params.sort);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/categories');
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await apiFetch<Category>(`/categories/${slug}`);
  } catch {
    return null;
  }
}

export async function getProducts(params?: ProductQuery): Promise<{ items: Product[]; totalCount: number }> {
  const result = await apiFetch<{ items: Record<string, unknown>[]; totalCount: number }>(
    `/products${buildQuery(params)}`
  );
  return {
    items: (result.items ?? []).map(mapProduct),
    totalCount: result.totalCount ?? 0,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const p = await apiFetch<Record<string, unknown>>(`/products/${slug}`);
    return mapProduct(p);
  } catch {
    return undefined;
  }
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  return apiFetch<HeroSlide[]>('/hero');
}

export async function getActiveHero(): Promise<HeroSlide | null> {
  return apiFetch<HeroSlide | null>('/hero/active');
}
