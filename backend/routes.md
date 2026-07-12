# AssetFlow API Routes Documentation

This document outlines all the available API endpoints for the AssetFlow backend, categorized by their modules.

Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Create employee account (sends OTP) | ❌ |
| `POST` | `/auth/verify-signup-otp` | Verify signup OTP & get token | ❌ |
| `POST` | `/auth/resend-otp` | Resend verification OTP | ❌ |
| `POST` | `/auth/login` | Login with email/pass (sends OTP) | ❌ |
| `POST` | `/auth/verify-login-otp`| Verify login OTP & get token | ❌ |
| `GET` | `/auth/me` | Get current logged-in user profile | ✅ |
| `POST` | `/auth/forgot-password` | Send password reset OTP | ❌ |
| `POST` | `/auth/verify-reset-otp` | Verify password reset OTP | ❌ |
| `POST` | `/auth/reset-password` | Set new password with OTP | ❌ |

**Example: Signup Flow**
```json
// 1. POST /auth/signup
{
  "name": "Raj",
  "email": "raj@example.com",
  "password": "Password@123"
}

// 2. POST /auth/verify-signup-otp
{
  "email": "raj@example.com",
  "otp": "123456"
}
// Returns: { "user": {...}, "token": "eyJhb..." }
```

---

## 2. Employees (`/employees`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/employees` | List all employees | ✅ (Admin, Asset Mgr) |
| `PATCH` | `/employees/:id/role` | Promote/Demote employee role | ✅ (Admin) |
| `PATCH` | `/employees/:id` | Update employee dept/status | ✅ (Admin) |

**Example: Role Promotion**
```json
// PATCH /employees/5/role
{
  "role": "asset_manager" // allowed: employee, department_head, asset_manager, admin
}
```

---

## 3. Departments (`/departments`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/departments` | List all departments | ✅ (All) |
| `POST` | `/departments` | Create new department | ✅ (Admin) |
| `PATCH` | `/departments/:id` | Update department details | ✅ (Admin) |

**Example: Create Department**
```json
// POST /departments
{
  "name": "Engineering",
  "code": "ENG"
}
```

---

## 4. Categories (`/categories`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | List all asset categories | ✅ (All) |
| `POST` | `/categories` | Create new category | ✅ (Admin) |
| `PATCH` | `/categories/:id` | Update category details | ✅ (Admin) |

**Example: Create Category**
```json
// POST /categories
{
  "name": "Laptops",
  "description": "Company laptops",
  "metadataSchema": { "brand": "", "ram_gb": 0 }
}
```

---

## 5. Assets (`/assets`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/assets` | List all assets (supports filters) | ✅ (All) |
| `GET` | `/assets/:id` | Get single asset details | ✅ (All) |
| `POST` | `/assets` | Register a new asset | ✅ (Admin, Asset Mgr) |
| `PATCH` | `/assets/:id` | Update asset details | ✅ (Admin, Asset Mgr) |
| `GET` | `/assets/:id/history` | Get asset lifecycle history | ✅ (Admin, Asset Mgr) |

**Example: Register Asset**
```json
// POST /assets
{
  "name": "MacBook Pro M3",
  "categoryId": 1,
  "condition": "New",
  "location": "HQ",
  "acquisitionDate": "2024-01-01",
  "acquisitionCost": 2000
}
```

---

## 6. Allocations & Transfers (`/allocations` & `/transfers`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/allocations` | List allocations (scoped by role) | ✅ (All) |
| `POST` | `/allocations` | Allocate asset to user/dept | ✅ (Admin, Asset Mgr) |
| `POST` | `/allocations/:id/return`| Return an allocated asset | ✅ (Admin, Asset Mgr) |
| `POST` | `/allocations/:id/transfer`| Initiate transfer request | ✅ (All) |
| `GET` | `/transfers` | List transfer requests | ✅ (All) |
| `PATCH` | `/transfers/:id/approve`| Approve a transfer | ✅ (Admin, Asset Mgr, Dept Head) |
| `PATCH` | `/transfers/:id/reject` | Reject a transfer | ✅ (Admin, Asset Mgr, Dept Head) |

**Example: Allocate Asset**
```json
// POST /allocations
{
  "assetId": 15,
  "assignedToUserId": 3
}
```

---

## 7. Resource Bookings (`/bookings`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/bookings` | List bookings (scoped by role) | ✅ (All) |
| `POST` | `/bookings` | Book a bookable asset (e.g. room) | ✅ (All) |
| `PATCH` | `/bookings/:id/cancel`| Cancel a booking | ✅ (All) |

**Example: Create Booking**
```json
// POST /bookings
{
  "assetId": 12,
  "startTime": "2024-05-10T09:00:00Z",
  "endTime": "2024-05-10T11:00:00Z"
}
```

---

## 8. Maintenance (`/maintenance`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/maintenance` | List maintenance requests | ✅ (All) |
| `POST` | `/maintenance` | Raise a maintenance request | ✅ (All) |
| `PATCH` | `/maintenance/:id/status`| Update status (approve/reject)| ✅ (Admin, Asset Mgr) |
| `POST` | `/maintenance/:id/resolve`| Resolve/close maintenance | ✅ (Admin, Asset Mgr) |

**Example: Raise Request**
```json
// POST /maintenance
{
  "assetId": 5,
  "description": "Screen is flickering",
  "priority": "high"
}
```

---

## 9. Audits (`/audits`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/audits` | List audit cycles | ✅ (Admin, Asset Mgr) |
| `POST` | `/audits` | Create a new audit cycle | ✅ (Admin) |
| `GET` | `/audits/:id` | Get audit details & items | ✅ (Admin, Asset Mgr) |
| `PATCH` | `/audits/items/:itemId` | Verify an individual asset | ✅ (Admin, Asset Mgr) |
| `POST` | `/audits/:id/close` | Close audit & generate reports | ✅ (Admin) |

**Example: Verify Audit Item**
```json
// PATCH /audits/items/45
{
  "status": "verified",
  "conditionNotes": "Still in good condition"
}
```

---

## 10. Analytics & Reports (`/analytics`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/kpis` | Get high-level KPI cards | ✅ (All) |
| `GET` | `/analytics/heatmaps`| Get asset utilization heatmaps | ✅ (Admin, Asset Mgr) |
| `GET` | `/analytics/logs` | Get activity/audit logs | ✅ (Admin) |

---

## 11. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required (Role) |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get user's notifications | ✅ (All) |
| `PATCH` | `/notifications/:id/read` | Mark single notification read | ✅ (All) |
| `PATCH` | `/notifications/read-all`| Mark all notifications read | ✅ (All) |
