import { Router } from 'express';
import crypto from 'crypto';
import { readDb, writeDb } from '../db/index.js';
import { ok, fail } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { isAdminUser } from '../helpers/users.js';
import { getProductStock, setProductStock } from '../helpers/products.js';
import { computeCouponDiscount } from '../helpers/coupons.js';
import {
  ORDER_STATUSES,
  orderStatusLabelAz,
  buildCustomerOrderNotification,
  resolveOrderItemProduct,
} from '../helpers/orders.js';

const router = Router();

router.get('/api/orders', requireAuth, (req, res) => {
  const db = readDb();
  const isAdmin = isAdminUser(req.user);
  const orders = isAdmin
    ? db.orders
    : db.orders.filter((o) => o.userId === req.user.id);
  ok(res, orders);
});

router.get('/api/orders/my', requireAuth, (req, res) => {
  const db = readDb();
  ok(res, db.orders.filter((o) => o.userId === req.user.id));
});

router.post('/api/orders', requireAuth, (req, res) => {
  const db = readDb();
  const {
    items, shippingFullName, shippingPhone, shippingAddress,
    shippingCity, shippingRegion, couponCode, notes, deliveryType,
  } = req.body ?? {};

  if (!items?.length) return fail(res, 400, 'Səbət boşdur');
  if (!shippingFullName?.trim() || !shippingPhone?.trim() || !shippingAddress?.trim()) {
    return fail(res, 400, 'Çatdırılma məlumatları tam doldurulmalıdır');
  }

  const DELIVERY_FEES = { express: 5, standard: 2 };
  const resolvedDelivery = deliveryType === 'standard' ? 'standard' : 'express';
  const shippingFee = DELIVERY_FEES[resolvedDelivery];

  let subTotal = 0;
  const orderItems = items.map((item) => {
    const total = item.unitPrice * item.quantity;
    subTotal += total;
    const resolved = resolveOrderItemProduct(db, item);
    return {
      ...item,
      productId: item.productId ?? resolved.productId,
      productSlug: item.productSlug ?? resolved.productSlug,
      categorySlug: item.categorySlug ?? '',
      totalPrice: total,
    };
  });

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = db.coupons.find((c) => c.code === couponCode.toUpperCase() && c.isActive);
    const now = new Date();
    if (coupon && new Date(coupon.startDate) <= now && new Date(coupon.endDate) >= now) {
      if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
        const calc = computeCouponDiscount(coupon, orderItems, subTotal);
        if (calc.valid) {
          discountAmount = calc.discountAmount;
          coupon.usedCount += 1;
          appliedCoupon = coupon.code;
        }
      }
    }
  }

  const totalAmount = Math.max(0, subTotal + shippingFee - discountAmount);

  for (const item of orderItems) {
    if (!item.productId) continue;
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;
    const available = getProductStock(product);
    if (available < item.quantity) {
      return fail(
        res,
        400,
        `${item.productName || product.name} üçün kifayət qədər stok yoxdur (qalan: ${available})`
      );
    }
  }

  const order = {
    id: crypto.randomUUID(),
    orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: req.user.id,
    userEmail: req.user.email,
    status: 'Pending',
    paymentStatus: 'OnDelivery',
    paymentMethod: 'cash_on_delivery',
    subTotal,
    shippingFee,
    discountAmount,
    totalAmount,
    couponCode: appliedCoupon,
    shippingFullName: shippingFullName.trim(),
    shippingPhone: shippingPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    shippingCity: shippingCity?.trim() || 'Bakı',
    shippingRegion: shippingRegion?.trim() || '',
    deliveryType: resolvedDelivery,
    notes,
    items: orderItems,
    createdAt: new Date().toISOString(),
    statusHistory: [{
      status: 'Pending',
      previousStatus: null,
      at: new Date().toISOString(),
      note: 'Sifariş qəbul edildi',
    }],
  };

  db.orders.unshift(order);

  for (const item of orderItems) {
    if (!item.productId) continue;
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;
    setProductStock(product, getProductStock(product) - item.quantity);
  }

  db.notifications.unshift({
    id: crypto.randomUUID(),
    type: 'NewOrder',
    title: 'Yeni sifariş',
    message: `#${order.orderNumber} — ${shippingFullName} — ${shippingAddress.trim()}, ${shippingCity?.trim() || 'Bakı'} — ${resolvedDelivery === 'express' ? 'Ekspress' : 'Sadə'} çatdırılma — ₼ ${totalAmount.toFixed(2)}${appliedCoupon ? ` (${appliedCoupon} -${discountAmount.toFixed(2)}₼)` : ''}`,
    referenceId: order.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  ok(res, order, 'Sifariş yaradıldı');
});

router.patch('/api/orders/:id/status', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return fail(res, 404, 'Sifariş tapılmadı');

  const newStatus = req.body?.status;
  if (!ORDER_STATUSES.includes(newStatus)) {
    return fail(res, 400, 'Etibarsız sifariş statusu');
  }

  const previousStatus = order.status;
  if (previousStatus === newStatus) {
    return ok(res, order, 'Status eyni qaldı');
  }

  const now = new Date().toISOString();
  order.status = newStatus;
  order.updatedAt = now;
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status: newStatus,
    previousStatus,
    at: now,
    note: newStatus === 'Cancelled' ? 'Sifariş ləğv edildi' : `Status: ${orderStatusLabelAz(newStatus)}`,
  });

  if (!db.customerNotifications) db.customerNotifications = [];
  db.customerNotifications.unshift(
    buildCustomerOrderNotification(order, newStatus, previousStatus)
  );

  writeDb(db);
  const msg = newStatus === 'Cancelled'
    ? 'Sifariş ləğv edildi — müştəriyə bildiriş göndərildi'
    : 'Status yeniləndi — müştəriyə bildiriş göndərildi';
  ok(res, order, msg);
});

export default router;
