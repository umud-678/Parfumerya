export function findProductByVariantId(db, variantId) {
  if (!variantId) return null;
  return (
    db.products.find((p) =>
      p.variants?.some((v) => v.id === variantId || v.sku === variantId)
    ) ?? null
  );
}

export function getProductStock(product) {
  if (!product) return 0;
  if (product.stock != null) return Math.max(0, Number(product.stock) || 0);
  const v = product.variants?.[0];
  return Math.max(0, Number(v?.stockQuantity ?? 0) || 0);
}

export function setProductStock(product, quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  product.stock = qty;
  if (product.variants?.length) {
    for (const v of product.variants) {
      v.stockQuantity = qty;
    }
  }
}

export function findProductBySku(db, sku) {
  if (!sku) return null;
  const normalized = String(sku).trim().toUpperCase();
  return (
    db.products.find(
      (p) =>
        (p.sku || '').toUpperCase() === normalized ||
        p.variants?.some((v) => (v.sku || '').toUpperCase() === normalized)
    ) ?? null
  );
}

export function productReviewStats(db, productId) {
  const reviews = (db.reviews ?? []).filter((r) => r.productId === productId);
  if (!reviews.length) {
    return { averageRating: null, reviewCount: 0 };
  }
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function enrichProduct(db, product) {
  const stats = productReviewStats(db, product.id);
  const { averageRating: _stored, reviewCount: _rc, ...rest } = product;
  return { ...rest, ...stats };
}

export function recalcProductRating(db, productId) {
  const product = db.products.find((p) => p.id === productId);
  if (!product) return;
  const stats = productReviewStats(db, productId);
  if (stats.reviewCount === 0) {
    delete product.averageRating;
    delete product.reviewCount;
    return;
  }
  product.averageRating = stats.averageRating;
  product.reviewCount = stats.reviewCount;
}

export function syncAllProductRatings(db) {
  let changed = false;
  for (const product of db.products ?? []) {
    const stats = productReviewStats(db, product.id);
    const nextRating = stats.averageRating;
    const nextCount = stats.reviewCount;
    if (product.averageRating !== nextRating || product.reviewCount !== nextCount) {
      if (nextRating == null) {
        delete product.averageRating;
        delete product.reviewCount;
      } else {
        product.averageRating = nextRating;
        product.reviewCount = nextCount;
      }
      changed = true;
    }
  }
  return changed;
}

export function filterProducts(products, query, categories) {
  let result = [...products];
  const {
    category, categorySlug, categoryId, featured, trending, search, sort,
  } = query;

  const slug = categorySlug || category;
  if (slug) {
    const cat = categories.find((c) => c.slug === slug);
    result = result.filter(
      (p) => p.categorySlug === slug || p.categoryId === cat?.id
    );
  }
  if (categoryId) {
    result = result.filter((p) => p.categoryId === categoryId);
  }
  if (featured === 'true') {
    result = result.filter((p) => p.isFeatured);
  }
  if (trending === 'true') {
    result = result.filter((p) => p.isFeatured || p.isNew);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brandName?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
    );
  }

  if (sort === 'price') result.sort((a, b) => (a.minPrice ?? a.price) - (b.minPrice ?? b.price));
  else if (sort === 'price-desc') result.sort((a, b) => (b.minPrice ?? b.price) - (a.minPrice ?? a.price));
  else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  else result.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));

  return result;
}
