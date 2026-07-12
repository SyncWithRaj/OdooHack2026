import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Get employee directory — admin, asset_manager.
 * Supports filtering by department, role, status.
 */
export const getEmployees = async (query) => {
  const where = {};

  if (query.departmentId) {
    where.departmentId = parseInt(query.departmentId);
  }
  if (query.role) {
    where.role = query.role;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const employees = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      status: true,
      createdAt: true,
      department: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return employees;
};

/**
 * Promote/change employee role — admin only.
 * The exclusive gateway to promote an employee to Manager or Dept Head.
 * No self-elevation anywhere in the app.
 */
export const updateEmployeeRole = async (employeeId, newRole, adminId) => {
  // Cannot change own role
  if (employeeId === adminId) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new AppError('Employee not found.', 404);

  // Validate allowed roles
  const allowedRoles = ['employee', 'department_head', 'asset_manager', 'admin'];
  if (!allowedRoles.includes(newRole)) {
    throw new AppError(`Invalid role. Allowed: ${allowedRoles.join(', ')}`, 400);
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: { role: newRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      status: true,
    },
  });

  return updated;
};

/**
 * Update employee details (department, status) — admin only.
 */
export const updateEmployee = async (employeeId, data) => {
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new AppError('Employee not found.', 404);

  const allowedFields = {};
  if (data.departmentId !== undefined) allowedFields.departmentId = data.departmentId;
  if (data.status !== undefined) allowedFields.status = data.status;
  if (data.name !== undefined) allowedFields.name = data.name;

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: allowedFields,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      status: true,
      department: { select: { id: true, name: true } },
    },
  });

  return updated;
};
