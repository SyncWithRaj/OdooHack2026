import catchAsync from '../../utils/catchAsync.js';
import * as departmentService from './department.service.js';

/**
 * POST /api/v1/departments — admin
 */
export const createDepartment = catchAsync(async (req, res) => {
  const { name, code, parentId, departmentHeadId } = req.body;
  const department = await departmentService.createDepartment({
    name,
    code,
    parentId,
    departmentHeadId,
  });

  res.status(201).json({
    success: true,
    message: 'Department created successfully.',
    data: { department },
  });
});

/**
 * GET /api/v1/departments — All
 */
export const getDepartments = catchAsync(async (req, res) => {
  const departments = await departmentService.getDepartments();

  res.status(200).json({
    success: true,
    data: { departments },
  });
});

/**
 * PATCH /api/v1/departments/:id — admin
 */
export const updateDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const department = await departmentService.updateDepartment(parseInt(id), req.body);

  res.status(200).json({
    success: true,
    message: 'Department updated successfully.',
    data: { department },
  });
});
