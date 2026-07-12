import express from 'express';
import cors from 'cors';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import { allocationRouter, transferRouter } from './modules/allocations/allocation.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';
import auditRoutes from './modules/audits/audit.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

// Middleware imports
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

const app = express();

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ============================================================================
// API ROUTES — /api/v1
// ============================================================================

// Module A: Authentication & Profile
app.use('/api/v1/auth', authRoutes);

// Module B: Organization Setup
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/employees', employeeRoutes);

// Module C: Asset Registry
app.use('/api/v1/assets', assetRoutes);

// Module D: Asset Allocations & Transfers
app.use('/api/v1/allocations', allocationRouter);
app.use('/api/v1/transfers', transferRouter);

// Module E: Resource Bookings
app.use('/api/v1/bookings', bookingRoutes);

// Module F: Maintenance Pipelines
app.use('/api/v1/maintenance', maintenanceRoutes);

// Module G: Verification & Audits
app.use('/api/v1/audits', auditRoutes);

// Module H: Dashboards & Analytics
app.use('/api/v1/analytics', analyticsRoutes);

// Notifications
app.use('/api/v1/notifications', notificationRoutes);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AssetFlow API is running.',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

app.use(errorHandler);

export default app;
