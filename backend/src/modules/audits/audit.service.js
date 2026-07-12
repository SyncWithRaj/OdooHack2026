import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Create an audit cycle — spins up scope and provisions assigned auditors.
 */
export const createAuditCycle = async (data, createdById) => {
  // Validate scope
  if (data.scopeType === 'department' && !data.scopeDepartmentId) {
    throw new AppError('scopeDepartmentId is required when scopeType is "department".', 400);
  }
  if (data.scopeType === 'location' && !data.scopeLocation) {
    throw new AppError('scopeLocation is required when scopeType is "location".', 400);
  }

  // Create cycle with auditors
  const cycle = await prisma.auditCycle.create({
    data: {
      title: data.title,
      scopeType: data.scopeType,
      scopeDepartmentId: data.scopeDepartmentId || null,
      scopeLocation: data.scopeLocation || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdById,
      auditors: {
        connect: (data.auditorIds || []).map((id) => ({ id })),
      },
    },
    include: {
      auditors: { select: { id: true, name: true, email: true } },
      scopeDepartment: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Auto-populate audit items based on scope
  const assetWhere = {};
  if (data.scopeType === 'department') {
    // Find assets allocated to this department
    const deptAllocations = await prisma.allocation.findMany({
      where: { assignedToDeptId: data.scopeDepartmentId, status: 'active' },
      select: { assetId: true },
    });
    const deptAssetIds = deptAllocations.map((a) => a.assetId);
    if (deptAssetIds.length > 0) {
      assetWhere.id = { in: deptAssetIds };
    }
  } else if (data.scopeType === 'location') {
    assetWhere.location = { contains: data.scopeLocation, mode: 'insensitive' };
  }
  // scopeType 'all' — get all assets

  const assets = await prisma.asset.findMany({
    where: assetWhere,
    select: { id: true },
  });

  if (assets.length > 0) {
    await prisma.auditItem.createMany({
      data: assets.map((asset) => ({
        auditCycleId: cycle.id,
        assetId: asset.id,
      })),
    });
  }

  return { ...cycle, itemCount: assets.length };
};

/**
 * Get audit cycles.
 */
export const getAuditCycles = async (query) => {
  const where = {};
  if (query.status) where.status = query.status;

  const cycles = await prisma.auditCycle.findMany({
    where,
    include: {
      auditors: { select: { id: true, name: true } },
      scopeDepartment: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { items: true, discrepancies: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return cycles;
};

/**
 * Get a single audit cycle with all its items.
 */
export const getAuditCycleById = async (cycleId) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: {
      auditors: { select: { id: true, name: true, email: true } },
      scopeDepartment: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          asset: { select: { id: true, name: true, assetTag: true, status: true, location: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      },
      discrepancies: {
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!cycle) throw new AppError('Audit cycle not found.', 404);
  return cycle;
};

/**
 * Verify a single audit item — records verification details.
 * Only assigned auditors can verify.
 */
export const verifyAuditItem = async (cycleId, data, auditorId) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: { auditors: { select: { id: true } } },
  });

  if (!cycle) throw new AppError('Audit cycle not found.', 404);
  if (cycle.status === 'closed') throw new AppError('This audit cycle is closed.', 400);

  // Verify the user is an assigned auditor
  const isAuditor = cycle.auditors.some((a) => a.id === auditorId);
  if (!isAuditor) throw new AppError('You are not assigned as an auditor for this cycle.', 403);

  const item = await prisma.auditItem.findFirst({
    where: { auditCycleId: cycleId, assetId: data.assetId },
  });

  if (!item) throw new AppError('Audit item not found for this asset in this cycle.', 404);

  const updated = await prisma.auditItem.update({
    where: { id: item.id },
    data: {
      status: data.status, // verified, missing, damaged
      notes: data.notes || null,
      verifiedById: auditorId,
      verifiedAt: new Date(),
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  return updated;
};

/**
 * Close audit cycle — locks cycle, creates discrepancy reports,
 * auto-updates affected asset states (e.g., missing → lost).
 */
export const closeAuditCycle = async (cycleId, closedById) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: {
      items: {
        include: {
          asset: { select: { id: true, name: true, assetTag: true, status: true } },
        },
      },
    },
  });

  if (!cycle) throw new AppError('Audit cycle not found.', 404);
  if (cycle.status === 'closed') throw new AppError('This audit cycle is already closed.', 400);

  const result = await prisma.$transaction(async (tx) => {
    // Find discrepancies: items marked as missing or damaged
    const discrepantItems = cycle.items.filter(
      (item) => item.status === 'missing' || item.status === 'damaged'
    );

    // Create discrepancy reports
    for (const item of discrepantItems) {
      await tx.discrepancyReport.create({
        data: {
          auditCycleId: cycleId,
          assetId: item.assetId,
          expectedStatus: item.asset.status,
          foundStatus: item.status,
          details: item.notes,
        },
      });

      // Auto-update asset status: missing → lost
      if (item.status === 'missing') {
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: 'lost' },
        });
      }

      // Create notification for audit discrepancy
      await tx.notification.create({
        data: {
          userId: closedById,
          title: 'Audit Discrepancy Flagged',
          message: `Asset "${item.asset.name}" (${item.asset.assetTag}) found as ${item.status} during audit "${cycle.title}".`,
          type: 'AUDIT_DISCREPANCY',
          referenceId: cycleId,
          referenceType: 'audit',
        },
      });
    }

    // Lock the cycle
    const closedCycle = await tx.auditCycle.update({
      where: { id: cycleId },
      data: { status: 'closed' },
      include: {
        _count: { select: { items: true, discrepancies: true } },
      },
    });

    return {
      cycle: closedCycle,
      discrepanciesCreated: discrepantItems.length,
    };
  });

  return result;
};
