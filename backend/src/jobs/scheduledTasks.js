import cron from 'node-cron';
import prisma from '../utils/prisma.js';

/**
 * Scheduled tasks for AssetFlow.
 * - Overdue allocation checks (every hour)
 * - Booking status transitions (every 15 min)
 */
export function startScheduledTasks() {
  // Every hour: Check overdue allocations → create notifications
  cron.schedule('0 * * * *', async () => {
    try {
      const overdueAllocations = await prisma.allocation.findMany({
        where: {
          status: 'active',
          expectedReturnDate: { lt: new Date() },
        },
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          assignedToUser: { select: { id: true, name: true } },
        },
      });

      for (const allocation of overdueAllocations) {
        if (allocation.assignedToUserId) {
          // Check if notification already sent today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: allocation.assignedToUserId,
              type: 'OVERDUE_ALERT',
              referenceId: allocation.id,
              referenceType: 'allocation',
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                userId: allocation.assignedToUserId,
                title: 'Overdue Return Alert',
                message: `Asset "${allocation.asset.name}" (${allocation.asset.assetTag}) is overdue for return.`,
                type: 'OVERDUE_ALERT',
                referenceId: allocation.id,
                referenceType: 'allocation',
              },
            });
          }
        }
      }

      if (overdueAllocations.length > 0) {
        console.log(`[CRON] Flagged ${overdueAllocations.length} overdue allocations.`);
      }
    } catch (err) {
      console.error('[CRON] Overdue check error:', err.message);
    }
  });

  // Every 15 minutes: Transition booking statuses
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();

      // upcoming → ongoing (if start_time has passed)
      const startedBookings = await prisma.resourceBooking.updateMany({
        where: {
          status: 'upcoming',
          startTime: { lte: now },
        },
        data: { status: 'ongoing' },
      });

      // ongoing → completed (if end_time has passed)
      const completedBookings = await prisma.resourceBooking.updateMany({
        where: {
          status: 'ongoing',
          endTime: { lte: now },
        },
        data: { status: 'completed' },
      });

      if (startedBookings.count > 0 || completedBookings.count > 0) {
        console.log(
          `[CRON] Booking transitions: ${startedBookings.count} started, ${completedBookings.count} completed.`
        );
      }
    } catch (err) {
      console.error('[CRON] Booking transition error:', err.message);
    }
  });

  console.log('[CRON] Scheduled tasks initialized.');
}
