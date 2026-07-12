import { Router } from 'express';
import { createDepartment, getDepartments, updateDepartment } from './department.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// POST /api/v1/departments — admin
router.post(
  '/',
  protect,
  restrictTo('admin'),
  activityLogger('DEPARTMENT_CREATED', 'department', (req, data) => data?.data?.department?.id),
  createDepartment
);

// GET /api/v1/departments — All (protected)
router.get('/', protect, getDepartments);

// PATCH /api/v1/departments/:id — admin
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  activityLogger('DEPARTMENT_UPDATED', 'department', (req) => parseInt(req.params.id)),
  updateDepartment
);

export default router;
