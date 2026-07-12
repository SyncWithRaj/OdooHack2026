import prisma from '../../utils/prisma.js';

/**
 * Dashboard KPI aggregations — scoped by role.
 * Admin sees org-wide, Dept Head sees department, Employee sees personal.
 */
export const getKpis = async (user) => {
  const assetWhere = {};
  const allocationWhere = {};
  const bookingWhere = {};
  const maintenanceWhere = {};

  // Scope by role
  if (user.role === 'employee') {
    allocationWhere.assignedToUserId = user.id;
    bookingWhere.userId = user.id;
    maintenanceWhere.raisedById = user.id;
  } else if (user.role === 'department_head' && user.departmentId) {
    allocationWhere.assignedToDeptId = user.departmentId;
  }
  // admin and asset_manager see all

  const [
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    overdueReturns,
    upcomingReturns,
  ] = await Promise.all([
    // Assets Available
    prisma.asset.count({ where: { ...assetWhere, status: 'available' } }),
    // Assets Allocated
    prisma.asset.count({ where: { ...assetWhere, status: 'allocated' } }),
    // Maintenance Today
    prisma.maintenanceRequest.count({
      where: {
        ...maintenanceWhere,
        status: { in: ['approved', 'technician_assigned', 'in_progress'] },
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    // Active Bookings
    prisma.resourceBooking.count({
      where: { ...bookingWhere, status: { in: ['upcoming', 'ongoing'] } },
    }),
    // Pending Transfers
    prisma.transferRequest.count({ where: { status: 'requested' } }),
    // Overdue Returns
    prisma.allocation.count({
      where: {
        ...allocationWhere,
        status: 'active',
        expectedReturnDate: { lt: new Date() },
      },
    }),
    // Upcoming Returns (next 7 days)
    prisma.allocation.count({
      where: {
        ...allocationWhere,
        status: 'active',
        expectedReturnDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    overdueReturns,
    upcomingReturns,
  };
};

/**
 * Booking usage heatmap — peak calendar usage windows.
 */
export const getHeatmaps = async () => {
  const bookings = await prisma.resourceBooking.findMany({
    where: { status: { in: ['upcoming', 'ongoing', 'completed'] } },
    select: {
      startTime: true,
      endTime: true,
      assetId: true,
    },
  });

  // Build heatmap: hour-of-day × day-of-week
  const heatmap = {};
  for (let day = 0; day < 7; day++) {
    heatmap[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      heatmap[day][hour] = 0;
    }
  }

  bookings.forEach((booking) => {
    const start = new Date(booking.startTime);
    const day = start.getDay();
    const hour = start.getHours();
    heatmap[day][hour]++;
  });

  return heatmap;
};

/**
 * Asset utilization trends.
 */
export const getUtilization = async () => {
  const assets = await prisma.asset.findMany({
    select: {
      id: true,
      name: true,
      assetTag: true,
      status: true,
      _count: {
        select: {
          allocations: true,
          bookings: true,
          maintenanceRequests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assets;
};

/**
 * Maintenance frequency by asset/category.
 */
export const getMaintenanceFrequency = async () => {
  const categories = await prisma.assetCategory.findMany({
    select: {
      id: true,
      name: true,
      assets: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          _count: { select: { maintenanceRequests: true } },
        },
      },
    },
  });

  return categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    totalMaintenanceRequests: cat.assets.reduce(
      (sum, asset) => sum + asset._count.maintenanceRequests,
      0
    ),
    assets: cat.assets
      .filter((a) => a._count.maintenanceRequests > 0)
      .sort((a, b) => b._count.maintenanceRequests - a._count.maintenanceRequests),
  }));
};

/**
 * Department-wise allocation summary.
 */
export const getDepartmentSummary = async () => {
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      _count: { select: { users: true } },
      allocations: {
        where: { status: 'active' },
        select: { id: true },
      },
    },
  });

  return departments.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    departmentCode: dept.code,
    employeeCount: dept._count.users,
    activeAllocations: dept.allocations.length,
  }));
};

/**
 * Full activity log — admin only.
 */
export const getActivityLogs = async (query) => {
  const where = {};

  if (query.userId) where.userId = parseInt(query.userId);
  if (query.entityType) where.entityType = query.entityType;
  if (query.action) where.action = { contains: query.action, mode: 'insensitive' };

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = new Date(query.startDate);
    if (query.endDate) where.createdAt.lte = new Date(query.endDate);
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(query.limit) || 100,
    skip: parseInt(query.offset) || 0,
  });

  const total = await prisma.activityLog.count({ where });

  return { logs, total };
};
