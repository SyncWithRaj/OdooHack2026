import prisma from '../utils/prisma.js';

/**
 * Activity Logger middleware factory.
 * Logs actions to the activity_logs table after a successful response.
 *
 * Usage: activityLogger('ASSET_REGISTERED', 'asset')
 *
 * @param {string} action - Action name (e.g., 'ASSET_ALLOCATED', 'ROLE_PROMOTED')
 * @param {string} entityType - Entity type (e.g., 'asset', 'user', 'department')
 * @param {Function} [getEntityId] - Optional function(req, res) to extract entity ID
 * @param {Function} [getDetails] - Optional function(req, res) to extract details
 */
const activityLogger = (action, entityType, getEntityId, getDetails) => {
  return async (req, res, next) => {
    // Store the original json method
    const originalJson = res.json.bind(res);

    // Override res.json to log after response is sent
    res.json = function (data) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logEntry = {
          userId: req.user?.id || null,
          action,
          entityType,
          entityId: getEntityId ? getEntityId(req, data) : null,
          details: getDetails ? getDetails(req, data) : null,
          ipAddress: req.ip || req.connection?.remoteAddress || null,
        };

        // Fire and forget — don't block the response
        prisma.activityLog.create({ data: logEntry }).catch((err) => {
          console.error('Activity log error:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

export default activityLogger;
