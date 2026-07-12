import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';

/**
 * Create a new department — sets manager/parent links.
 */
export const createDepartment = async ({ name, code, parentId, departmentHeadId }) => {
  // Validate code uniqueness
  const existingCode = await prisma.department.findUnique({ where: { code } });
  if (existingCode) throw new AppError('Department code already exists.', 409);

  // Validate parent exists if provided
  if (parentId) {
    const parent = await prisma.department.findUnique({ where: { id: parentId } });
    if (!parent) throw new AppError('Parent department not found.', 404);
  }

  // Validate head exists if provided
  if (departmentHeadId) {
    const head = await prisma.user.findUnique({ where: { id: departmentHeadId } });
    if (!head) throw new AppError('Department head user not found.', 404);
  }

  const department = await prisma.department.create({
    data: { name, code, parentId, departmentHeadId },
    include: {
      parent: { select: { id: true, name: true } },
      head: { select: { id: true, name: true, email: true } },
    },
  });

  return department;
};

/**
 * Get all departments — fetches list/hierarchy of all active departments.
 */
export const getDepartments = async () => {
  const departments = await prisma.department.findMany({
    include: {
      parent: { select: { id: true, name: true, code: true } },
      head: { select: { id: true, name: true, email: true } },
      children: { select: { id: true, name: true, code: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: 'asc' },
  });

  return departments;
};

/**
 * Update a department.
 */
export const updateDepartment = async (id, data) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Department not found.', 404);

  // Validate code uniqueness if code is being updated
  if (data.code && data.code !== department.code) {
    const existingCode = await prisma.department.findUnique({ where: { code: data.code } });
    if (existingCode) throw new AppError('Department code already exists.', 409);
  }

  const updated = await prisma.department.update({
    where: { id },
    data,
    include: {
      parent: { select: { id: true, name: true } },
      head: { select: { id: true, name: true, email: true } },
    },
  });

  return updated;
};
