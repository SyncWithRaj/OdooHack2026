import prisma from './prisma.js';

/**
 * Generates auto-incremented asset tags in the format AF-0001, AF-0002, etc.
 */
export async function generateAssetTag() {
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { id: 'desc' },
    select: { assetTag: true },
  });

  let nextNumber = 1;
  if (lastAsset && lastAsset.assetTag) {
    const match = lastAsset.assetTag.match(/AF-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  let isUnique = false;
  let tag = '';
  
  while (!isUnique) {
    tag = `AF-${String(nextNumber).padStart(4, '0')}`;
    const existing = await prisma.asset.findUnique({ where: { assetTag: tag } });
    if (existing) {
      nextNumber++;
    } else {
      isUnique = true;
    }
  }

  return tag;
}
