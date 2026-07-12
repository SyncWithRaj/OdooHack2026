import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';
import { sendNotificationEmail } from '../../utils/email.js';

export const createAssetRequest = async (data, requestedByUserId) => {
  const request = await prisma.assetRequest.create({
    data: {
      requestedByUserId,
      categoryId: data.categoryId,
      justification: data.justification,
    },
    include: {
      category: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true, departmentId: true } },
    },
  });

  // Notify Department Head (if user has a department)
  if (request.requestedBy.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: request.requestedBy.departmentId },
      select: { departmentHeadId: true },
    });
    if (dept && dept.departmentHeadId) {
      await prisma.notification.create({
        data: {
          userId: dept.departmentHeadId,
          title: 'New Asset Request',
          message: `${request.requestedBy.name} requested a new asset in category ${request.category.name}.`,
          type: 'ASSET_REQUEST_PENDING',
          referenceId: request.id,
          referenceType: 'asset_request',
        },
      });
    }
  }

  return request;
};

export const getAssetRequests = async (query, user) => {
  const where = {};

  if (user.role === 'employee') {
    where.requestedByUserId = user.id;
  } else if (user.role === 'department_head') {
    where.OR = [
      { requestedByUserId: user.id },
      { requestedBy: { department: { departmentHeadId: user.id } } },
    ];
  }

  const requests = await prisma.assetRequest.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true, department: { select: { name: true } } } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests;
};

export const updateAssetRequestStatus = async (requestId, data, user) => {
  const request = await prisma.assetRequest.findUnique({
    where: { id: requestId },
    include: { requestedBy: true },
  });

  if (!request) throw new AppError('Asset request not found.', 404);

  // Authorization checks
  if (data.status === 'pending_asset_manager' && user.role !== 'department_head' && user.role !== 'admin') {
    throw new AppError('Only Department Head can approve requests to Asset Manager.', 403);
  }
  if ((data.status === 'approved' || data.status === 'allocated') && user.role !== 'asset_manager' && user.role !== 'admin') {
    throw new AppError('Only Asset Manager or Admin can final approve or allocate.', 403);
  }
  if (data.status === 'rejected' && user.role === 'employee') {
    throw new AppError('Unauthorized to reject requests.', 403);
  }

  const updated = await prisma.assetRequest.update({
    where: { id: requestId },
    data: {
      status: data.status,
      approvedById: user.id,
      rejectionReason: data.rejectionReason || null,
    },
    include: {
      category: { select: { id: true, name: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Notify employee
  await prisma.notification.create({
    data: {
      userId: request.requestedByUserId,
      title: `Asset Request ${data.status}`,
      message: `Your request for a ${updated.category.name} is now ${data.status.replace('_', ' ')}.`,
      type: `ASSET_REQUEST_${data.status.toUpperCase()}`,
      referenceId: request.id,
      referenceType: 'asset_request',
    },
  });

  return updated;
};
