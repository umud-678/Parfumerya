import { Router } from 'express';
import { readDb } from '../db/index.js';
import { ok } from '../utils/respond.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { revenueOrders } from '../helpers/orders.js';

const router = Router();

router.get('/api/reports/summary', requireAuth, requireAdmin, (_req, res) => {
  const db = readDb();
  const orders = revenueOrders(db.orders ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const dailyChart = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const revenue = orders
      .filter((o) => o.createdAt.startsWith(key))
      .reduce((s, o) => s + o.totalAmount, 0);
    dailyChart.push({ date: key, revenue: Math.round(revenue * 100) / 100 });
  }

  ok(res, {
    dailyRevenue: orders
      .filter((o) => o.createdAt.startsWith(today))
      .reduce((s, o) => s + o.totalAmount, 0),
    monthlyRevenue: orders
      .filter((o) => o.createdAt.startsWith(month))
      .reduce((s, o) => s + o.totalAmount, 0),
    totalSales: orders.reduce((s, o) => s + o.totalAmount, 0),
    dailyChart,
  });
});

router.get('/api/dashboard/stats', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const orders = revenueOrders(db.orders ?? []);

  ok(res, {
    totalSales: orders.reduce((s, o) => s + o.totalAmount, 0),
    dailyRevenue: orders.filter((o) => o.createdAt.startsWith(today)).reduce((s, o) => s + o.totalAmount, 0),
    monthlyRevenue: orders.filter((o) => o.createdAt.startsWith(month)).reduce((s, o) => s + o.totalAmount, 0),
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter((o) => o.status === 'Pending').length,
    unreadNotifications: db.notifications.filter((n) => !n.isRead).length,
  });
});

export default router;
