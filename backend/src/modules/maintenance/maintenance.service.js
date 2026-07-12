import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';
import { sendNotificationEmail } from '../../utils/email.js';

/**
 * Raise a maintenance request — any employee can submit.
 */
export const createMaintenanceRequest = async (data, raisedById) => {
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new AppError('Asset not found.', 404);

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      raisedById,
      description: data.description,
      priority: data.priority || 'medium',
      photoUrl: data.photoUrl || null,
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      raisedBy: { select: { id: true, name: true } },
    },
  });

  return request;
};

/**
 * Get maintenance requests — scoped by role.
 */
export const getMaintenanceRequests = async (query, user) => {
  const where = {};

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assetId) where.assetId = parseInt(query.assetId);

  // Employees see only their own requests
  if (user.role === 'employee') {
    where.raisedById = user.id;
  } else if (user.role === 'department_head') {
    // Dept heads see requests from their department's users
    where.raisedBy = { departmentId: user.departmentId };
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true, status: true } },
      raisedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
};

/**
 * Transition maintenance status.
 * Pending → Approved/Rejected (Asset Manager)
 * Approved → Technician Assigned
 * Technician Assigned → In Progress
 * Triggers asset status flip to under_maintenance on approval.
 */
export const updateMaintenanceStatus = async (requestId, data, approvedById) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { asset: true },
  });

  if (!request) throw new AppError('Maintenance request not found.', 404);

  // Valid state transitions
  const validTransitions = {
    pending: ['approved', 'rejected'],
    approved: ['technician_assigned'],
    technician_assigned: ['in_progress'],
    in_progress: ['resolved'],
  };

  const allowed = validTransitions[request.status];
  if (!allowed || !allowed.includes(data.status)) {
    throw new AppError(
      `Invalid transition: ${request.status} → ${data.status}. Allowed: ${allowed?.join(', ') || 'none'}.`,
      400
    );
  }

  const updateData = { status: data.status };

  if (data.status === 'approved' || data.status === 'rejected') {
    updateData.approvedById = approvedById;
  }
  if (data.technicianName) {
    updateData.technicianName = data.technicianName;
  }
  if (data.startDate) {
    updateData.startDate = new Date(data.startDate);
  }
  if (data.endDate) {
    updateData.endDate = new Date(data.endDate);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        raisedBy: { select: { id: true, name: true } },
      },
    });

    // Asset status flip: under_maintenance on approval
    if (data.status === 'approved') {
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: 'under_maintenance' },
      });

      // Find overlapping bookings if we have a duration
      if (updateData.startDate && updateData.endDate) {
        const overlappingBookings = await tx.resourceBooking.findMany({
          where: {
            assetId: request.assetId,
            status: { in: ['upcoming', 'ongoing'] },
            startTime: { lt: updateData.endDate },
            endTime: { gt: updateData.startDate },
          },
        });

        if (overlappingBookings.length > 0) {
          // Cancel them
          await tx.resourceBooking.updateMany({
            where: { id: { in: overlappingBookings.map(b => b.id) } },
            data: { status: 'cancelled' },
          });

          // Notify users
          for (const b of overlappingBookings) {
            await tx.notification.create({
              data: {
                userId: b.userId,
                title: 'Booking Cancelled (Maintenance)',
                message: `Your booking for "${request.asset.name}" has been cancelled because the asset was placed under maintenance.`,
                type: 'BOOKING_CANCELLED_MAINTENANCE',
                referenceId: b.id,
                referenceType: 'booking',
              },
            });
          }
        }
      }
    }

    // Notify the requester
    const notifType = data.status === 'approved' ? 'MAINTENANCE_APPROVED' : 
                      data.status === 'rejected' ? 'MAINTENANCE_REJECTED' : null;
    if (notifType) {
      await tx.notification.create({
        data: {
          userId: request.raisedById,
          title: `Maintenance ${data.status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your maintenance request for "${request.asset.name}" has been ${data.status}.`,
          type: notifType,
          referenceId: requestId,
          referenceType: 'maintenance',
        },
      });

      // Send email notification to requester
      const raiser = await tx.user.findUnique({ where: { id: request.raisedById }, select: { email: true } });
      if (raiser?.email) {
        sendNotificationEmail(
          raiser.email,
          `Maintenance ${data.status === 'approved' ? 'Approved' : 'Rejected'}`,
          `Your maintenance request for "${request.asset.name}" (${request.asset.assetTag}) has been ${data.status}.`
        ).catch(() => {});
      }
    }

    return updated;
  });

  return result;
};

/**
 * Resolve maintenance — logs repair details, resets asset status to available.
 */
export const resolveMaintenanceRequest = async (requestId, data, resolvedById) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { asset: true },
  });

  if (!request) throw new AppError('Maintenance request not found.', 404);
  if (request.status !== 'in_progress' && request.status !== 'technician_assigned') {
    throw new AppError(
      `Cannot resolve a request with status: ${request.status}. Must be in_progress or technician_assigned.`,
      400
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'resolved',
        resolutionNotes: data.resolutionNotes || null,
        resolvedAt: new Date(),
        approvedById: resolvedById,
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        raisedBy: { select: { id: true, name: true } },
      },
    });

    // Reset asset status to available
    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'available' },
    });

    return updated;
  });

  return result;
};
