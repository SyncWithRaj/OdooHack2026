import catchAsync from '../../utils/catchAsync.js';
import * as employeeService from './employee.service.js';

/**
 * GET /api/v1/employees — admin, asset_manager
 */
export const getEmployees = catchAsync(async (req, res) => {
  const employees = await employeeService.getEmployees(req.query);

  res.status(200).json({
    success: true,
    results: employees.length,
    data: { employees },
  });
});

/**
 * PATCH /api/v1/employees/:id/role — admin
 * The exclusive gateway to promote an employee.
 */
export const updateEmployeeRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const employeeId = parseInt(id);
  
  if (isNaN(employeeId)) {
    throw new AppError('Invalid employee ID', 400);
  }

  const employee = await employeeService.updateEmployeeRole(
    employeeId,
    role,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: `Employee role updated to ${role}.`,
    data: { employee },
  });
});

/**
 * PATCH /api/v1/employees/:id — admin
 */
export const updateEmployee = catchAsync(async (req, res) => {
  const { id } = req.params;
  const employeeId = parseInt(id);
  
  if (isNaN(employeeId)) {
    throw new AppError('Invalid employee ID', 400);
  }

  const employee = await employeeService.updateEmployee(employeeId, req.body);

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully.',
    data: { employee },
  });
});
