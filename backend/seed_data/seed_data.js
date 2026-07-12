import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Fetch users (do not modify User table)
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.error('No users found in the database. Please create a user first.');
    return;
  }
  const adminUser = users.find(u => u.role === 'admin') || users[0];
  const normalUser = users.find(u => u.role === 'employee') || users[0];

  // 2. Departments
  const deptData = ['Engineering', 'Marketing', 'Sales', 'HR', 'IT Support', 'Finance', 'Operations'].map((name, i) => ({
    name,
    code: `DPT-${i + 100}`,
    departmentHeadId: adminUser.id,
    status: 'active'
  }));
  let depts = [];
  for (const data of deptData) {
    const d = await prisma.department.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    });
    depts.push(d);
  }
  console.log('Seeded Departments');

  // 3. AssetCategories
  const catData = ['Laptops', 'Monitors', 'Vehicles', 'Office Furniture', 'Networking Gear', 'Cameras', 'Projectors'].map(name => ({
    name,
    description: `Category for ${name}`
  }));
  let categories = [];
  for (const data of catData) {
    const c = await prisma.assetCategory.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
    categories.push(c);
  }
  console.log('Seeded Categories');

  // 4. Assets
  let assets = [];
  for (let i = 0; i < 7; i++) {
    const a = await prisma.asset.upsert({
      where: { assetTag: `TAG-${2000 + i}` },
      update: {},
      create: {
        name: `Sample Asset ${i + 1}`,
        assetTag: `TAG-${2000 + i}`,
        serialNumber: `SN-${3000 + i}`,
        categoryId: categories[i % categories.length].id,
        status: 'available',
        condition: 'Good',
        location: `Location ${i + 1}`,
        acquisitionCost: 1000 + (i * 150),
        isBookable: true
      }
    });
    assets.push(a);
  }
  console.log('Seeded Assets');

  // 5. AssetRequests
  for (let i = 0; i < 6; i++) {
    await prisma.assetRequest.create({
      data: {
        requestedByUserId: normalUser.id,
        categoryId: categories[i % categories.length].id,
        justification: `Need this for project ${i}`,
        status: 'pending_dept_head'
      }
    });
  }
  console.log('Seeded AssetRequests');

  // 6. Allocations
  let allocations = [];
  for (let i = 0; i < 6; i++) {
    const alloc = await prisma.allocation.create({
      data: {
        assetId: assets[i].id,
        assignedToUserId: normalUser.id,
        allocatedById: adminUser.id,
        status: 'active'
      }
    });
    allocations.push(alloc);
    // Update asset status
    await prisma.asset.update({ where: { id: assets[i].id }, data: { status: 'allocated' } });
  }
  console.log('Seeded Allocations');

  // 7. TransferRequests
  for (let i = 0; i < 5; i++) {
    await prisma.transferRequest.create({
      data: {
        assetId: assets[i].id,
        currentAllocationId: allocations[i].id,
        requestedByUserId: normalUser.id,
        targetUserId: adminUser.id,
        status: 'requested'
      }
    });
  }
  console.log('Seeded TransferRequests');

  // 8. ResourceBookings
  for (let i = 0; i < 5; i++) {
    const start = new Date();
    start.setDate(start.getDate() + i);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    
    await prisma.resourceBooking.create({
      data: {
        assetId: assets[i].id,
        userId: normalUser.id,
        startTime: start,
        endTime: end,
        status: 'pending'
      }
    });
  }
  console.log('Seeded ResourceBookings');

  // 9. MaintenanceRequests
  for (let i = 0; i < 6; i++) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: assets[i].id,
        raisedById: normalUser.id,
        description: `Routine checkup ${i}`,
        priority: 'medium',
        status: 'pending'
      }
    });
  }
  console.log('Seeded MaintenanceRequests');

  // 10. AuditCycles
  let auditCycles = [];
  for (let i = 0; i < 5; i++) {
    const start = new Date();
    start.setDate(start.getDate() - i * 30);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    
    const cycle = await prisma.auditCycle.create({
      data: {
        title: `Audit Q${(i % 4) + 1} 202${6 - Math.floor(i/4)}`,
        scopeType: 'department',
        scopeDepartmentId: depts[i % depts.length].id,
        startDate: start,
        endDate: end,
        status: 'open',
        createdById: adminUser.id
      }
    });
    auditCycles.push(cycle);
  }
  console.log('Seeded AuditCycles');

  // 11. AuditItems
  let auditItems = [];
  for (let i = 0; i < 7; i++) {
    const ai = await prisma.auditItem.create({
      data: {
        auditCycleId: auditCycles[i % auditCycles.length].id,
        assetId: assets[i % assets.length].id,
        status: 'unverified'
      }
    });
    auditItems.push(ai);
  }
  console.log('Seeded AuditItems');

  // 12. DiscrepancyReports
  for (let i = 0; i < 5; i++) {
    await prisma.discrepancyReport.create({
      data: {
        auditCycleId: auditCycles[i % auditCycles.length].id,
        assetId: assets[i % assets.length].id,
        expectedStatus: 'allocated',
        foundStatus: 'missing',
        details: 'Not found at desk'
      }
    });
  }
  console.log('Seeded DiscrepancyReports');

  // 13. Notifications
  const notifTypes = ['system', 'alert', 'booking', 'maintenance', 'audit'];
  for (let i = 0; i < 7; i++) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: `Test Notification ${i + 1}`,
        message: `This is an automated seed notification #${i + 1}`,
        type: notifTypes[i % notifTypes.length],
        isRead: false
      }
    });
  }
  console.log('Seeded Notifications');

  // 14. ActivityLogs
  for (let i = 0; i < 7; i++) {
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: 'CREATE',
        entityType: 'Asset',
        entityId: assets[i % assets.length].id,
        details: { note: `Seeded record ${i}` }
      }
    });
  }
  console.log('Seeded ActivityLogs');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
