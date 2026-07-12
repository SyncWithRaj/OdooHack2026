// API and State Manager for AssetFlow
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// --- MOCK DATABASE (Initial state matching Prisma Schema) ---
const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Engineering', code: 'ENG', status: 'active', parentId: null, departmentHeadId: 3 },
  { id: 2, name: 'Marketing & Sales', code: 'MKT', status: 'active', parentId: null, departmentHeadId: 4 },
  { id: 3, name: 'Operations', code: 'OPS', status: 'active', parentId: null, departmentHeadId: 5 },
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Admin User', email: 'admin@assetflow.com', role: 'admin', departmentId: 1, status: 'active' },
  { id: 2, name: 'Manager User', email: 'manager@assetflow.com', role: 'asset_manager', departmentId: 1, status: 'active' },
  { id: 3, name: 'Engineering Head', email: 'enghead@assetflow.com', role: 'department_head', departmentId: 1, status: 'active' },
  { id: 4, name: 'Marketing Head', email: 'mkthead@assetflow.com', role: 'department_head', departmentId: 2, status: 'active' },
  { id: 5, name: 'Ops Head', email: 'opshead@assetflow.com', role: 'department_head', departmentId: 3, status: 'active' },
  { id: 6, name: 'Regular Employee', email: 'employee@assetflow.com', role: 'employee', departmentId: 1, status: 'active' },
];

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Laptops', description: 'Company workstations and developer notebooks', metadataSchema: { ram_gb: 16, storage_gb: 512 } },
  { id: 2, name: 'Furniture', description: 'Office chairs, standing desks', metadataSchema: { material: 'wood' } },
  { id: 3, name: 'Shared Spaces', description: 'Conference rooms, call booths', metadataSchema: { capacity: 10 } },
  { id: 4, name: 'Vehicles', description: 'Delivery vans, company cars', metadataSchema: { model_year: 2024 } },
];

const INITIAL_ASSETS = [
  { id: 1, name: 'MacBook Pro M3 Max', categoryId: 1, assetTag: 'AF-0001', serialNumber: 'SN-MBP30948', acquisitionDate: '2024-01-15', acquisitionCost: 3599.00, condition: 'New', location: 'HQ - 3rd Floor', isBookable: false, status: 'allocated' },
  { id: 2, name: 'Dell XPS 15', categoryId: 1, assetTag: 'AF-0002', serialNumber: 'SN-DELL8271', acquisitionDate: '2024-02-10', acquisitionCost: 1899.00, condition: 'Good', location: 'HQ - 3rd Floor', isBookable: false, status: 'available' },
  { id: 3, name: 'Ergonomic Task Chair', categoryId: 2, assetTag: 'AF-0003', serialNumber: 'SN-HERMAN-81', acquisitionDate: '2023-11-01', acquisitionCost: 750.00, condition: 'Good', location: 'Meeting Room Alpha', isBookable: false, status: 'available' },
  { id: 4, name: 'Conference Room Alpha', categoryId: 3, assetTag: 'AF-0004', serialNumber: 'RM-ALPHA', acquisitionDate: '2023-05-01', acquisitionCost: 5000.00, condition: 'Excellent', location: 'HQ - 1st Floor', isBookable: true, status: 'available' },
  { id: 5, name: 'Projector Epson X39', categoryId: 1, assetTag: 'AF-0005', serialNumber: 'SN-EPSON-492', acquisitionDate: '2023-08-20', acquisitionCost: 650.00, condition: 'Fair', location: 'Training Room B', isBookable: true, status: 'under_maintenance' },
  { id: 6, name: 'Huddle Room Beta', categoryId: 3, assetTag: 'AF-0006', serialNumber: 'RM-BETA', acquisitionDate: '2023-05-01', acquisitionCost: 3000.00, condition: 'Good', location: 'HQ - 1st Floor', isBookable: true, status: 'available' },
];

const INITIAL_ALLOCATIONS = [
  { id: 1, assetId: 1, assignedToUserId: 6, assignedToDeptId: null, allocatedById: 2, expectedReturnDate: '2026-12-31', allocatedAt: '2024-01-20T10:00:00Z', returnedAt: null, checkInNotes: null, status: 'active' },
];

