import catchAsync from '../../utils/catchAsync.js';
import * as categoryService from './category.service.js';

/**
 * POST /api/v1/categories — admin
 */
export const createCategory = catchAsync(async (req, res) => {
  const { name, description, metadataSchema } = req.body;
  const category = await categoryService.createCategory({ name, description, metadataSchema });

  res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    data: { category },
  });
});

/**
 * GET /api/v1/categories — All
 */
export const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getCategories();

  res.status(200).json({
    success: true,
    data: { categories },
  });
});

/**
 * PATCH /api/v1/categories/:id — admin
 */
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(parseInt(id), req.body);

  res.status(200).json({
    success: true,
    message: 'Category updated successfully.',
    data: { category },
  });
});
