import { Router } from 'express';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceStatus,
  resolveMaintenanceRequest,
} from './maintenance.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// GET /api/v1/maintenance — All (scoped)
router.get('/', protect, getMaintenanceRequests);

// POST /api/v1/maintenance — employee (any authenticated user)
router.post(
  '/',
  protect,
  activityLogger('MAINTENANCE_RAISED', 'maintenance', (req, data) => data?.data?.maintenanceRequest?.id),
  createMaintenanceRequest
);

// PATCH /api/v1/maintenance/:id/status — asset_manager
router.patch(
  '/:id/status',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('MAINTENANCE_STATUS_CHANGED', 'maintenance', (req) => parseInt(req.params.id), (req) => ({ newStatus: req.body.status })),
  updateMaintenanceStatus
);

// POST /api/v1/maintenance/:id/resolve — asset_manager
router.post(
  '/:id/resolve',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('MAINTENANCE_RESOLVED', 'maintenance', (req) => parseInt(req.params.id)),
  resolveMaintenanceRequest
);

export default router;
