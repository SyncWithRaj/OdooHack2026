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
  const employee = await employeeService.updateEmployeeRole(
    parseInt(id),
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
  const employee = await employeeService.updateEmployee(parseInt(id), req.body);

  res.status(200).json({
    success: true,
    message: 'Employee updated successfully.',
    data: { employee },
  });
});
