import express from 'express';
import * as requestController from './asset-requests.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post('/', requestController.createRequest);
router.get('/', requestController.getRequests);
router.patch('/:id/status', restrictTo('department_head', 'asset_manager', 'admin'), requestController.updateStatus);

export default router;
