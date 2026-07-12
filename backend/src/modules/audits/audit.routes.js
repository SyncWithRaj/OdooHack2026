import { Router } from 'express';
import {
  createAuditCycle,
  getAuditCycles,
  getAuditCycleById,
  verifyAuditItem,
  closeAuditCycle,
} from './audit.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// GET /api/v1/audits — admin, asset_manager
router.get('/', protect, restrictTo('admin', 'asset_manager'), getAuditCycles);

// POST /api/v1/audits — admin
router.post(
  '/',
  protect,
  restrictTo('admin'),
  activityLogger('AUDIT_CREATED', 'audit', (req, data) => data?.data?.auditCycle?.id),
  createAuditCycle
);

// GET /api/v1/audits/:cycleId — assigned auditors (access checked in service)
router.get('/:cycleId', protect, getAuditCycleById);

// POST /api/v1/audits/:cycleId/verify — Assigned Auditor (checked in service)
router.post(
  '/:cycleId/verify',
  protect,
  activityLogger('AUDIT_ITEM_VERIFIED', 'audit_item', (req) => parseInt(req.params.cycleId)),
  verifyAuditItem
);

// POST /api/v1/audits/:cycleId/close — admin, asset_manager
router.post(
  '/:cycleId/close',
  protect,
  restrictTo('admin', 'asset_manager'),
  activityLogger('AUDIT_CLOSED', 'audit', (req) => parseInt(req.params.cycleId)),
  closeAuditCycle
);

export default router;
