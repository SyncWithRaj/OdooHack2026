import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';
import { generateAssetTag } from '../../utils/assetTagGenerator.js';

/**
 * Register a new asset with auto-generated tracking tag.
 */
export const createAsset = async (data) => {
  const assetTag = await generateAssetTag();

  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      assetTag,
      serialNumber: data.serialNumber || null,
      categoryId: data.categoryId,
      condition: data.condition || 'New',
      location: data.location || null,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
      acquisitionCost: data.acquisitionCost || null,
      photoUrl: data.photoUrl || null,
      documents: data.documents || null,
      isBookable: data.isBookable || false,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return asset;
};

/**
 * Get assets directory with server-side filters (Tag, Serial, Status, Category, Location).
 */
export const getAssets = async (query) => {
  const where = {};

  if (query.assetTag) {
    where.assetTag = { contains: query.assetTag, mode: 'insensitive' };
  }
  if (query.serialNumber) {
    where.serialNumber = { contains: query.serialNumber, mode: 'insensitive' };
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.categoryId) {
    where.categoryId = parseInt(query.categoryId);
  }
  if (query.location) {
    where.location = { contains: query.location, mode: 'insensitive' };
  }
  if (query.isBookable !== undefined) {
    where.isBookable = query.isBookable === 'true';
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { assetTag: { contains: query.search, mode: 'insensitive' } },
      { serialNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assets;
};

/**
 * Get single asset by ID.
 */
export const getAssetById = async (id) => {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      allocations: {
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          assignedToDept: { select: { id: true, name: true } },
          allocatedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!asset) throw new AppError('Asset not found.', 404);
  return asset;
};

/**
 * Get combined allocation and maintenance history for an asset.
 */
export const getAssetHistory = async (assetId) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new AppError('Asset not found.', 404);

  // Allocation history
  const allocations = await prisma.allocation.findMany({
    where: { assetId },
    include: {
      assignedToUser: { select: { id: true, name: true, email: true } },
      assignedToDept: { select: { id: true, name: true } },
      allocatedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Maintenance history
  const maintenance = await prisma.maintenanceRequest.findMany({
    where: { assetId },
    include: {
      raisedBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { asset, allocations, maintenance };
};

/**
 * Update asset fields.
 */
export const updateAsset = async (id, data) => {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new AppError('Asset not found.', 404);

  const updated = await prisma.asset.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return updated;
};
