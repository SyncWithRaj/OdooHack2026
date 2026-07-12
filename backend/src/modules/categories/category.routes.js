import { Router } from 'express';
import { createCategory, getCategories, updateCategory } from './category.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// POST /api/v1/categories — admin
router.post(
  '/',
  protect,
  restrictTo('admin'),
  activityLogger('CATEGORY_CREATED', 'asset_category', (req, data) => data?.data?.category?.id),
  createCategory
);

// GET /api/v1/categories — All (protected)
router.get('/', protect, getCategories);

// PATCH /api/v1/categories/:id — admin
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  activityLogger('CATEGORY_UPDATED', 'asset_category', (req) => parseInt(req.params.id)),
  updateCategory
);

export default router;
