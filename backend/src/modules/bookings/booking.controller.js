import catchAsync from '../../utils/catchAsync.js';
import * as bookingService from './booking.service.js';

/**
 * GET /api/v1/bookings — All
 * Fetches calendar schedules, filtered by asset ID and date range.
 */
export const getBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getBookings(req.query);

  res.status(200).json({
    success: true,
    results: bookings.length,
    data: { bookings },
  });
});

/**
 * POST /api/v1/bookings — All
 * Validates overlap: ensures no conflicting time slots.
 */
export const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully.',
    data: { booking },
  });
});

/**
 * PATCH /api/v1/bookings/:id/cancel — All
 * Cancels an upcoming reservation.
 */
export const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    parseInt(req.params.id),
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    data: { booking },
  });
});
