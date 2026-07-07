import crypto from 'crypto';
import { findProductByVariantId } from './products.js';

export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export function orderStatusLabelAz(status) {
  const map = {
    Pending: 'Gözləyir',
    Confirmed: 'Təsdiqləndi',
    Shipped: 'Göndərildi',
    Delivered: 'Çatdırıldı',
    Cancelled: 'Ləğv edildi',
  };
  return map[status] ?? status;
}

export function buildCustomerOrderNotification(order, newStatus, previousStatus) {
  const isCancelled = newStatus === 'Cancelled';
  return {
    id: crypto.randomUUID(),
    userId: order.userId,
    type: 'OrderStatus',
    title: isCancelled ? 'Sifarişiniz ləğv edildi' : 'Sifariş statusu yeniləndi',
    message: isCancelled
      ? `${order.orderNumber} nömrəli sifarişiniz ləğv edildi. Suallarınız varsa dəstək xidmətimizlə əlaqə saxlayın.`
      : `${order.orderNumber} sifarişiniz: ${orderStatusLabelAz(previousStatus)} → ${orderStatusLabelAz(newStatus)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: newStatus,
    previousStatus,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
}

export function resolveOrderItemProduct(db, item) {
  if (item.productId) {
    const p = db.products.find((x) => x.id === item.productId);
    if (p) return { productId: p.id, productSlug: p.slug, productName: p.name };
  }
  const variantId = item.productVariantId ?? item.variantId;
  const p = findProductByVariantId(db, variantId);
  if (p) return { productId: p.id, productSlug: p.slug, productName: p.name };
  return { productId: null, productSlug: null, productName: item.productName ?? '' };
}

export function userDeliveredProductIds(db, userId) {
  const ids = new Set();
  for (const order of db.orders ?? []) {
    if (order.userId !== userId || order.status !== 'Delivered') continue;
    for (const item of order.items ?? []) {
      const { productId } = resolveOrderItemProduct(db, item);
      if (productId) ids.add(productId);
    }
  }
  return ids;
}

export function revenueOrders(orders) {
  return orders.filter((o) => o.status !== 'Cancelled');
}
