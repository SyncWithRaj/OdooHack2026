import { Router } from 'express';
import {
  getKpis,
  getHeatmaps,
  getUtilization,
  getMaintenanceFrequency,
  getDepartmentSummary,
  getActivityLogs,
} from './analytics.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';

const router = Router();

// GET /api/v1/analytics/kpis — All (Scoped)
router.get('/kpis', protect, getKpis);

// GET /api/v1/analytics/heatmaps — admin, asset_manager
router.get('/heatmaps', protect, restrictTo('admin', 'asset_manager'), getHeatmaps);

// GET /api/v1/analytics/utilization — admin, asset_manager
router.get('/utilization', protect, restrictTo('admin', 'asset_manager'), getUtilization);

// GET /api/v1/analytics/maintenance-frequency — admin, asset_manager
router.get('/maintenance-frequency', protect, restrictTo('admin', 'asset_manager'), getMaintenanceFrequency);

// GET /api/v1/analytics/department-summary — admin, asset_manager
router.get('/department-summary', protect, restrictTo('admin', 'asset_manager'), getDepartmentSummary);

// GET /api/v1/analytics/logs — admin
router.get('/logs', protect, restrictTo('admin'), getActivityLogs);

export default router;