const INITIAL_TRANSFERS = [
  { id: 1, assetId: 1, currentAllocationId: 1, requestedByUserId: 6, targetUserId: 3, targetDeptId: null, status: 'requested', approvedById: null, rejectionReason: null, createdAt: '2026-07-10T14:30:00Z' },
];

const INITIAL_BOOKINGS = [
  { id: 1, assetId: 4, resourceId: 4, bookedBy: 'Engineering Head', userId: 3, startTime: '2026-07-15T09:00:00.000Z', endTime: '2026-07-15T11:00:00.000Z', status: 'upcoming', createdAt: '2026-07-11T12:00:00Z' },
];

const INITIAL_MAINTENANCE = [
  { id: 1, assetId: 5, raisedById: 6, description: 'Lamp light flickering and color distortion', priority: 'high', status: 'pending', technicianName: null, resolutionNotes: null, resolvedAt: null, createdAt: '2026-07-12T09:00:00Z' },
];

const INITIAL_AUDITS = [
  { id: 1, title: 'HQ Annual Q3 Verification', scopeType: 'location', scopeDepartmentId: null, scopeLocation: 'HQ - 3rd Floor', startDate: '2026-07-01', endDate: '2026-07-20', status: 'open', createdById: 1, createdAt: '2026-07-01T08:00:00Z' },
];

const INITIAL_AUDIT_ITEMS = [
  { id: 1, auditCycleId: 1, assetId: 1, status: 'unverified', notes: null, verifiedById: null, verifiedAt: null },
  { id: 2, auditCycleId: 1, assetId: 2, status: 'verified', notes: 'Verified in cabinet A', verifiedById: 2, verifiedAt: '2026-07-05T14:00:00Z' },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, userId: 1, title: 'Pending Role Promotion', message: 'Employee Raj has signed up and is waiting for role allocation.', type: 'role_request', isRead: false, createdAt: '2026-07-12T10:00:00Z' },
  { id: 2, userId: 6, title: 'Transfer Requested', message: 'Transfer request submitted for MacBook Pro M3 Max.', type: 'transfer_request', isRead: false, createdAt: '2026-07-10T14:30:00Z' },
];

const INITIAL_LOGS = [
  { id: 1, userId: 1, action: 'User logged in', entityType: 'auth', entityId: 1, details: { ip: '127.0.0.1' }, createdAt: '2026-07-12T10:00:00Z' },
  { id: 2, userId: 2, action: 'Asset registered', entityType: 'asset', entityId: 1, details: { tag: 'AF-0001' }, createdAt: '2024-01-15T09:30:00Z' },
];

// Initialize Mock DB in localStorage
const initMockDB = () => {
  if (typeof window === 'undefined') return;
  const setIfEmpty = (key, initial) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initial));
    }
  };
  setIfEmpty('af_departments', INITIAL_DEPARTMENTS);
  setIfEmpty('af_employees', INITIAL_EMPLOYEES);
  setIfEmpty('af_categories', INITIAL_CATEGORIES);
  setIfEmpty('af_assets', INITIAL_ASSETS);
  setIfEmpty('af_allocations', INITIAL_ALLOCATIONS);
  setIfEmpty('af_transfers', INITIAL_TRANSFERS);
  setIfEmpty('af_bookings', INITIAL_BOOKINGS);
  setIfEmpty('af_maintenance', INITIAL_MAINTENANCE);
  setIfEmpty('af_audits', INITIAL_AUDITS);
  setIfEmpty('af_audit_items', INITIAL_AUDIT_ITEMS);
  setIfEmpty('af_notifications', INITIAL_NOTIFICATIONS);
  setIfEmpty('af_logs', INITIAL_LOGS);
};

// Helper to fetch/write mock DB
const getMockData = (key) => {
  initMockDB();
  return JSON.parse(localStorage.getItem(key));
};

const saveMockData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Generic request wrapper that falls back to Mock DB if server is down
async function apiRequest(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `API error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Backend connection failed for ${endpoint}. Using Mock Storage. Error:`, err.message);
    return handleMockFallback(endpoint, options);
  }
}

