import catchAsync from '../../utils/catchAsync.js';
import * as maintenanceService from './maintenance.service.js';

/**
 * POST /api/v1/maintenance — employee (any authenticated user)
 * Submits a new defect issue.
 */
export const createMaintenanceRequest = catchAsync(async (req, res) => {
  const request = await maintenanceService.createMaintenanceRequest(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Maintenance request created successfully.',
    data: { maintenanceRequest: request },
  });
});

/**
 * GET /api/v1/maintenance — All (scoped)
 */
export const getMaintenanceRequests = catchAsync(async (req, res) => {
  const requests = await maintenanceService.getMaintenanceRequests(req.query, req.user);

  res.status(200).json({
    success: true,
    results: requests.length,
    data: { maintenanceRequests: requests },
  });
});

/**
 * PATCH /api/v1/maintenance/:id/status — asset_manager
 * Transitions request status. Triggers asset status flip to under_maintenance.
 */
export const updateMaintenanceStatus = catchAsync(async (req, res) => {
  const request = await maintenanceService.updateMaintenanceStatus(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: `Maintenance request status updated to ${req.body.status}.`,
    data: { maintenanceRequest: request },
  });
});

/**
 * POST /api/v1/maintenance/:id/resolve — asset_manager
 * Logs repair resolution details and resets asset status to available.
 */
export const resolveMaintenanceRequest = catchAsync(async (req, res) => {
  const request = await maintenanceService.resolveMaintenanceRequest(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Maintenance request resolved. Asset status reset to available.',
    data: { maintenanceRequest: request },
  });
});
