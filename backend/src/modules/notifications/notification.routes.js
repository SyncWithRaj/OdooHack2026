import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from './notification.controller.js';
import protect from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/notifications — All
router.get('/', protect, getNotifications);

// PATCH /api/v1/notifications/read-all — All (must come before /:id)
router.patch('/read-all', protect, markAllAsRead);

// PATCH /api/v1/notifications/:id/read — All
router.patch('/:id/read', protect, markAsRead);

export default router;
