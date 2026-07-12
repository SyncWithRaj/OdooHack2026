import AppError from '../utils/AppError.js';
import prisma from '../utils/prisma.js';

/**
 * Role-Based Access Control middleware.
 *
 * Enforces the provided role permissions server-side:
 *   Admin           — org setup, role assignment, org-wide analytics
 *   Asset Manager   — register/allocate assets, approve transfers/maintenance/audit, approve returns
 *   Department Head — view dept assets, approve dept allocation/transfer requests, book on behalf of dept
 *   Employee        — view own assets, book resources, raise maintenance, initiate return/transfer
 *
 * Usage:
 *   restrictTo('admin', 'asset_manager')           — basic role check
 *   restrictTo('admin', 'asset_manager').deptScoped — also verifies dept head owns the department
 */

/**
 * Basic role check — returns 403 if user's role is not in the allowed list.
 * No self-elevation is possible; roles are only changed via Admin's PATCH /employees/:id/role.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

/**
 * Department-scoped authorization for Department Heads.
 * Ensures a Department Head can only approve/manage resources within their own department.
 * Admin and Asset Manager bypass this check (they have org-wide access).
 *
 * @param {Function} getDeptId - Function(req) that extracts the target department ID from the request
 *
 * Usage: restrictToDept((req) => parseInt(req.body.assignedToDeptId))
 */
export const restrictToDept = (getDeptId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in.', 401));
    }

    // Admin and Asset Manager have org-wide access
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      return next();
    }

    // Department Head — verify they own the relevant department
    if (req.user.role === 'department_head') {
      const targetDeptId = getDeptId(req);

      if (!targetDeptId) {
        return next(); // No department to scope, let the service handle it
      }

      // Check if this user is the head of the target department
      const department = await prisma.department.findFirst({
        where: {
          id: targetDeptId,
          departmentHeadId: req.user.id,
        },
      });

      if (!department) {
        return next(
          new AppError('Department Heads can only manage resources within their own department.', 403)
        );
      }

      return next();
    }

    // Employees cannot reach here if restrictTo already blocked them
    return next(
      new AppError('You do not have permission to perform this action.', 403)
    );
  };
};

/**
 * Ownership check — ensures users can only access/modify their own resources.
 * Admin and managers bypass.
 *
 * @param {Function} getOwnerId - Function(req) that returns the resource owner's user ID
 *
 * Usage: restrictToOwner((req) => req.body.userId)
 */
export const restrictToOwner = (getOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in.', 401));
    }

    // Admin and Asset Manager have org-wide access
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      return next();
    }

    const ownerId = await getOwnerId(req);

    if (ownerId && ownerId !== req.user.id) {
      return next(
        new AppError('You can only access your own resources.', 403)
      );
    }

    next();
  };
};

export default restrictTo;
