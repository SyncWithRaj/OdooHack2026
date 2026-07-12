# AssetFlow - Enterprise Asset Management System (OdooHack2026)

AssetFlow is a comprehensive, full-stack Enterprise Asset Management (EAM) platform built to track, manage, and audit organizational assets. It features complex hierarchical workflows, role-based access control, and a modern frontend interface.

## Features

### 1. Role-Based Access Control (RBAC)
- **Employees**: Can view their assigned assets, request new assets, initiate transfers, and raise maintenance tickets.
- **Department Heads**: Can manage department allocations, approve/reject asset requests, and oversee department transfers.
- **Asset Managers**: Have global visibility over the asset registry, approve final transfers, manage stock, and oversee the entire lifecycle.
- **Administrators**: Full system control, role assignment, and user management.

### 2. Asset Lifecycle and Workflows
- **Asset Registry**: Track assets with auto-generated tags (AF-0001), categories, serial numbers, locations, and conditions.
- **Allocation and Transfers**: Multi-step transfer requests (Requester -> Dept Head -> Asset Manager -> Approved). 
- **Asset Requests**: Employees can request new assets with justifications, requiring departmental and managerial approval.
- **Maintenance**: Raise maintenance tickets for damaged assets, track technician assignments, and log resolutions.

### 3. Auditing and Compliance
- **Audit Cycles**: Asset Managers can spin up audit cycles scoped to specific departments or locations.
- **Discrepancy Reporting**: Automatically flags missing or damaged items during audits and generates discrepancy reports.

### 4. Communication
- **In-App Notifications**: Real-time alerts for request approvals, assignments, and audit flags.
- **Email Integration**: OTP-based authentication, password resets, and critical workflow emails.

## API Route Map

The backend is built around a modular architecture mounted at `/api/v1/`. Below is a simplified map of all active endpoints:

### Authentication and Profile (`/api/v1/auth`)
- `POST /signup` - Register a new unverified employee account
- `POST /verify-signup-otp` - Verify OTP to activate account
- `POST /login` - Login and trigger OTP verification
- `POST /verify-login-otp` - Verify login OTP and issue JWT
- `POST /forgot-password` - Request password reset OTP
- `PATCH /reset-password` - Reset forgotten password
- `PATCH /change-password` - Update current password
- `GET /me` - Get current user profile
- `PATCH /profile` - Update user profile information

### Organization Setup
- **Departments (`/api/v1/departments`)**: 
  - `GET /` (List all), `POST /` (Create), `PATCH /:id` (Update)
- **Categories (`/api/v1/categories`)**: 
  - `GET /` (List all), `POST /` (Create), `PATCH /:id` (Update)
- **Employees (`/api/v1/employees`)**: 
  - `GET /` (Directory), `PATCH /:id/role` (Promote), `PATCH /:id` (Update department/status)

### Core Asset Management
- **Assets (`/api/v1/assets`)**:
  - `GET /` (Directory with filters), `POST /` (Register asset), `GET /:id` (Asset details), `GET /:id/history` (Allocation/Maintenance logs), `PATCH /:id` (Update asset fields)
- **Asset Requests (`/api/v1/asset-requests`)**:
  - `GET /` (Scoped to role), `POST /` (Raise request), `PATCH /:id/status` (Approve/Reject)

### Workflow and Logistics
- **Allocations (`/api/v1/allocations`)**:
  - `GET /` (List scoped allocations), `POST /` (Assign asset), `PATCH /:id/return` (Check-in asset)
- **Transfers (`/api/v1/transfers`)**:
  - `GET /` (List scoped transfers), `POST /` (Initiate transfer from allocation), `PATCH /:id/approve` (Approve transfer), `PATCH /:id/reject` (Reject transfer)
- **Bookings (`/api/v1/bookings`)**:
  - `GET /` (Calendar), `POST /` (Reserve resource), `PATCH /:id/status` (Approve/Reject booking)

### Servicing and Compliance
- **Maintenance (`/api/v1/maintenance`)**:
  - `GET /` (List tickets), `POST /` (Raise ticket), `PATCH /:id/status` (Update progress), `PATCH /:id/resolve` (Close ticket)
- **Audits (`/api/v1/audits`)**:
  - `GET /` (List cycles), `POST /` (Spin up new cycle), `GET /:id` (Cycle details), `PATCH /:id/items` (Verify asset), `PATCH /:id/close` (Lock cycle and generate discrepancies)

### System
- **Analytics (`/api/v1/analytics`)**:
  - `GET /dashboard` (Overview metrics), `GET /reports` (Exportable data)
- **Notifications (`/api/v1/notifications`)**:
  - `GET /` (List user alerts), `PATCH /:id/read` (Mark read), `PATCH /read-all` (Mark all read)

## Tech Stack

### Frontend
- **Framework**: Next.js (App Router, Turbopack)
- **Styling**: Tailwind CSS, CSS Variables
- **Animation**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Server**: Node.js and Express.js
- **Database**: PostgreSQL (v18.4)
- **ORM**: Prisma
- **Security**: JWT Authentication, bcrypt, OTP validation

## Installation and Setup

### Prerequisites
Make sure you have the following installed before starting:
- **Node.js**: v22.22.1+
- **npm**: 10.9.4+
- **PostgreSQL**: 18.4+

### Quick Setup
Automated scripts are provided to install all dependencies for both the frontend and backend. Run the script that matches your environment from the root directory:
- **Linux/Mac**: `./install.sh`
- **Windows**: `install.bat`

### Database Configuration
1. Create a PostgreSQL database named `odoohack`.
2. Ensure your `backend/.env` file contains the correct `DATABASE_URL`. Example:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/odoohack"
   ```
3. Push the schema to the database:
   ```bash
   cd backend
   npx prisma db push
   ```

## Running the Application

The application communicates across the following default ports:
- **Frontend**: 3000
- **Backend**: 5000
- **Database**: 5432

Start both servers in separate terminal windows:

**1. Start the Backend:**
```bash
cd backend
npm run dev
```

**2. Start the Frontend:**
```bash
cd frontend
npm run dev
```

Open your web browser and navigate to http://localhost:3000.

## License
This project was developed for OdooHack 2026.
