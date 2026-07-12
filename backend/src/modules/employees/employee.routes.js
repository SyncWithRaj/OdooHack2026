import { Router } from 'express';
import { getEmployees, updateEmployeeRole, updateEmployee } from './employee.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// GET /api/v1/employees — admin, asset_manager
router.get('/', protect, restrictTo('admin', 'asset_manager'), getEmployees);

// PATCH /api/v1/employees/:id/role — admin (the exclusive role promotion gateway)
router.patch(
  '/:id/role',
  protect,
  restrictTo('admin'),
  activityLogger('ROLE_PROMOTED', 'user', (req) => parseInt(req.params.id), (req) => ({ newRole: req.body.role })),
  updateEmployeeRole
);

// PATCH /api/v1/employees/:id — admin
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  activityLogger('EMPLOYEE_UPDATED', 'user', (req) => parseInt(req.params.id)),
  updateEmployee
);

export default router;
