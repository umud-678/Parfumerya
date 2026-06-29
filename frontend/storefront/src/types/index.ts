export interface ProductVariant {
  id: string;
  sku: string;
  volumeMl: number;
  price: number;
  discountPercent?: number;
  stockQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brandName: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  primaryImageUrl: string;
  secondaryImageUrl?: string;
  minPrice: number;
  maxPrice?: number;
  averageRating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  variants?: ProductVariant[];
  images?: { url: string; isPrimary: boolean }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  titleHighlight: string;
  titleEnd?: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  secondaryImageUrl?: string;
  ctaText: string;
  ctaLink: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  isActive?: boolean;
  sortOrder?: number;
  updatedAt?: string;
}

export interface ProductQuery {
  categorySlug?: string;
  categoryId?: string;
  featured?: boolean;
  trending?: boolean;
  search?: string;
  sort?: 'name' | 'price' | 'price-desc' | 'newest';
  limit?: number;
  offset?: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  imageUrl: string;
  volumeMl: number;
  price: number;
  quantity: number;
  categorySlug: string;
}

export interface User {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
  accessToken: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline?: string;
  email: string;
  phone: string;
  address: string;
  footerDescription?: string;
  socialLinks: Array<{ id: string; platform: string; label: string; url: string }>;
  shippingFee: number;
  freeShippingThreshold: number;
}
