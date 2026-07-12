import { Prisma } from '@prisma/client';

/**
 * Global error handling middleware.
 * Catches all errors and returns consistent JSON responses.
 * Handles Prisma-specific errors (unique constraint, not found, etc.)
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Prisma: Unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    err.statusCode = 409;
    err.message = `Duplicate value for ${field}. This value already exists.`;
    err.status = 'fail';
  }

  // Prisma: Record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    err.statusCode = 404;
    err.message = err.meta?.cause || 'Record not found.';
    err.status = 'fail';
  }

  // Prisma: Foreign key constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    err.statusCode = 400;
    err.message = `Invalid reference: related record does not exist for field '${err.meta?.field_name}'.`;
    err.status = 'fail';
  }

  // Prisma: Restrict delete violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2014') {
    err.statusCode = 400;
    err.message = 'Cannot delete this record because it is referenced by other records.';
    err.status = 'fail';
  }

  // JWT errors are handled in auth middleware, but catch stragglers
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token. Please log in again.';
    err.status = 'fail';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Your session has expired. Please log in again.';
    err.status = 'fail';
  }

  // Development vs Production response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production: only send operational errors' details
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown errors: don't leak details
  console.error('ERROR 💥:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong.',
  });
};

export default errorHandler;
