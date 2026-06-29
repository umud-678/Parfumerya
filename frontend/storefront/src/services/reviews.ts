import { apiFetch } from './api';

export interface ProductReview {
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

export interface ProductReviewsData {
  reviews: ProductReview[];
  averageRating: number | null;
  count: number;
}

export interface ReviewEligibility {
  canReview: boolean;
  alreadyReviewed: boolean;
  hasDelivered: boolean;
}

export interface EligibleProduct {
  productId: string;
  productName: string;
  productSlug: string;
}

export async function getProductReviews(slug: string): Promise<ProductReviewsData> {
  return apiFetch<ProductReviewsData>(`/products/${slug}/reviews`);
}

export async function getReviewEligibility(slug: string): Promise<ReviewEligibility> {
  return apiFetch<ReviewEligibility>(`/products/${slug}/review-eligibility`);
}

export async function getMyEligibleReviews(): Promise<EligibleProduct[]> {
  return apiFetch<EligibleProduct[]>('/reviews/my-eligible');
}

export async function submitReview(input: {
  productId: string;
  rating: number;
  comment: string;
}): Promise<ProductReview> {
  return apiFetch<ProductReview>('/reviews', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
