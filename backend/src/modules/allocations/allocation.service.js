import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';
import { sendNotificationEmail } from '../../utils/email.js';

/**
 * Allocate asset to employee/department.
 * Validates state: If available → allocate. If allocated → reject with holder details.
 */
export const createAllocation = async (data, allocatedById) => {
  const asset = await prisma.asset.findUnique({
    where: { id: data.assetId },
    include: {
      allocations: {
        where: { status: 'active' },
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          assignedToDept: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!asset) throw new AppError('Asset not found.', 404);

  // Block allocation of an already-allocated asset
  if (asset.status === 'allocated') {
    const currentAllocation = asset.allocations[0];
    const holder = currentAllocation?.assignedToUser || currentAllocation?.assignedToDept;
    throw new AppError(
      `Asset is already allocated to ${holder?.name || 'unknown'}. Use Transfer Request instead.`,
      409
    );
  }

  if (asset.status !== 'available') {
    throw new AppError(
      `Asset cannot be allocated. Current status: ${asset.status}.`,
      400
    );
  }

  // Validate target: must be either user OR department, not both
  if (!data.assignedToUserId && !data.assignedToDeptId) {
    throw new AppError('Must specify either assignedToUserId or assignedToDeptId.', 400);
  }
  if (data.assignedToUserId && data.assignedToDeptId) {
    throw new AppError('Cannot assign to both a user and a department simultaneously.', 400);
  }

  // Transaction: create allocation + update asset status
  const allocation = await prisma.$transaction(async (tx) => {
    const newAllocation = await tx.allocation.create({
      data: {
        assetId: data.assetId,
        assignedToUserId: data.assignedToUserId || null,
        assignedToDeptId: data.assignedToDeptId || null,
        allocatedById,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        assignedToUser: { select: { id: true, name: true, email: true } },
        assignedToDept: { select: { id: true, name: true } },
        allocatedBy: { select: { id: true, name: true } },
      },
    });

    // Update asset status to allocated
    await tx.asset.update({
      where: { id: data.assetId },
      data: { status: 'allocated' },
    });

    // Create notification for the assignee
    if (data.assignedToUserId) {
      await tx.notification.create({
        data: {
          userId: data.assignedToUserId,
          title: 'Asset Assigned',
          message: `Asset "${asset.name}" (${asset.assetTag}) has been assigned to you.`,
          type: 'ASSET_ASSIGNED',
          referenceId: newAllocation.id,
          referenceType: 'allocation',
        },
      });

      // Send email notification
      if (newAllocation.assignedToUser?.email) {
        sendNotificationEmail(
          newAllocation.assignedToUser.email,
          'Asset Assigned',
          `Asset "${asset.name}" (${asset.assetTag}) has been assigned to you.`
        ).catch(() => {});
      }
    }

    return newAllocation;
  });

  return allocation;
};

/**
 * Return asset — mark returned, capture condition notes, status reverts to Available.
 */
export const returnAllocation = async (allocationId, { returnConditionNotes }) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    include: { asset: true },
  });

  if (!allocation) throw new AppError('Allocation not found.', 404);
  if (allocation.status !== 'active') {
    throw new AppError(`Allocation is not active. Current status: ${allocation.status}.`, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const returnedAllocation = await tx.allocation.update({
      where: { id: allocationId },
      data: {
        status: 'returned',
        actualReturnDate: new Date(),
        returnConditionNotes: returnConditionNotes || null,
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        assignedToUser: { select: { id: true, name: true } },
        assignedToDept: { select: { id: true, name: true } },
      },
    });

    // Reset asset status to available
    await tx.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'available' },
    });

    return returnedAllocation;
  });

  return updated;
};

/**
 * Initiate a transfer request for a currently occupied asset.
 */
export const createTransferRequest = async (allocationId, data, requestedByUserId) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    include: { asset: true },
  });

  if (!allocation) throw new AppError('Allocation not found.', 404);
  if (allocation.status !== 'active') {
    throw new AppError('Can only transfer active allocations.', 400);
  }

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId: allocation.assetId,
      currentAllocationId: allocationId,
      requestedByUserId,
      targetUserId: data.targetUserId || null,
      targetDeptId: data.targetDeptId || null,
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      requestedBy: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true } },
      targetDept: { select: { id: true, name: true } },
    },
  });

  return transfer;
};

/**
 * Approve a transfer — automatically alters allocation records in a transaction.
 *
 * RBAC enforcement:
 *   - Admin/Asset Manager: can approve any transfer
 *   - Department Head: can only approve transfers within their own department
 */
