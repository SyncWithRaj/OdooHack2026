import catchAsync from '../../utils/catchAsync.js';
import * as assetService from './asset.service.js';

/**
 * POST /api/v1/assets — asset_manager
 * Registers a new asset with an auto-generated tracking tag.
 */
export const createAsset = catchAsync(async (req, res) => {
  const asset = await assetService.createAsset(req.body);

  res.status(201).json({
    success: true,
    message: 'Asset registered successfully.',
    data: { asset },
  });
});

/**
 * GET /api/v1/assets — All
 * Queries directory with server-side filters.
 */
export const getAssets = catchAsync(async (req, res) => {
  const assets = await assetService.getAssets(req.query);

  res.status(200).json({
    success: true,
    results: assets.length,
    data: { assets },
  });
});

/**
 * GET /api/v1/assets/:id — All
 */
export const getAssetById = catchAsync(async (req, res) => {
  const asset = await assetService.getAssetById(parseInt(req.params.id));

  res.status(200).json({
    success: true,
    data: { asset },
  });
});

/**
 * GET /api/v1/assets/:id/history — asset_manager, admin
 * Returns combined allocation and maintenance timelines for an asset.
 */
export const getAssetHistory = catchAsync(async (req, res) => {
  const history = await assetService.getAssetHistory(parseInt(req.params.id));

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * PATCH /api/v1/assets/:id — asset_manager
 */
export const updateAsset = catchAsync(async (req, res) => {
  const asset = await assetService.updateAsset(parseInt(req.params.id), req.body);

  res.status(200).json({
    success: true,
    message: 'Asset updated successfully.',
    data: { asset },
  });
});
