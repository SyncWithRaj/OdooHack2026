import { Router } from 'express';
import {
  createAllocation,
  returnAllocation,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
  getAllocations,
  getTransfers,
} from './allocation.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import { restrictToDept } from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const allocationRouter = Router();
const transferRouter = Router();

// ---- Allocation Routes ----

// GET /api/v1/allocations — All (scoped by role in service)
allocationRouter.get('/', protect, getAllocations);

// POST /api/v1/allocations — asset_manager, admin
allocationRouter.post(
  '/',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('ASSET_ALLOCATED', 'allocation', (req, data) => data?.data?.allocation?.id),
  createAllocation
);

// POST /api/v1/allocations/:id/return — asset_manager, admin
allocationRouter.post(
  '/:id/return',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('ASSET_RETURNED', 'allocation', (req) => parseInt(req.params.id)),
  returnAllocation
);

// POST /api/v1/allocations/:id/transfer — any authenticated user (employee initiates)
allocationRouter.post(
  '/:id/transfer',
  protect,
  activityLogger('TRANSFER_REQUESTED', 'transfer', (req, data) => data?.data?.transfer?.id),
  createTransferRequest
);

// ---- Transfer Routes ----

// GET /api/v1/transfers — All (scoped)
transferRouter.get('/', protect, getTransfers);

// PATCH /api/v1/transfers/:id/approve — asset_manager, department_head (dept-scoped), admin
transferRouter.patch(
  '/:id/approve',
  protect,
  restrictTo('asset_manager', 'department_head', 'admin'),
  activityLogger('TRANSFER_APPROVED', 'transfer', (req) => parseInt(req.params.id)),
  approveTransfer
);

// PATCH /api/v1/transfers/:id/reject — asset_manager, department_head (dept-scoped), admin
transferRouter.patch(
  '/:id/reject',
  protect,
  restrictTo('asset_manager', 'department_head', 'admin'),
  activityLogger('TRANSFER_REJECTED', 'transfer', (req) => parseInt(req.params.id)),
  rejectTransfer
);

export { allocationRouter, transferRouter };
