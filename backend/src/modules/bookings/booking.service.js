import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Get bookings — calendar schedules filtered by asset ID and date range.
 */
export const getBookings = async (query) => {
  const where = {};

  if (query.assetId) {
    where.assetId = parseInt(query.assetId);
  }
  if (query.userId) {
    where.userId = parseInt(query.userId);
  }
  if (query.status) {
    where.status = query.status;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    where.startTime = {};
    if (query.startDate) {
      where.startTime.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      where.endTime = { lte: new Date(query.endDate) };
    }
  }

  const bookings = await prisma.resourceBooking.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true, location: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  return bookings;
};

/**
 * Create booking — validates overlap at application level.
 * SQL EXCLUDE constraint provides a second safety net at the DB level.
 */
export const createBooking = async (data, userId) => {
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new AppError('Asset not found.', 404);
  if (!asset.isBookable) {
    throw new AppError('This asset is not marked as bookable/shared.', 400);
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (endTime <= startTime) {
    throw new AppError('End time must be after start time.', 400);
  }

  // Application-level overlap check
  // True overlaps are blocked; adjacent slots (9:30–10:30 vs 10:30–11:30) are allowed
  const overlapping = await prisma.resourceBooking.findFirst({
    where: {
      assetId: data.assetId,
      status: { in: ['upcoming', 'ongoing'] },
      // Overlap: existing.start < new.end AND existing.end > new.start
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlapping) {
    throw new AppError(
      `Time slot conflicts with an existing booking (${overlapping.startTime.toISOString()} - ${overlapping.endTime.toISOString()}).`,
      409
    );
  }

  const booking = await prisma.resourceBooking.create({
    data: {
      assetId: data.assetId,
      userId,
      startTime,
      endTime,
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true, location: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Create notification for manager
  // In a real system, you might notify all asset managers. Here we just return it.
  
  return booking;
};

/**
 * Approve a pending booking
 */
export const approveBooking = async (bookingId, userId) => {
  const booking = await prisma.resourceBooking.findUnique({
    where: { id: bookingId },
    include: { asset: true },
  });

  if (!booking) throw new AppError('Booking not found.', 404);
  if (booking.status !== 'pending') {
    throw new AppError(`Cannot approve a booking with status: ${booking.status}.`, 400);
  }

  // Check for conflicts again before approving
  const overlapping = await prisma.resourceBooking.findFirst({
    where: {
      assetId: booking.assetId,
      status: { in: ['upcoming', 'ongoing'] },
      startTime: { lt: booking.endTime },
      endTime: { gt: booking.startTime },
    },
  });

  if (overlapping) {
    throw new AppError(
      `Cannot approve. Slot conflicts with an existing confirmed booking (${overlapping.startTime.toISOString()} - ${overlapping.endTime.toISOString()}).`,
      409
    );
  }

  const updated = await prisma.resourceBooking.update({
    where: { id: bookingId },
    data: { status: 'upcoming' },
    include: {
      asset: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Notify user of approval
  await prisma.notification.create({
    data: {
      userId: booking.userId,
      title: 'Booking Approved',
      message: `Your booking for "${updated.asset.name}" from ${booking.startTime.toISOString()} to ${booking.endTime.toISOString()} has been approved.`,
      type: 'BOOKING_APPROVED',
      referenceId: bookingId,
      referenceType: 'booking',
    },
  });

  return updated;
};

/**
 * Reject a pending booking
 */
export const rejectBooking = async (bookingId, userId) => {
  const booking = await prisma.resourceBooking.findUnique({
    where: { id: bookingId },
    include: { asset: true },
  });

  if (!booking) throw new AppError('Booking not found.', 404);
  if (booking.status !== 'pending') {
    throw new AppError(`Cannot reject a booking with status: ${booking.status}.`, 400);
  }

  const updated = await prisma.resourceBooking.update({
    where: { id: bookingId },
    data: { status: 'rejected' },
    include: {
      asset: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Notify user of rejection
  await prisma.notification.create({
    data: {
      userId: booking.userId,
      title: 'Booking Rejected',
      message: `Your booking for "${updated.asset.name}" from ${booking.startTime.toISOString()} to ${booking.endTime.toISOString()} has been rejected.`,
      type: 'BOOKING_REJECTED',
      referenceId: bookingId,
      referenceType: 'booking',
    },
  });

  return updated;
};

/**
 * Cancel an upcoming booking.
 */
export const cancelBooking = async (bookingId, userId) => {
  const booking = await prisma.resourceBooking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) throw new AppError('Booking not found.', 404);
  if (booking.status !== 'upcoming') {
    throw new AppError(`Cannot cancel a booking with status: ${booking.status}.`, 400);
  }

  const updated = await prisma.resourceBooking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      user: { select: { id: true, name: true } },
    },
  });

  // Notify user of cancellation
  await prisma.notification.create({
    data: {
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking for "${updated.asset.name}" has been cancelled.`,
      type: 'BOOKING_CANCELLED',
      referenceId: bookingId,
      referenceType: 'booking',
    },
  });

  return updated;
};
