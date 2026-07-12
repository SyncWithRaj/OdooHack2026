import catchAsync from '../../utils/catchAsync.js';
import * as allocationService from './allocation.service.js';

/**
 * POST /api/v1/allocations — asset_manager
 * Validates state: If available → allocate. If allocated → reject with holder info.
 */
export const createAllocation = catchAsync(async (req, res) => {
  const allocation = await allocationService.createAllocation(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Asset allocated successfully.',
    data: { allocation },
  });
});

/**
 * POST /api/v1/allocations/:id/return — asset_manager
 * Marks asset returned, records condition notes, resets status to available.
 */
export const returnAllocation = catchAsync(async (req, res) => {
  const allocation = await allocationService.returnAllocation(
    parseInt(req.params.id),
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Asset returned successfully.',
    data: { allocation },
  });
});

/**
 * POST /api/v1/allocations/:id/transfer — employee
 * Initiates a transfer request for a currently occupied asset.
 */
export const createTransferRequest = catchAsync(async (req, res) => {
  const transfer = await allocationService.createTransferRequest(
    parseInt(req.params.id),
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: 'Transfer request created successfully.',
    data: { transfer },
  });
});

/**
 * PATCH /api/v1/transfers/:id/approve — asset_manager, dept_head
 * Approves transfer; automatically alters allocation records in a transaction.
 */
export const approveTransfer = catchAsync(async (req, res) => {
  const transfer = await allocationService.approveTransfer(
    parseInt(req.params.id),
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Transfer approved successfully.',
    data: { transfer },
  });
});

/**
 * PATCH /api/v1/transfers/:id/reject — asset_manager, dept_head
 */
export const rejectTransfer = catchAsync(async (req, res) => {
  const transfer = await allocationService.rejectTransfer(
    parseInt(req.params.id),
    req.body.rejectionReason,
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Transfer rejected.',
    data: { transfer },
  });
});

/**
 * GET /api/v1/allocations — All (scoped by role)
 */
export const getAllocations = catchAsync(async (req, res) => {
  const allocations = await allocationService.getAllocations(req.query, req.user);

  res.status(200).json({
    success: true,
    results: allocations.length,
    data: { allocations },
  });
});

/**
 * GET /api/v1/transfers — All
 */
export const getTransfers = catchAsync(async (req, res) => {
  const transfers = await allocationService.getTransfers(req.query, req.user);

  res.status(200).json({
    success: true,
    results: transfers.length,
    data: { transfers },
  });
});
