import { Router } from 'express';
import { createAsset, getAssets, getAssetById, getAssetHistory, updateAsset } from './asset.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// POST /api/v1/assets — asset_manager
router.post(
  '/',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('ASSET_REGISTERED', 'asset', (req, data) => data?.data?.asset?.id),
  createAsset
);

// GET /api/v1/assets — All
router.get('/', protect, getAssets);

// GET /api/v1/assets/:id — All
router.get('/:id', protect, getAssetById);

// GET /api/v1/assets/:id/history — asset_manager, admin
router.get(
  '/:id/history',
  protect,
  restrictTo('asset_manager', 'admin'),
  getAssetHistory
);

// PATCH /api/v1/assets/:id — asset_manager
router.patch(
  '/:id',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('ASSET_UPDATED', 'asset', (req) => parseInt(req.params.id)),
  updateAsset
);

export default router;
