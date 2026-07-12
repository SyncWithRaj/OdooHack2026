import { Router } from 'express';
import { getBookings, createBooking, cancelBooking } from './booking.controller.js';
import protect from '../../middleware/auth.js';
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

export default router;
