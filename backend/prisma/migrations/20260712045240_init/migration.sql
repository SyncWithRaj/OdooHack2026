-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('employee', 'department_head', 'asset_manager', 'admin');

-- CreateEnum
CREATE TYPE "GeneralStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('available', 'allocated', 'reserved', 'under_maintenance', 'lost', 'retired', 'disposed');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('active', 'returned', 'pending_transfer');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('pending', 'approved', 'rejected', 'technician_assigned', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "AuditItemVerification" AS ENUM ('unverified', 'verified', 'missing', 'damaged');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('requested', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "parent_id" INTEGER,
    "department_head_id" INTEGER,
    "status" "GeneralStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'employee',
    "department_id" INTEGER,
    "status" "GeneralStatus" NOT NULL DEFAULT 'active',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_otp" VARCHAR(6),
    "email_otp_expires" TIMESTAMPTZ,
    "password_reset_otp" VARCHAR(6),
    "password_reset_expires" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "metadata_schema" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "asset_tag" VARCHAR(50) NOT NULL,
    "serial_number" VARCHAR(100),
    "category_id" INTEGER NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'available',
    "condition" VARCHAR(255) DEFAULT 'New',
    "location" VARCHAR(255),
    "acquisition_date" DATE,
    "acquisition_cost" DECIMAL(12,2),
    "photo_url" VARCHAR(500),
    "documents" JSONB,
    "is_bookable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "assigned_to_user_id" INTEGER,
    "assigned_to_dept_id" INTEGER,
    "allocated_by_id" INTEGER NOT NULL,
    "allocation_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_date" DATE,
    "actual_return_date" TIMESTAMPTZ,
    "return_condition_notes" TEXT,
    "status" "AllocationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_requests" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "current_allocation_id" INTEGER NOT NULL,
    "requested_by_user_id" INTEGER NOT NULL,
    "target_user_id" INTEGER,
    "target_dept_id" INTEGER,
    "status" "TransferStatus" NOT NULL DEFAULT 'requested',
    "approved_by_id" INTEGER,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_bookings" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'upcoming',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "raised_by_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'medium',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'pending',
    "photo_url" VARCHAR(500),
    "technician_name" VARCHAR(255),
    "resolution_notes" TEXT,
    "approved_by_id" INTEGER,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_cycles" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "scope_type" VARCHAR(50) NOT NULL,
    "scope_department_id" INTEGER,
    "scope_location" VARCHAR(255),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'open',
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" SERIAL NOT NULL,
    "audit_cycle_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "verified_by_id" INTEGER,
    "status" "AuditItemVerification" NOT NULL DEFAULT 'unverified',
    "notes" TEXT,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discrepancy_reports" (
    "id" SERIAL NOT NULL,
    "audit_cycle_id" INTEGER NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "expected_status" "AssetStatus" NOT NULL,
    "found_status" "AuditItemVerification" NOT NULL,
    "details" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by_id" INTEGER,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discrepancy_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "reference_id" INTEGER,
    "reference_type" VARCHAR(50),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(255) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" INTEGER,
    "details" JSONB,
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuditCycleAuditors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AuditCycleAuditors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_dept" ON "users"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_tag_key" ON "assets"("asset_tag");

-- CreateIndex
CREATE INDEX "idx_assets_tag_serial" ON "assets"("asset_tag", "serial_number");

-- CreateIndex
CREATE INDEX "idx_assets_status_category" ON "assets"("status", "category_id");

-- CreateIndex
CREATE INDEX "idx_allocations_active" ON "allocations"("asset_id", "status");

-- CreateIndex
CREATE INDEX "idx_bookings_calendar" ON "resource_bookings"("asset_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "audit_items_audit_cycle_id_asset_id_key" ON "audit_items"("audit_cycle_id", "asset_id");

-- CreateIndex
CREATE INDEX "idx_notifications_unread" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "_AuditCycleAuditors_B_index" ON "_AuditCycleAuditors"("B");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_department_head_id_fkey" FOREIGN KEY ("department_head_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_assigned_to_dept_id_fkey" FOREIGN KEY ("assigned_to_dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_allocated_by_id_fkey" FOREIGN KEY ("allocated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_current_allocation_id_fkey" FOREIGN KEY ("current_allocation_id") REFERENCES "allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_target_dept_id_fkey" FOREIGN KEY ("target_dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_bookings" ADD CONSTRAINT "resource_bookings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_bookings" ADD CONSTRAINT "resource_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_scope_department_id_fkey" FOREIGN KEY ("scope_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_audit_cycle_id_fkey" FOREIGN KEY ("audit_cycle_id") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancy_reports" ADD CONSTRAINT "discrepancy_reports_audit_cycle_id_fkey" FOREIGN KEY ("audit_cycle_id") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancy_reports" ADD CONSTRAINT "discrepancy_reports_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancy_reports" ADD CONSTRAINT "discrepancy_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditCycleAuditors" ADD CONSTRAINT "_AuditCycleAuditors_A_fkey" FOREIGN KEY ("A") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditCycleAuditors" ADD CONSTRAINT "_AuditCycleAuditors_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
