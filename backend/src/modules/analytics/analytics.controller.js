import catchAsync from '../../utils/catchAsync.js';
import * as analyticsService from './analytics.service.js';

/**
 * GET /api/v1/analytics/kpis — All (Scoped)
 * Aggregates status counters.
 */
export const getKpis = catchAsync(async (req, res) => {
  const kpis = await analyticsService.getKpis(req.user);

  res.status(200).json({
    success: true,
    data: { kpis },
  });
});

/**
 * GET /api/v1/analytics/heatmaps — admin, asset_manager
 * Generates peak calendar usage window distribution.
 */
export const getHeatmaps = catchAsync(async (req, res) => {
  const heatmap = await analyticsService.getHeatmaps();

  res.status(200).json({
    success: true,
    data: { heatmap },
  });
});

/**
 * GET /api/v1/analytics/utilization — admin, asset_manager
 */
export const getUtilization = catchAsync(async (req, res) => {
  const utilization = await analyticsService.getUtilization();

  res.status(200).json({
    success: true,
    data: { utilization },
  });
});

/**
 * GET /api/v1/analytics/maintenance-frequency — admin, asset_manager
 */
export const getMaintenanceFrequency = catchAsync(async (req, res) => {
  const data = await analyticsService.getMaintenanceFrequency();

  res.status(200).json({
    success: true,
    data: { maintenanceFrequency: data },
  });
});

/**
 * GET /api/v1/analytics/department-summary — admin, asset_manager
 */
export const getDepartmentSummary = catchAsync(async (req, res) => {
  const data = await analyticsService.getDepartmentSummary();

  res.status(200).json({
    success: true,
    data: { departmentSummary: data },
  });
});

/**
 * GET /api/v1/analytics/logs — admin
 * Pulls the complete historical system audit trailing log.
 */
export const getActivityLogs = catchAsync(async (req, res) => {
  const { logs, total } = await analyticsService.getActivityLogs(req.query);

  res.status(200).json({
    success: true,
    results: logs.length,
    total,
    data: { logs },
  });
});
