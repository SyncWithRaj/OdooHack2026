import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Create asset category (Electronics, Furniture, Vehicles, etc.)
 */
export const createCategory = async ({ name, description, metadataSchema }) => {
  const existingCategory = await prisma.assetCategory.findUnique({ where: { name } });
  if (existingCategory) throw new AppError('Category name already exists.', 409);

  const category = await prisma.assetCategory.create({
    data: { name, description, metadataSchema },
  });
  return category;
};

/**
 * Get all categories.
 */
export const getCategories = async () => {
  const categories = await prisma.assetCategory.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: 'asc' },
  });
  return categories;
};

/**
 * Update a category.
 */
export const updateCategory = async (id, data) => {
  const category = await prisma.assetCategory.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found.', 404);

  if (data.name && data.name !== category.name) {
    const existingCategory = await prisma.assetCategory.findUnique({ where: { name: data.name } });
    if (existingCategory) throw new AppError('Category name already exists.', 409);
  }

  const updated = await prisma.assetCategory.update({
    where: { id },
    data,
  });
  return updated;
};
