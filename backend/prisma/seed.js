import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (order matters due to FK constraints)
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.discrepancyReport.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.resourceBooking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // ========================================================================
  // 1. DEPARTMENTS
  // ========================================================================
  const engineering = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG', status: 'active' },
  });
  const hr = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR', status: 'active' },
  });
  const finance = await prisma.department.create({
    data: { name: 'Finance', code: 'FIN', status: 'active' },
  });
  const operations = await prisma.department.create({
    data: { name: 'Operations', code: 'OPS', status: 'active' },
  });

  console.log('  ✅ Departments created');

  // ========================================================================
  // 2. USERS (1 Admin, 1 Asset Manager, 2 Dept Heads, 5 Employees)
  // ========================================================================
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Raj Admin',
      email: 'admin@assetflow.com',
      passwordHash,
      role: 'admin',
      departmentId: engineering.id,
      isEmailVerified: true,
    },
  });

  const assetManager = await prisma.user.create({
    data: {
      name: 'Priya Asset Manager',
      email: 'manager@assetflow.com',
      passwordHash,
      role: 'asset_manager',
      departmentId: operations.id,
      isEmailVerified: true,
    },
  });

  const deptHeadEng = await prisma.user.create({
    data: {
      name: 'Vikram Engineering Head',
      email: 'vikram@assetflow.com',
      passwordHash,
      role: 'department_head',
      departmentId: engineering.id,
      isEmailVerified: true,
    },
  });

  const deptHeadHR = await prisma.user.create({
    data: {
      name: 'Anita HR Head',
      email: 'anita@assetflow.com',
      passwordHash,
      role: 'department_head',
      departmentId: hr.id,
      isEmailVerified: true,
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: engineering.id,
      isEmailVerified: true,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'sneha@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: engineering.id,
      isEmailVerified: true,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: hr.id,
      isEmailVerified: true,
    },
  });

  const emp4 = await prisma.user.create({
    data: {
      name: 'Deepika Singh',
      email: 'deepika@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: finance.id,
      isEmailVerified: true,
    },
  });

  const emp5 = await prisma.user.create({
    data: {
      name: 'Karan Mehta',
      email: 'karan@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: operations.id,
      isEmailVerified: true,
    },
  });

  // Set department heads
  await prisma.department.update({
    where: { id: engineering.id },
    data: { departmentHeadId: deptHeadEng.id },
  });
  await prisma.department.update({
    where: { id: hr.id },
    data: { departmentHeadId: deptHeadHR.id },
  });

  console.log('  ✅ Users created (all passwords: Password@123)');

  // ========================================================================
  // 3. ASSET CATEGORIES
  // ========================================================================
  const electronics = await prisma.assetCategory.create({
    data: {
      name: 'Electronics',
      description: 'Laptops, monitors, phones, tablets',
      metadataSchema: { warranty_months: 24, brand: '' },
    },
  });

  const furniture = await prisma.assetCategory.create({
    data: {
      name: 'Furniture',
      description: 'Desks, chairs, cabinets',
      metadataSchema: { material: '', color: '' },
    },
  });

  const vehicles = await prisma.assetCategory.create({
    data: {
      name: 'Vehicles',
      description: 'Company cars, bikes, vans',
      metadataSchema: { registration_number: '', fuel_type: '' },
    },
  });

  const meetingRooms = await prisma.assetCategory.create({
    data: {
      name: 'Meeting Rooms',
      description: 'Conference rooms and collaboration spaces',
      metadataSchema: { capacity: 0, has_projector: false },
    },
  });

  const itEquipment = await prisma.assetCategory.create({
    data: {
      name: 'IT Equipment',
      description: 'Servers, routers, networking gear',
      metadataSchema: { rack_unit: 0, ip_address: '' },
    },
  });

  console.log('  ✅ Asset categories created');

  // ========================================================================
  // 4. ASSETS (~20 assets across categories)
  // ========================================================================
  const assets = await Promise.all([
    // Electronics
    prisma.asset.create({
      data: { name: 'MacBook Pro 16"', assetTag: 'AF-0001', serialNumber: 'MBP-2024-001', categoryId: electronics.id, condition: 'New', location: 'Floor 3, Desk 12', acquisitionDate: new Date('2024-01-15'), acquisitionCost: 2499.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'MacBook Pro 14"', assetTag: 'AF-0002', serialNumber: 'MBP-2024-002', categoryId: electronics.id, condition: 'Good', location: 'Floor 3, Desk 15', acquisitionDate: new Date('2024-02-01'), acquisitionCost: 1999.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Dell Monitor 27"', assetTag: 'AF-0003', serialNumber: 'DM-2024-001', categoryId: electronics.id, condition: 'New', location: 'Storage Room A', acquisitionDate: new Date('2024-03-10'), acquisitionCost: 449.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Dell Monitor 27"', assetTag: 'AF-0004', serialNumber: 'DM-2024-002', categoryId: electronics.id, condition: 'New', location: 'Storage Room A', acquisitionDate: new Date('2024-03-10'), acquisitionCost: 449.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'iPhone 15 Pro', assetTag: 'AF-0005', serialNumber: 'IP-2024-001', categoryId: electronics.id, condition: 'New', location: 'IT Department', acquisitionDate: new Date('2024-04-01'), acquisitionCost: 1199.99, isBookable: false },
    }),
    // Furniture
    prisma.asset.create({
      data: { name: 'Standing Desk', assetTag: 'AF-0006', serialNumber: 'SD-001', categoryId: furniture.id, condition: 'New', location: 'Floor 2', acquisitionDate: new Date('2024-01-01'), acquisitionCost: 799.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Ergonomic Chair', assetTag: 'AF-0007', serialNumber: 'EC-001', categoryId: furniture.id, condition: 'Good', location: 'Floor 2', acquisitionDate: new Date('2024-01-01'), acquisitionCost: 599.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Filing Cabinet', assetTag: 'AF-0008', serialNumber: 'FC-001', categoryId: furniture.id, condition: 'Good', location: 'HR Department', acquisitionDate: new Date('2023-06-01'), acquisitionCost: 299.99, isBookable: false },
    }),
    // Vehicles
    prisma.asset.create({
      data: { name: 'Toyota Innova', assetTag: 'AF-0009', serialNumber: 'VH-GJ01-AB-1234', categoryId: vehicles.id, condition: 'Good', location: 'Parking Lot B', acquisitionDate: new Date('2023-01-15'), acquisitionCost: 25000.00, isBookable: true },
    }),
    prisma.asset.create({
      data: { name: 'Maruti Swift', assetTag: 'AF-0010', serialNumber: 'VH-GJ01-CD-5678', categoryId: vehicles.id, condition: 'Fair', location: 'Parking Lot B', acquisitionDate: new Date('2022-06-01'), acquisitionCost: 12000.00, isBookable: true },
    }),
    // Meeting Rooms (bookable)
    prisma.asset.create({
      data: { name: 'Conference Room A - Boardroom', assetTag: 'AF-0011', categoryId: meetingRooms.id, condition: 'Excellent', location: 'Floor 4, Wing A', acquisitionDate: new Date('2023-01-01'), acquisitionCost: 5000.00, isBookable: true },
    }),
    prisma.asset.create({
      data: { name: 'Conference Room B - Innovation Hub', assetTag: 'AF-0012', categoryId: meetingRooms.id, condition: 'Good', location: 'Floor 3, Wing B', acquisitionDate: new Date('2023-01-01'), acquisitionCost: 3000.00, isBookable: true },
    }),
    prisma.asset.create({
      data: { name: 'Huddle Room 1', assetTag: 'AF-0013', categoryId: meetingRooms.id, condition: 'Good', location: 'Floor 2', acquisitionDate: new Date('2023-06-01'), acquisitionCost: 1500.00, isBookable: true },
    }),
    prisma.asset.create({
      data: { name: 'Huddle Room 2', assetTag: 'AF-0014', categoryId: meetingRooms.id, condition: 'Good', location: 'Floor 3', acquisitionDate: new Date('2023-06-01'), acquisitionCost: 1500.00, isBookable: true },
    }),
    // IT Equipment
    prisma.asset.create({
      data: { name: 'HP ProLiant Server', assetTag: 'AF-0015', serialNumber: 'SRV-001', categoryId: itEquipment.id, condition: 'Good', location: 'Server Room', acquisitionDate: new Date('2023-03-01'), acquisitionCost: 8500.00, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Cisco Switch 48-Port', assetTag: 'AF-0016', serialNumber: 'NET-001', categoryId: itEquipment.id, condition: 'Good', location: 'Server Room', acquisitionDate: new Date('2023-03-01'), acquisitionCost: 2200.00, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'UPS Battery Backup', assetTag: 'AF-0017', serialNumber: 'UPS-001', categoryId: itEquipment.id, condition: 'New', location: 'Server Room', acquisitionDate: new Date('2024-01-01'), acquisitionCost: 1200.00, isBookable: false },
    }),
    // More electronics
    prisma.asset.create({
      data: { name: 'Logitech Webcam C920', assetTag: 'AF-0018', serialNumber: 'WC-001', categoryId: electronics.id, condition: 'New', location: 'Storage Room A', acquisitionDate: new Date('2024-05-01'), acquisitionCost: 79.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Wireless Keyboard + Mouse Kit', assetTag: 'AF-0019', serialNumber: 'KB-001', categoryId: electronics.id, condition: 'New', location: 'Storage Room A', acquisitionDate: new Date('2024-05-01'), acquisitionCost: 59.99, isBookable: false },
    }),
    prisma.asset.create({
      data: { name: 'Portable Projector', assetTag: 'AF-0020', serialNumber: 'PJ-001', categoryId: electronics.id, condition: 'Good', location: 'Floor 4', acquisitionDate: new Date('2023-09-01'), acquisitionCost: 899.99, isBookable: true },
    }),
  ]);

  console.log('  ✅ 20 assets created');

  // ========================================================================
  // 5. ALLOCATIONS (some active, some returned, one overdue)
  // ========================================================================
  // Active: MacBook Pro 16" → Amit
  const alloc1 = await prisma.allocation.create({
    data: {
      assetId: assets[0].id, // MacBook Pro 16"
      assignedToUserId: emp1.id,
      allocatedById: assetManager.id,
      expectedReturnDate: new Date('2025-12-31'),
    },
  });
  await prisma.asset.update({ where: { id: assets[0].id }, data: { status: 'allocated' } });

  // Active: MacBook Pro 14" → Sneha
  const alloc2 = await prisma.allocation.create({
    data: {
      assetId: assets[1].id,
      assignedToUserId: emp2.id,
      allocatedById: assetManager.id,
      expectedReturnDate: new Date('2025-12-31'),
    },
  });
  await prisma.asset.update({ where: { id: assets[1].id }, data: { status: 'allocated' } });

  // Active: Dell Monitor → Engineering dept
  await prisma.allocation.create({
    data: {
      assetId: assets[2].id,
      assignedToDeptId: engineering.id,
      allocatedById: assetManager.id,
    },
  });
  await prisma.asset.update({ where: { id: assets[2].id }, data: { status: 'allocated' } });

  // Overdue: iPhone → Rahul (expected return was last month)
  await prisma.allocation.create({
    data: {
      assetId: assets[4].id,
      assignedToUserId: emp3.id,
      allocatedById: assetManager.id,
      expectedReturnDate: new Date('2025-06-01'), // Overdue
    },
  });
  await prisma.asset.update({ where: { id: assets[4].id }, data: { status: 'allocated' } });

  // Returned: Standing Desk was allocated to Deepika but returned
  await prisma.allocation.create({
    data: {
      assetId: assets[5].id,
      assignedToUserId: emp4.id,
      allocatedById: assetManager.id,
      status: 'returned',
      actualReturnDate: new Date('2024-11-01'),
      returnConditionNotes: 'Good condition, minor scratches on surface.',
    },
  });

  console.log('  ✅ Allocations created (including 1 overdue)');

  // ========================================================================
  // 6. BOOKINGS
  // ========================================================================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(10, 30, 0, 0);

  await prisma.resourceBooking.create({
    data: {
      assetId: assets[10].id, // Conference Room A
      userId: emp1.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: 'upcoming',
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 0, 0, 0);
  const dayAfterEnd = new Date(dayAfter);
  dayAfterEnd.setHours(15, 0, 0, 0);

  await prisma.resourceBooking.create({
    data: {
      assetId: assets[10].id, // Conference Room A
      userId: deptHeadEng.id,
      startTime: dayAfter,
      endTime: dayAfterEnd,
      status: 'upcoming',
    },
  });

  await prisma.resourceBooking.create({
    data: {
      assetId: assets[11].id, // Conference Room B
      userId: emp2.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: 'upcoming',
    },
  });

  console.log('  ✅ Bookings created');

  // ========================================================================
  // 7. MAINTENANCE REQUESTS
  // ========================================================================
  // Pending request
  await prisma.maintenanceRequest.create({
    data: {
      assetId: assets[6].id, // Ergonomic Chair
      raisedById: emp1.id,
      description: 'Chair armrest is loose and wobbles. Needs tightening or replacement.',
      priority: 'medium',
    },
  });

  // Approved & in progress
  const maintReq = await prisma.maintenanceRequest.create({
    data: {
      assetId: assets[14].id, // HP Server
      raisedById: emp5.id,
      description: 'Server fans are making unusual noise. Possible cooling issue.',
      priority: 'high',
      status: 'in_progress',
      approvedById: assetManager.id,
      technicianName: 'Suresh IT Services',
    },
  });
  await prisma.asset.update({ where: { id: assets[14].id }, data: { status: 'under_maintenance' } });

  // Resolved
  await prisma.maintenanceRequest.create({
    data: {
      assetId: assets[9].id, // Maruti Swift
      raisedById: emp5.id,
      description: 'Oil change and brake pad replacement needed.',
      priority: 'low',
      status: 'resolved',
      approvedById: assetManager.id,
      technicianName: 'AutoCare Workshop',
      resolutionNotes: 'Oil changed, brake pads replaced. Vehicle in good condition.',
      resolvedAt: new Date('2025-05-15'),
    },
  });

  console.log('  ✅ Maintenance requests created');

  // ========================================================================
  // 8. AUDIT CYCLE
  // ========================================================================
  const auditCycle = await prisma.auditCycle.create({
    data: {
      title: 'Q3 2025 IT Equipment Audit',
      scopeType: 'all',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
      createdById: admin.id,
      auditors: {
        connect: [{ id: assetManager.id }, { id: deptHeadEng.id }],
      },
    },
  });

  // Add some audit items
  const auditAssets = assets.slice(0, 8);
  for (const asset of auditAssets) {
    await prisma.auditItem.create({
      data: {
        auditCycleId: auditCycle.id,
        assetId: asset.id,
      },
    });
  }

  console.log('  ✅ Audit cycle created with items');

  // ========================================================================
  // 9. SAMPLE NOTIFICATIONS
  // ========================================================================
  await prisma.notification.createMany({
    data: [
      {
        userId: emp1.id,
        title: 'Asset Assigned',
        message: 'MacBook Pro 16" (AF-0001) has been assigned to you.',
        type: 'ASSET_ASSIGNED',
        referenceId: alloc1.id,
        referenceType: 'allocation',
      },
      {
        userId: emp2.id,
        title: 'Asset Assigned',
        message: 'MacBook Pro 14" (AF-0002) has been assigned to you.',
        type: 'ASSET_ASSIGNED',
        referenceId: alloc2.id,
        referenceType: 'allocation',
      },
      {
        userId: emp3.id,
        title: 'Overdue Return Alert',
        message: 'iPhone 15 Pro (AF-0005) is overdue for return.',
        type: 'OVERDUE_ALERT',
        referenceId: assets[4].id,
        referenceType: 'asset',
      },
      {
        userId: assetManager.id,
        title: 'Maintenance Request',
        message: 'New maintenance request for Ergonomic Chair (AF-0007).',
        type: 'MAINTENANCE_RAISED',
        referenceId: assets[6].id,
        referenceType: 'maintenance',
      },
    ],
  });

  console.log('  ✅ Notifications created');

  // ========================================================================
  // 10. ACTIVITY LOGS
  // ========================================================================
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: 'DEPARTMENT_CREATED', entityType: 'department', entityId: engineering.id, details: { name: 'Engineering' } },
      { userId: admin.id, action: 'DEPARTMENT_CREATED', entityType: 'department', entityId: hr.id, details: { name: 'Human Resources' } },
      { userId: admin.id, action: 'ROLE_PROMOTED', entityType: 'user', entityId: assetManager.id, details: { newRole: 'asset_manager' } },
      { userId: assetManager.id, action: 'ASSET_REGISTERED', entityType: 'asset', entityId: assets[0].id, details: { assetTag: 'AF-0001' } },
      { userId: assetManager.id, action: 'ASSET_ALLOCATED', entityType: 'allocation', entityId: alloc1.id, details: { assetTag: 'AF-0001', assignedTo: 'Amit Kumar' } },
    ],
  });

  console.log('  ✅ Activity logs created');
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login credentials (all passwords: Password@123):');
  console.log('   Admin:          admin@assetflow.com');
  console.log('   Asset Manager:  manager@assetflow.com');
  console.log('   Dept Head:      vikram@assetflow.com / anita@assetflow.com');
  console.log('   Employee:       amit@assetflow.com / sneha@assetflow.com / rahul@assetflow.com / deepika@assetflow.com / karan@assetflow.com');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
