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

const PRODUCTS_KEY = 'parfumerya_admin_products';
const CATEGORIES_KEY = 'parfumerya_admin_categories';
const BRANDS_KEY = 'parfumerya_admin_brands';

const defaultCategories: Category[] = [
  { id: 'cat-women', name: 'Qadın ətirləri', slug: 'qadin-etirleri' },
  { id: 'cat-men', name: 'Kişi ətirləri', slug: 'kisi-etirleri' },
  { id: 'cat-cosmetic', name: 'Kosmetika', slug: 'kosmetika' },
];

const defaultBrands: Brand[] = [
  { id: 'brand-dior', name: 'Dior', slug: 'dior' },
  { id: 'brand-chanel', name: 'Chanel', slug: 'chanel' },
  { id: 'brand-tomford', name: 'Tom Ford', slug: 'tom-ford' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('parfumerya-catalog-updated'));
}

function toStorefrontProduct(p: AdminProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brandName: p.brandName,
    categoryName: p.categoryName,
    primaryImageUrl: p.primaryImageUrl,
    minPrice: p.price,
    averageRating: 5,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    variants: [
      {
        id: `${p.id}-v`,
        sku: p.sku,
        volumeMl: p.volumeMl,
        price: p.price,
        stockQuantity: p.stock,
      },
    ],
  };
}

function syncStorefront(products: AdminProduct[]) {
  save('parfumerya_storefront_products', products.map(toStorefrontProduct));
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await import('./api').then((m) =>
      m.isApiAvailable()
        ? m.apiFetch<Category[]>('/categories?tree=false')
        : Promise.reject(new Error('local'))
    );
    return data;
  } catch {
    const local = load(CATEGORIES_KEY, defaultCategories);
    if (local.length === 0) {
      save(CATEGORIES_KEY, defaultCategories);
      return defaultCategories;
    }
    return local;
  }
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const category: Category = {
    id: `cat-${crypto.randomUUID()}`,
    name: input.name.trim(),
    slug: slugify(input.name),
  };

  try {
    const { apiFetch, isApiAvailable } = await import('./api');
    if (isApiAvailable()) {
      const id = await apiFetch<string>('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: category.name,
          slug: category.slug,
          description: null,
          imageUrl: null,
          parentId: null,
          sortOrder: 0,
        }),
      });
      return { ...category, id };
    }
  } catch {
    // fallback below
  }

  const categories = load(CATEGORIES_KEY, defaultCategories);
  categories.push(category);
  save(CATEGORIES_KEY, categories);
  return category;
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const { apiFetch, isApiAvailable } = await import('./api');
    if (isApiAvailable()) {
      return apiFetch<Brand[]>('/brands');
    }
    throw new Error('local');
  } catch {
    const local = load(BRANDS_KEY, defaultBrands);
    if (local.length === 0) {
      save(BRANDS_KEY, defaultBrands);
      return defaultBrands;
    }
    return local;
  }
}

export async function getProducts(): Promise<AdminProduct[]> {
  try {
    const { apiFetch } = await import('./api');
    const result = await apiFetch<{ items: AdminProduct[] }>('/products');
    return result.items ?? [];
  } catch {
    return load<AdminProduct[]>(PRODUCTS_KEY, []);
  }
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

  try {
    const { apiFetch } = await import('./api');
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
  } catch {
    // fallback below
  }

  const products = load<AdminProduct[]>(PRODUCTS_KEY, []);
  products.unshift(product);
  save(PRODUCTS_KEY, products);
  syncStorefront(products);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { apiFetch, isApiAvailable } = await import('./api');
    if (isApiAvailable()) {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      return;
    }
  } catch {
    // fallback
  }

  const products = load<AdminProduct[]>(PRODUCTS_KEY, []).filter((p) => p.id !== id);
  save(PRODUCTS_KEY, products);
  syncStorefront(products);
}

export async function uploadImage(file: File): Promise<string> {
  try {
    const { isApiAvailable, getAuthToken } = await import('./api');
    if (isApiAvailable()) {
      const form = new FormData();
      form.append('file', file);
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/files/upload?folder=products`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        }
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error('Yükləmə uğursuz oldu');
      return payload.data as string;
    }
  } catch {
    // fallback to base64
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Şəkil oxunmadı'));
    reader.readAsDataURL(file);
  });
}
