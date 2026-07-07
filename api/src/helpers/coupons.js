export function computeCouponDiscount(coupon, items, subTotalOverride) {
  const subTotal =
    subTotalOverride ??
    items.reduce((s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0);
  const slug = coupon.applicableCategorySlug || '';
  const applicableTotal = slug
    ? items
        .filter((i) => i.categorySlug === slug)
        .reduce((s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1), 0)
    : subTotal;

  if (slug && applicableTotal <= 0) {
    return {
      valid: false,
      message: 'Bu promo kod yalnız müəyyən kateqoriyaya şamil olunur — səbətinizdə uyğun məhsul yoxdur',
    };
  }

  const percent = coupon.discountPercent ?? coupon.value ?? 0;
  let discountAmount = 0;
  if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(Number(coupon.value) || 0, applicableTotal);
  } else {
    discountAmount = Math.round(applicableTotal * percent) / 100;
  }

  return {
    valid: true,
    discountAmount,
    applicableTotal,
    discountPercent: coupon.discountType === 'percentage' ? percent : null,
  };
}
