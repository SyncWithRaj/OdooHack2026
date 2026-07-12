import catchAsync from '../../utils/catchAsync.js';
import * as notificationService from './notification.service.js';

/**
 * GET /api/v1/notifications — All (own notifications)
 */
export const getNotifications = catchAsync(async (req, res) => {
  const { notifications, unreadCount } = await notificationService.getNotifications(
    req.user.id,
    req.query
  );

  res.status(200).json({
    success: true,
    results: notifications.length,
    unreadCount,
    data: { notifications },
  });
});

/**
 * PATCH /api/v1/notifications/:id/read — All
 */
export const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(
    parseInt(req.params.id),
    req.user.id
  );

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

/**
 * PATCH /api/v1/notifications/read-all — All
 */
export const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
