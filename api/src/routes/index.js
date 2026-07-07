import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import settingsRoutes from './settings.js';
import usersRoutes from './users.js';
import productsRoutes from './products.js';
import categoriesRoutes from './categories.js';
import brandsRoutes from './brands.js';
import heroRoutes from './hero.js';
import filesRoutes from './files.js';
import couponsRoutes from './coupons.js';
import ordersRoutes from './orders.js';
import notificationsRoutes from './notifications.js';
import wishlistRoutes from './wishlist.js';
import reviewsRoutes from './reviews.js';
import dashboardRoutes from './dashboard.js';

const router = Router();

// Qeydiyyat sırası orijinal server.js ilə eynidir
router.use(healthRoutes);
router.use(authRoutes);
router.use(settingsRoutes);
router.use(usersRoutes);
router.use(productsRoutes);
router.use(categoriesRoutes);
router.use(brandsRoutes);
router.use(heroRoutes);
router.use(filesRoutes);
router.use(couponsRoutes);
router.use(ordersRoutes);
router.use(notificationsRoutes);
router.use(wishlistRoutes);
router.use(reviewsRoutes);
router.use(dashboardRoutes);

export default router;