// Custom Local Storage implementation mimicking Backend API responses
function handleMockFallback(endpoint, options) {
  initMockDB();
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  // Clean endpoints: strip query parameters
  const cleanEndpoint = endpoint.split('?')[0];

  // 1. Auth Routing
  if (cleanEndpoint === '/auth/signup') {
    const employees = getMockData('af_employees');
    const existing = employees.find(e => e.email === body.email);
    if (existing) throw new Error('Email already registered');
    
    // Simulate sending OTP
    return { success: true, message: 'OTP sent to email.' };
  }

  if (cleanEndpoint === '/auth/verify-signup-otp') {
    const employees = getMockData('af_employees');
    const newUser = {
      id: employees.length + 1,
      name: body.email.split('@')[0], // placeholder
      email: body.email,
      role: 'employee',
      departmentId: null,
      status: 'active'
    };
    employees.push(newUser);
    saveMockData('af_employees', employees);
    
    // Create audit log
    addMockLog(newUser.id, 'User signed up', 'auth', newUser.id);
    
    return { user: newUser, token: 'mock-jwt-token' };
  }

  if (cleanEndpoint === '/auth/login') {
    const employees = getMockData('af_employees');
    const user = employees.find(e => e.email === body.email);
    if (!user) throw new Error('Invalid email or password');
    return { success: true, message: 'OTP sent.' };
  }

  if (cleanEndpoint === '/auth/verify-login-otp') {
    const employees = getMockData('af_employees');
    const user = employees.find(e => e.email === body.email);
    if (!user) throw new Error('Verification failed');
    return { user, token: `mock-jwt-token-${user.id}` };
  }

  if (cleanEndpoint === '/auth/me') {
    const token = localStorage.getItem('token');
    const userId = token ? parseInt(token.split('-').pop()) : 1; // fallback to admin
    const employees = getMockData('af_employees');
    const user = employees.find(e => e.id === userId) || employees[0];
    const depts = getMockData('af_departments');
    const userDept = depts.find(d => d.id === user.departmentId);
    return { ...user, department: userDept };
  }

  // 2. Employees Routing
  if (cleanEndpoint === '/employees') {
    const employees = getMockData('af_employees');
    const depts = getMockData('af_departments');
    return employees.map(e => ({
      ...e,
      department: depts.find(d => d.id === e.departmentId)
    }));
  }

  if (cleanEndpoint.startsWith('/employees/') && cleanEndpoint.endsWith('/role')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const employees = getMockData('af_employees');
    const empIdx = employees.findIndex(e => e.id === id);
    if (empIdx !== -1) {
      employees[empIdx].role = body.role;
      saveMockData('af_employees', employees);
      addMockLog(1, `Promoted employee ${employees[empIdx].name} to ${body.role}`, 'employee', id);
      return employees[empIdx];
    }
    throw new Error('Employee not found');
  }

  if (cleanEndpoint.startsWith('/employees/')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const employees = getMockData('af_employees');
    const empIdx = employees.findIndex(e => e.id === id);
    if (empIdx !== -1) {
      employees[empIdx] = { ...employees[empIdx], ...body };
      saveMockData('af_employees', employees);
      return employees[empIdx];
    }
    throw new Error('Employee not found');
  }

  // 3. Departments Routing
  if (cleanEndpoint === '/departments') {
    const depts = getMockData('af_departments');
    const employees = getMockData('af_employees');
    return depts.map(d => ({
      ...d,
      head: employees.find(e => e.id === d.departmentHeadId)
    }));
  }

  if (cleanEndpoint === '/departments' && method === 'POST') {
    const depts = getMockData('af_departments');
    const newDept = {
      id: depts.length + 1,
      name: body.name,
      code: body.code,
      parentId: body.parentId || null,
      departmentHeadId: body.departmentHeadId || null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    depts.push(newDept);
    saveMockData('af_departments', depts);
    addMockLog(1, `Created department ${body.name}`, 'department', newDept.id);
    return newDept;
  }

  if (cleanEndpoint.startsWith('/departments/')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const depts = getMockData('af_departments');
    const deptIdx = depts.findIndex(d => d.id === id);
    if (deptIdx !== -1) {
      depts[deptIdx] = { ...depts[deptIdx], ...body };
      saveMockData('af_departments', depts);
      return depts[deptIdx];
    }
  }

  // 4. Categories Routing
  if (cleanEndpoint === '/categories') {
    return getMockData('af_categories');
  }

  if (cleanEndpoint === '/categories' && method === 'POST') {
    const cats = getMockData('af_categories');
    const newCat = {
      id: cats.length + 1,
      name: body.name,
      description: body.description,
      metadataSchema: body.metadataSchema || {}
    };
    cats.push(newCat);
    saveMockData('af_categories', cats);
    addMockLog(1, `Created asset category ${body.name}`, 'category', newCat.id);
    return newCat;
  }

  // 5. Assets Routing
  if (cleanEndpoint === '/assets') {
    const assets = getMockData('af_assets');
    const cats = getMockData('af_categories');
    return assets.map(a => ({
      ...a,
      category: cats.find(c => c.id === a.categoryId)
    }));
  }

  if (cleanEndpoint === '/assets' && method === 'POST') {
    const assets = getMockData('af_assets');
    const newAsset = {
      id: assets.length + 1,
      name: body.name,
      categoryId: parseInt(body.categoryId),
      assetTag: `AF-${(assets.length + 1).toString().padStart(4, '0')}`,
      serialNumber: body.serialNumber || `SN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'available',
      condition: body.condition || 'New',
      location: body.location || 'HQ',
      acquisitionDate: body.acquisitionDate || new Date().toISOString().split('T')[0],
      acquisitionCost: parseFloat(body.acquisitionCost || 0),
      isBookable: body.isBookable || false,
      photoUrl: body.photoUrl || null,
      documents: body.documents || {}
    };
    assets.push(newAsset);
    saveMockData('af_assets', assets);
    addMockLog(1, `Registered asset ${newAsset.name} (${newAsset.assetTag})`, 'asset', newAsset.id);
    return newAsset;
  }

  if (cleanEndpoint.startsWith('/assets/')) {
    const parts = cleanEndpoint.split('/');
    const id = parseInt(parts[2]);
    const assets = getMockData('af_assets');
    const asset = assets.find(a => a.id === id);

    if (parts.length === 4 && parts[3] === 'history') {
      // Return history merge of Allocations + Maintenance
      const allocs = getMockData('af_allocations').filter(a => a.assetId === id);
      const maints = getMockData('af_maintenance').filter(m => m.assetId === id);
      const employees = getMockData('af_employees');

      const history = [];
      allocs.forEach(a => {
        const emp = employees.find(e => e.id === a.assignedToUserId);
        history.push({
          id: `alloc-${a.id}`,
          type: 'allocation',
          title: `Allocated to ${emp?.name || 'Department'}`,
          description: a.returnedAt ? 'Returned' : 'Currently active',
          actor: 'Asset Manager',
          timestamp: a.allocationDate
        });
        if (a.returnedAt) {
          history.push({
            id: `ret-${a.id}`,
            type: 'return',
            title: `Returned to Inventory`,
            description: a.returnConditionNotes || 'No notes',
            actor: 'Asset Manager',
            timestamp: a.returnedAt
          });
        }
      });
      maints.forEach(m => {
        history.push({
          id: `maint-${m.id}`,
          type: 'maintenance',
          title: `Maintenance: ${m.status.replace('_', ' ').toUpperCase()}`,
          description: m.description,
          actor: m.technicianName || 'Technician',
          timestamp: m.createdAt
        });
      });
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (method === 'PATCH') {
      const assetIdx = assets.findIndex(a => a.id === id);
      if (assetIdx !== -1) {
        assets[assetIdx] = { ...assets[assetIdx], ...body };
        saveMockData('af_assets', assets);
        return assets[assetIdx];
      }
    }

    return asset;
  }

  // 6. Allocations Routing
  if (cleanEndpoint === '/allocations') {
    const allocs = getMockData('af_allocations');
    const assets = getMockData('af_assets');
    const employees = getMockData('af_employees');
    return allocs.map(al => ({
      ...al,
      asset: assets.find(a => a.id === al.assetId),
      assignedToUser: employees.find(e => e.id === al.assignedToUserId)
    }));
  }

  if (cleanEndpoint === '/allocations' && method === 'POST') {
    const allocs = getMockData('af_allocations');
    const assets = getMockData('af_assets');
    const newAlloc = {
      id: allocs.length + 1,
      assetId: parseInt(body.assetId),
      assignedToUserId: body.assignedToUserId ? parseInt(body.assignedToUserId) : null,
      assignedToDeptId: body.assignedToDeptId ? parseInt(body.assignedToDeptId) : null,
      allocatedById: 1,
      allocationDate: new Date().toISOString(),
      expectedReturnDate: body.expectedReturnDate || null,
      status: 'active'
    };
    allocs.push(newAlloc);
    saveMockData('af_allocations', allocs);

    // Update asset status
    const assetIdx = assets.findIndex(a => a.id === newAlloc.assetId);
    if (assetIdx !== -1) {
      assets[assetIdx].status = 'allocated';
      saveMockData('af_assets', assets);
    }

    addMockLog(1, `Allocated asset ID ${body.assetId} to user ${body.assignedToUserId}`, 'allocation', newAlloc.id);
    return newAlloc;
  }

  if (cleanEndpoint.startsWith('/allocations/') && cleanEndpoint.endsWith('/return')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const allocs = getMockData('af_allocations');
    const assets = getMockData('af_assets');
    const allocIdx = allocs.findIndex(a => a.id === id);

    if (allocIdx !== -1) {
      allocs[allocIdx].status = 'returned';
      allocs[allocIdx].returnedAt = new Date().toISOString();
      allocs[allocIdx].returnConditionNotes = body.returnConditionNotes || 'Returned in good condition';
      saveMockData('af_allocations', allocs);

      // Re-avail asset
      const assetIdx = assets.findIndex(a => a.id === allocs[allocIdx].assetId);
      if (assetIdx !== -1) {
        assets[assetIdx].status = 'available';
        if (body.condition) assets[assetIdx].condition = body.condition;
        saveMockData('af_assets', assets);
      }
      return allocs[allocIdx];
    }
  }

  if (cleanEndpoint.startsWith('/allocations/') && cleanEndpoint.endsWith('/transfer')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const transfers = getMockData('af_transfers');
    const allocs = getMockData('af_allocations');
    const alloc = allocs.find(a => a.id === id);

    const newTransfer = {
      id: transfers.length + 1,
      assetId: alloc.assetId,
      currentAllocationId: id,
      requestedByUserId: 6, // current user fallback
      targetUserId: body.targetUserId ? parseInt(body.targetUserId) : null,
      targetDeptId: body.targetDeptId ? parseInt(body.targetDeptId) : null,
      status: 'requested',
      createdAt: new Date().toISOString()
    };
    transfers.push(newTransfer);
    saveMockData('af_transfers', transfers);
    return newTransfer;
  }

  // 7. Transfers Routing
  if (cleanEndpoint === '/transfers') {
    const transfers = getMockData('af_transfers');
    const assets = getMockData('af_assets');
    const employees = getMockData('af_employees');
    return transfers.map(t => ({
      ...t,
      asset: assets.find(a => a.id === t.assetId),
      requestedBy: employees.find(e => e.id === t.requestedByUserId),
      targetUser: employees.find(e => e.id === t.targetUserId)
    }));
  }

  if (cleanEndpoint.startsWith('/transfers/') && cleanEndpoint.endsWith('/approve')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const transfers = getMockData('af_transfers');
    const allocs = getMockData('af_allocations');
    const assets = getMockData('af_assets');
    const transIdx = transfers.findIndex(t => t.id === id);

    if (transIdx !== -1) {
      transfers[transIdx].status = 'approved';
      transfers[transIdx].approvedById = 1;
      saveMockData('af_transfers', transfers);

      // Close current allocation
      const currAllocId = transfers[transIdx].currentAllocationId;
      const allocIdx = allocs.findIndex(a => a.id === currAllocId);
      if (allocIdx !== -1) {
        allocs[allocIdx].status = 'returned';
        allocs[allocIdx].returnedAt = new Date().toISOString();
        allocs[allocIdx].returnConditionNotes = 'Closed via approved transfer';
      }

      // Create new allocation
      const newAlloc = {
        id: allocs.length + 1,
        assetId: transfers[transIdx].assetId,
        assignedToUserId: transfers[transIdx].targetUserId,
        assignedToDeptId: transfers[transIdx].targetDeptId,
        allocatedById: 1,
        allocationDate: new Date().toISOString(),
        status: 'active'
      };
      allocs.push(newAlloc);
      saveMockData('af_allocations', allocs);

      // Re-allocate log
      addMockLog(1, `Approved transfer request ID ${id} for asset ${transfers[transIdx].assetId}`, 'transfer', id);
      return transfers[transIdx];
    }
  }

  if (cleanEndpoint.startsWith('/transfers/') && cleanEndpoint.endsWith('/reject')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const transfers = getMockData('af_transfers');
    const transIdx = transfers.findIndex(t => t.id === id);
    if (transIdx !== -1) {
      transfers[transIdx].status = 'rejected';
      transfers[transIdx].rejectionReason = body.rejectionReason || 'Rejected by Admin';
      saveMockData('af_transfers', transfers);
      return transfers[transIdx];
    }
  }

  // 8. Bookings Routing
  if (cleanEndpoint === '/bookings') {
    const bookings = getMockData('af_bookings');
    const assets = getMockData('af_assets');
    const employees = getMockData('af_employees');
    return bookings.map(b => ({
      ...b,
      asset: assets.find(a => a.id === b.assetId),
      user: employees.find(e => e.id === b.userId)
    }));
  }

  if (cleanEndpoint === '/bookings' && method === 'POST') {
    const bookings = getMockData('af_bookings');
    const assets = getMockData('af_assets');
    
    // Validate overlap
    const newStart = new Date(body.startTime);
    const newEnd = new Date(body.endTime);
    
    const overlap = bookings.find(b => {
      if (b.assetId !== parseInt(body.assetId)) return false;
      if (b.status === 'cancelled') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return newStart < bEnd && newEnd > bStart;
    });

    if (overlap) {
      throw new Error('Resource is already booked during this time slot.');
    }

    const newBooking = {
      id: bookings.length + 1,
      assetId: parseInt(body.assetId),
      userId: 6, // current employee fallback
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'upcoming',
      createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    saveMockData('af_bookings', bookings);

    // Update asset status if needed
    const assetIdx = assets.findIndex(a => a.id === newBooking.assetId);
    if (assetIdx !== -1) {
      assets[assetIdx].status = 'reserved';
      saveMockData('af_assets', assets);
    }

    return newBooking;
  }

  if (cleanEndpoint.startsWith('/bookings/') && cleanEndpoint.endsWith('/cancel')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const bookings = getMockData('af_bookings');
    const assets = getMockData('af_assets');
    const bookIdx = bookings.findIndex(b => b.id === id);

    if (bookIdx !== -1) {
      bookings[bookIdx].status = 'cancelled';
      saveMockData('af_bookings', bookings);

      // Re-avail asset status
      const assetIdx = assets.findIndex(a => a.id === bookings[bookIdx].assetId);
      if (assetIdx !== -1) {
        assets[assetIdx].status = 'available';
        saveMockData('af_assets', assets);
      }
      return bookings[bookIdx];
    }
  }

  // 9. Maintenance Routing
  if (cleanEndpoint === '/maintenance') {
    const maintenance = getMockData('af_maintenance');
    const assets = getMockData('af_assets');
    const employees = getMockData('af_employees');
    return maintenance.map(m => ({
      ...m,
      asset: assets.find(a => a.id === m.assetId),
      raisedBy: employees.find(e => e.id === m.raisedById)
    }));
  }

  if (cleanEndpoint === '/maintenance' && method === 'POST') {
    const maints = getMockData('af_maintenance');
    const newMaint = {
      id: maints.length + 1,
      assetId: parseInt(body.assetId),
      raisedById: 6, // employee fallback
      description: body.description,
      priority: body.priority || 'medium',
      status: 'pending',
      technicianName: null,
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: new Date().toISOString()
    };
    maints.push(newMaint);
    saveMockData('af_maintenance', maints);
    return newMaint;
  }

  if (cleanEndpoint.startsWith('/maintenance/') && cleanEndpoint.endsWith('/status')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const maints = getMockData('af_maintenance');
    const assets = getMockData('af_assets');
    const maintIdx = maints.findIndex(m => m.id === id);

    if (maintIdx !== -1) {
      maints[maintIdx].status = body.status;
      if (body.technicianName) maints[maintIdx].technicianName = body.technicianName;
      saveMockData('af_maintenance', maints);

      // Trigger asset under_maintenance exactly on APPROVED
      if (body.status === 'approved' || body.status === 'in_progress' || body.status === 'technician_assigned') {
        const assetIdx = assets.findIndex(a => a.id === maints[maintIdx].assetId);
        if (assetIdx !== -1) {
          assets[assetIdx].status = 'under_maintenance';
          saveMockData('af_assets', assets);
        }
      }
      return maints[maintIdx];
    }
  }

  if (cleanEndpoint.startsWith('/maintenance/') && cleanEndpoint.endsWith('/resolve')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const maints = getMockData('af_maintenance');
    const assets = getMockData('af_assets');
    const maintIdx = maints.findIndex(m => m.id === id);

    if (maintIdx !== -1) {
      maints[maintIdx].status = 'resolved';
      maints[maintIdx].resolutionNotes = body.resolutionNotes || 'Resolved successfully';
      maints[maintIdx].resolvedAt = new Date().toISOString();
      saveMockData('af_maintenance', maints);

      // Re-avail asset exactly on RESOLVED
      const assetIdx = assets.findIndex(a => a.id === maints[maintIdx].assetId);
      if (assetIdx !== -1) {
        assets[assetIdx].status = 'available';
        saveMockData('af_assets', assets);
      }
      return maints[maintIdx];
    }
  }

  // 10. Audits Routing
  if (cleanEndpoint === '/audits') {
    return getMockData('af_audits');
  }

  if (cleanEndpoint === '/audits' && method === 'POST') {
    const audits = getMockData('af_audits');
    const items = getMockData('af_audit_items');
    const assets = getMockData('af_assets');

    const newAudit = {
      id: audits.length + 1,
      title: body.title,
      scopeType: body.scopeType || 'location',
      scopeDepartmentId: body.scopeDepartmentId ? parseInt(body.scopeDepartmentId) : null,
      scopeLocation: body.scopeLocation || null,
      startDate: body.startDate,
      endDate: body.endDate,
      status: 'open',
      createdById: 1,
      createdAt: new Date().toISOString()
    };
    audits.push(newAudit);
    saveMockData('af_audits', audits);

    // Pre-populate items in scope
    const scopedAssets = assets.filter(a => {
      if (newAudit.scopeLocation && a.location !== newAudit.scopeLocation) return false;
      return true;
    });

    scopedAssets.forEach(a => {
      items.push({
        id: items.length + 1,
        auditCycleId: newAudit.id,
        assetId: a.id,
        status: 'unverified',
        notes: null,
        verifiedById: null,
        verifiedAt: null
      });
    });
    saveMockData('af_audit_items', items);
    return newAudit;
  }

  if (cleanEndpoint.startsWith('/audits/items/')) {
    const itemId = parseInt(cleanEndpoint.split('/')[3]);
    const items = getMockData('af_audit_items');
    const assets = getMockData('af_assets');
    const itemIdx = items.findIndex(it => it.id === itemId);

    if (itemIdx !== -1) {
      items[itemIdx].status = body.status; // verified, missing, damaged
      items[itemIdx].notes = body.conditionNotes || '';
      items[itemIdx].verifiedById = 2;
      items[itemIdx].verifiedAt = new Date().toISOString();
      saveMockData('af_audit_items', items);

      // Dynamic condition sync to asset registry
      if (body.status === 'damaged') {
        const assetIdx = assets.findIndex(a => a.id === items[itemIdx].assetId);
        if (assetIdx !== -1) {
          assets[assetIdx].condition = 'Damaged';
          saveMockData('af_assets', assets);
        }
      }
      return items[itemIdx];
    }
  }

  if (cleanEndpoint.startsWith('/audits/') && cleanEndpoint.endsWith('/close')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const audits = getMockData('af_audits');
    const items = getMockData('af_audit_items').filter(it => it.auditCycleId === id);
    const assets = getMockData('af_assets');
    const auditIdx = audits.findIndex(au => au.id === id);

    if (auditIdx !== -1) {
      audits[auditIdx].status = 'closed';
      saveMockData('af_audits', audits);

      // Rule: any MISSING audit items cascade the linked asset to LOST status
      items.forEach(item => {
        if (item.status === 'missing') {
          const assetIdx = assets.findIndex(a => a.id === item.assetId);
          if (assetIdx !== -1) {
            assets[assetIdx].status = 'lost';
          }
        }
      });
      saveMockData('af_assets', assets);
      return audits[auditIdx];
    }
  }

  if (cleanEndpoint.startsWith('/audits/')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const audits = getMockData('af_audits');
    const items = getMockData('af_audit_items').filter(it => it.auditCycleId === id);
    const assets = getMockData('af_assets');
    
    const audit = audits.find(au => au.id === id);
    if (!audit) throw new Error('Audit cycle not found');

    const enrichedItems = items.map(item => ({
      ...item,
      asset: assets.find(a => a.id === item.assetId)
    }));

    return { ...audit, items: enrichedItems };
  }

  // 11. Analytics Routing
  if (cleanEndpoint === '/analytics/kpis') {
    const assets = getMockData('af_assets');
    const maints = getMockData('af_maintenance');
    const bookings = getMockData('af_bookings');
    const transfers = getMockData('af_transfers');
    const allocs = getMockData('af_allocations');

    const available = assets.filter(a => a.status === 'available').length;
    const allocated = assets.filter(a => a.status === 'allocated').length;
    const maintenanceToday = maints.filter(m => m.status === 'pending').length;
    const activeBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing').length;
    const pendingTransfers = transfers.filter(t => t.status === 'requested').length;

    // Overdue returns calculation (allocations active and past expected return date)
    const now = new Date();
    const overdueReturns = allocs.filter(al => {
      if (al.status !== 'active' || !al.expectedReturnDate) return false;
      return new Date(al.expectedReturnDate) < now;
    }).length;

    return {
      available,
      allocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      overdueReturns
    };
  }

  if (cleanEndpoint === '/analytics/heatmaps') {
    // Return dummy booking heatmaps
    return [
      { name: 'Monday', 'Room Alpha': 4, 'Lab B': 2 },
      { name: 'Tuesday', 'Room Alpha': 6, 'Lab B': 5 },
      { name: 'Wednesday', 'Room Alpha': 8, 'Lab B': 7 },
      { name: 'Thursday', 'Room Alpha': 5, 'Lab B': 6 },
      { name: 'Friday', 'Room Alpha': 3, 'Lab B': 2 },
    ];
  }

  if (cleanEndpoint === '/analytics/logs') {
    return getMockData('af_logs');
  }

  // 12. Notifications Routing
  if (cleanEndpoint === '/notifications') {
    return getMockData('af_notifications');
  }

  if (cleanEndpoint.startsWith('/notifications/') && cleanEndpoint.endsWith('/read')) {
    const id = parseInt(cleanEndpoint.split('/')[2]);
    const notifications = getMockData('af_notifications');
    const notIdx = notifications.findIndex(n => n.id === id);
    if (notIdx !== -1) {
      notifications[notIdx].isRead = true;
      saveMockData('af_notifications', notifications);
      return notifications[notIdx];
    }
  }

  if (cleanEndpoint === '/notifications/read-all') {
    const notifications = getMockData('af_notifications');
    notifications.forEach(n => n.isRead = true);
    saveMockData('af_notifications', notifications);
    return { success: true };
  }

  return { success: true };
}

// Helper to push to activities append-only log
function addMockLog(userId, action, entityType, entityId) {
  const logs = getMockData('af_logs') || [];
  logs.push({
    id: logs.length + 1,
    userId,
    action,
    entityType,
    entityId,
    details: {},
    createdAt: new Date().toISOString()
  });
  saveMockData('af_logs', logs);
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
