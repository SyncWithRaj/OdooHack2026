import { createAssetRequest, getAssetRequests, updateAssetRequestStatus } from './asset-requests.service.js';
import catchAsync from '../../utils/catchAsync.js';

export const createRequest = catchAsync(async (req, res) => {
  const request = await createAssetRequest(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: request });
});

export const getRequests = catchAsync(async (req, res) => {
  const requests = await getAssetRequests(req.query, req.user);
  res.status(200).json({ status: 'success', data: requests });
});

export const updateStatus = catchAsync(async (req, res) => {
  const updated = await updateAssetRequestStatus(parseInt(req.params.id), req.body, req.user);
  res.status(200).json({ status: 'success', data: updated });
});