export const approveTransfer = async (transferId, approver) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId },
    include: {
      currentAllocation: {
        include: {
          assignedToDept: true,
          assignedToUser: { select: { id: true, departmentId: true } },
        },
      },
      asset: true,
    },
  });

  if (!transfer) throw new AppError('Transfer request not found.', 404);
  if (transfer.status !== 'requested') {
    throw new AppError(`Transfer is already ${transfer.status}.`, 400);
  }

  // Department Head scoped check — can only approve transfers for their department
  if (approver.role === 'department_head') {
    const currentDeptId =
      transfer.currentAllocation.assignedToDeptId ||
      transfer.currentAllocation.assignedToUser?.departmentId;

    if (currentDeptId !== approver.departmentId) {
      throw new AppError(
        'Department Heads can only approve transfers within their own department.',
        403
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1) Close old allocation
    await tx.allocation.update({
      where: { id: transfer.currentAllocationId },
      data: { status: 'returned', actualReturnDate: new Date() },
    });

    // 2) Create new allocation for the target
    const newAllocation = await tx.allocation.create({
      data: {
        assetId: transfer.assetId,
        assignedToUserId: transfer.targetUserId || null,
        assignedToDeptId: transfer.targetDeptId || null,
        allocatedById: approver.id,
      },
    });

    // 3) Update transfer status
    const updatedTransfer = await tx.transferRequest.update({
      where: { id: transferId },
      data: { status: 'approved', approvedById: approver.id },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        targetDept: { select: { id: true, name: true } },
      },
    });

    // 4) Notify the requester
    await tx.notification.create({
      data: {
        userId: transfer.requestedByUserId,
        title: 'Transfer Approved',
        message: `Transfer request for asset "${transfer.asset.name}" has been approved.`,
        type: 'TRANSFER_APPROVED',
        referenceId: transferId,
        referenceType: 'transfer',
      },
    });

    // 5) Notify the target user + email
    if (transfer.targetUserId) {
      await tx.notification.create({
        data: {
          userId: transfer.targetUserId,
          title: 'Asset Assigned via Transfer',
          message: `Asset "${transfer.asset.name}" has been transferred to you.`,
          type: 'ASSET_ASSIGNED',
          referenceId: newAllocation.id,
          referenceType: 'allocation',
        },
      });

      if (updatedTransfer.targetUser?.email) {
        sendNotificationEmail(
          updatedTransfer.targetUser.email,
          'Asset Transferred to You',
          `Asset "${transfer.asset.name}" (${transfer.asset.assetTag}) has been transferred to you.`
        ).catch(() => {});
      }
    }

    return updatedTransfer;
  });

  return result;
};

/**
 * Reject a transfer with reason.
 *
 * RBAC: Department Head scoped to their department.
 */
export const rejectTransfer = async (transferId, rejectionReason, approver) => {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: transferId },
    include: {
      currentAllocation: {
        include: {
          assignedToDept: true,
          assignedToUser: { select: { id: true, departmentId: true } },
        },
      },
    },
  });

  if (!transfer) throw new AppError('Transfer request not found.', 404);
  if (transfer.status !== 'requested') {
    throw new AppError(`Transfer is already ${transfer.status}.`, 400);
  }

  // Department Head scoped check
  if (approver.role === 'department_head') {
    const currentDeptId =
      transfer.currentAllocation.assignedToDeptId ||
      transfer.currentAllocation.assignedToUser?.departmentId;

    if (currentDeptId !== approver.departmentId) {
      throw new AppError(
        'Department Heads can only reject transfers within their own department.',
        403
      );
    }
  }

  const updated = await prisma.transferRequest.update({
    where: { id: transferId },
    data: {
      status: 'rejected',
      rejectionReason,
      approvedById: approver.id,
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  return updated;
};

/**
 * Get allocations — scoped by role.
 *   Employee: own allocations only
 *   Department Head: department allocations + own
 *   Admin/Asset Manager: org-wide
 */
export const getAllocations = async (query, user) => {
  const where = {};

  if (query.status) where.status = query.status;
  if (query.assetId) where.assetId = parseInt(query.assetId);

  // Scope by role
  if (user.role === 'employee') {
    where.assignedToUserId = user.id;
  } else if (user.role === 'department_head') {
    // Department head sees department allocations + allocations to dept users
    where.OR = [
      { assignedToDeptId: user.departmentId },
      { assignedToUser: { departmentId: user.departmentId } },
    ];
  }
  // admin and asset_manager see all

  const allocations = await prisma.allocation.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true, status: true } },
      assignedToUser: { select: { id: true, name: true, email: true } },
      assignedToDept: { select: { id: true, name: true } },
      allocatedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return allocations;
};

/**
 * Get transfer requests — scoped by role.
 */
export const getTransfers = async (query, user) => {
  const where = {};
  if (query.status) where.status = query.status;

  // Scope: employees see their own transfers only
  if (user.role === 'employee') {
    where.requestedByUserId = user.id;
  } else if (user.role === 'department_head') {
    // Dept head sees transfers involving their department
    where.OR = [
      { requestedByUserId: user.id },
      { targetDeptId: user.departmentId },
      { currentAllocation: { assignedToDeptId: user.departmentId } },
    ];
  }
  // admin and asset_manager see all

  const transfers = await prisma.transferRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      requestedBy: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true } },
      targetDept: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return transfers;
};
