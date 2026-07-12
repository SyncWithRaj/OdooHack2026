import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Get user's notifications — paginated, filterable.
 */
export const getNotifications = async (userId, query) => {
  const where = { userId };

  if (query.isRead !== undefined) {
    where.isRead = query.isRead === 'true';
  }
  if (query.type) {
    where.type = query.type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: parseInt(query.limit) || 50,
    skip: parseInt(query.offset) || 0,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { notifications, unreadCount };
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) throw new AppError('Notification not found.', 404);
  if (notification.userId !== userId) {
    throw new AppError('You can only mark your own notifications as read.', 403);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return updated;
};

/**
 * Mark all notifications as read.
 */
export const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: 'All notifications marked as read.' };
};
