import catchAsync from '../../utils/catchAsync.js';
import * as auditService from './audit.service.js';

/**
 * POST /api/v1/audits — admin
 * Spins up an audit cycle scope and provisions assigned auditors.
 */
export const createAuditCycle = catchAsync(async (req, res) => {
  const cycle = await auditService.createAuditCycle(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Audit cycle created successfully.',
    data: { auditCycle: cycle },
  });
});

/**
 * GET /api/v1/audits — admin, asset_manager
 */
export const getAuditCycles = catchAsync(async (req, res) => {
  const cycles = await auditService.getAuditCycles(req.query);

  res.status(200).json({
    success: true,
    results: cycles.length,
    data: { auditCycles: cycles },
  });
});

/**
 * GET /api/v1/audits/:cycleId — assigned auditors
 */
export const getAuditCycleById = catchAsync(async (req, res) => {
  const cycle = await auditService.getAuditCycleById(parseInt(req.params.cycleId));

  res.status(200).json({
    success: true,
    data: { auditCycle: cycle },
  });
});

/**
 * POST /api/v1/audits/:cycleId/verify — Assigned Auditor
 * Records single item verification details (verified, missing, damaged).
 */
export const verifyAuditItem = catchAsync(async (req, res) => {
  const item = await auditService.verifyAuditItem(
    parseInt(req.params.cycleId),
    req.body,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Audit item verified.',
    data: { auditItem: item },
  });
});

/**
 * POST /api/v1/audits/:cycleId/close — admin, asset_manager
 * Locks cycle data, creates discrepancy reports, auto-updates asset states.
 */
export const closeAuditCycle = catchAsync(async (req, res) => {
  const result = await auditService.closeAuditCycle(
    parseInt(req.params.cycleId),
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: `Audit cycle closed. ${result.discrepanciesCreated} discrepancies found.`,
    data: result,
  });
});
