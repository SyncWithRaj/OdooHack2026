import { Router } from 'express';
import { getBookings, createBooking, cancelBooking, approveBooking, rejectBooking } from './booking.controller.js';
import protect from '../../middleware/auth.js';
import restrictTo from '../../middleware/rbac.js';
import activityLogger from '../../middleware/activityLogger.js';

const router = Router();

// GET /api/v1/bookings — All
router.get('/', protect, getBookings);

// POST /api/v1/bookings — All
router.post(
  '/',
  protect,
  activityLogger('BOOKING_CREATED', 'booking', (req, data) => data?.data?.booking?.id),
  createBooking
);

// PATCH /api/v1/bookings/:id/cancel — All
router.patch(
  '/:id/cancel',
  protect,
  activityLogger('BOOKING_CANCELLED', 'booking', (req) => parseInt(req.params.id)),
  cancelBooking
);

// PATCH /api/v1/bookings/:id/approve — Asset Manager & Admin
router.patch(
  '/:id/approve',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('BOOKING_APPROVED', 'booking', (req) => parseInt(req.params.id)),
  approveBooking
);

// PATCH /api/v1/bookings/:id/reject — Asset Manager & Admin
router.patch(
  '/:id/reject',
  protect,
  restrictTo('asset_manager', 'admin'),
  activityLogger('BOOKING_REJECTED', 'booking', (req) => parseInt(req.params.id)),
  rejectBooking
);

export default router;
