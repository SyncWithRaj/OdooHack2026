'use client';

import React, { useState } from 'react';
import Button from '@/components/shared/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import AssetTagChip from '@/components/shared/AssetTagChip';
import KPICard from '@/components/shared/KPICard';
import EmptyState from '@/components/shared/EmptyState';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import Tabs from '@/components/shared/Tabs';
import Avatar from '@/components/shared/Avatar';
import Timeline from '@/components/shared/Timeline';
import SearchBar from '@/components/shared/SearchBar';
import DataTable from '@/components/shared/DataTable';
import Calendar from '@/components/shared/Calendar';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import { Shield, Wrench, CheckCircle, Package } from 'lucide-react';

function StyleGuideContent() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('tab-1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [formValues, setFormValues] = useState({
    name: '',
    role: '',
    notes: '',
  });

  const columns = [
    { key: 'tag', label: 'Tag', render: (val) => <AssetTagChip tag={val} /> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="asset" status={val} /> },
  ];

  const tableData = [
    { id: 1, tag: 'AF-0001', name: 'MacBook Pro M3', category: 'Laptops', status: 'available' },
    { id: 2, tag: 'AF-0002', name: 'iPad Pro', category: 'Tablets', status: 'allocated' },
    { id: 3, tag: 'AF-0003', name: 'Conference Room Alpha', category: 'Spaces', status: 'reserved' },
    { id: 4, tag: 'AF-0004', name: 'Dell Monitor 27"', category: 'Monitors', status: 'under_maintenance' },
  ];

  const timelineEvents = [
    { type: 'allocation', title: 'Allocated to Raj', description: 'Assigned for Remote Work', actor: 'Asset Manager', timestamp: new Date() },
    { type: 'maintenance', title: 'Maintenance Approved', description: 'Screen repair request', actor: 'Admin', timestamp: new Date(Date.now() - 3600000) },
    { type: 'audit', title: 'Verified in Audit Cycle', description: 'Condition: Good', actor: 'Auditor 1', timestamp: new Date(Date.now() - 7200000) },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="mb-12 border-b border-hairline pb-6">
        <h1 className="text-4xl font-bold font-display text-ink tracking-tight mb-2">ASSETFLOW STYLE GUIDE</h1>
        <p className="text-steel text-sm max-w-xl">
          Visual testbed for shared components, colors, typography, and states. Ensure any modification matches this design system first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Color Tokens */}
        <section className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">1. Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-ink border border-hairline flex items-end p-2 text-[10px] font-mono text-white">#1B2429</div>
              <span className="text-xs font-semibold text-ink">--ink</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-steel border border-hairline flex items-end p-2 text-[10px] font-mono text-white">#5B6B73</div>
              <span className="text-xs font-semibold text-ink">--steel</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-surface border border-hairline flex items-end p-2 text-[10px] font-mono text-ink">#FAFAF9</div>
              <span className="text-xs font-semibold text-ink">--surface</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-surface-raised border border-hairline flex items-end p-2 text-[10px] font-mono text-ink">#FFFFFF</div>
              <span className="text-xs font-semibold text-ink">--surface-raised</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-hairline border border-hairline flex items-end p-2 text-[10px] font-mono text-ink">#E4E2DD</div>
              <span className="text-xs font-semibold text-ink">--hairline</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-accent border border-hairline flex items-end p-2 text-[10px] font-mono text-accent-ink font-semibold">#E8A33D</div>
              <span className="text-xs font-semibold text-ink">--accent</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-full rounded-[6px] bg-[#5C3B0E] border border-hairline flex items-end p-2 text-[10px] font-mono text-white">#5C3B0E</div>
              <span className="text-xs font-semibold text-ink">--accent-ink</span>
            </div>
          </div>
        </section>

        {/* Buttons & Status Badges */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">2. Buttons</h2>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="primary">Primary Accent</Button>
              <Button variant="secondary">Secondary Border</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Action</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" disabled>Disabled Pri</Button>
              <Button variant="secondary" disabled>Disabled Sec</Button>
            </div>
          </div>

          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">3. Status Badges</h2>
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-semibold text-steel block mb-2">Asset Lifecycle Status:</span>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge domain="asset" status="available" />
                  <StatusBadge domain="asset" status="allocated" />
                  <StatusBadge domain="asset" status="reserved" />
                  <StatusBadge domain="asset" status="under_maintenance" />
                  <StatusBadge domain="asset" status="lost" />
                  <StatusBadge domain="asset" status="retired" />
                  <StatusBadge domain="asset" status="disposed" />
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-steel block mb-2">Resource Booking Status:</span>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge domain="booking" status="upcoming" />
                  <StatusBadge domain="booking" status="ongoing" />
                  <StatusBadge domain="booking" status="completed" />
                  <StatusBadge domain="booking" status="cancelled" />
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-steel block mb-2">Maintenance Status:</span>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge domain="maintenance" status="pending" />
                  <StatusBadge domain="maintenance" status="approved" />
                  <StatusBadge domain="maintenance" status="rejected" />
                  <StatusBadge domain="maintenance" status="technician_assigned" />
                  <StatusBadge domain="maintenance" status="in_progress" />
                  <StatusBadge domain="maintenance" status="resolved" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Signature Element, Avatar, KPIs */}
        <section className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">4. Signature Elements & KPI Cards</h2>
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs font-semibold text-steel block mb-2">Asset Tag Chip (§2.5):</span>
                <div className="flex gap-2">
                  <AssetTagChip tag="AF-0001" />
                  <AssetTagChip tag="AF-9999" />
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-steel block mb-2">User Avatar:</span>
                <div className="flex items-center gap-2">
                  <Avatar name="Ankit" size="sm" />
                  <Avatar name="John Doe" size="md" />
                  <Avatar name="Asset Manager" size="lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Available Assets" value="48" trend="↑ 12% this month" trendType="up" icon={Package} />
              <KPICard label="Active Allocations" value="126" trend="↓ 3% this month" trendType="down" icon={CheckCircle} />
              <KPICard label="Maintenance Today" value="5" trend="4 Pending approval" trendType="neutral" icon={Wrench} />
              <KPICard label="Active Audits" value="1" trend="Ends in 3 days" trendType="neutral" icon={Shield} />
            </div>
          </div>
        </section>

        {/* Search, Tabs, Form Fields */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-6">
            <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-2">5. Form Fields & Modals</h2>
            
            <FormField
              label="Asset Name"
              type="text"
              name="name"
              placeholder="e.g. MacBook Pro M3"
              required
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              helperText="Provide the standard employee-facing hardware name."
            />

            <FormField
              label="Access Role"
              type="select"
              name="role"
              placeholder="Choose a role"
              value={formValues.role}
              onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'asset_manager', label: 'Asset Manager' },
                { value: 'admin', label: 'Administrator' },
              ]}
              error={formValues.role === '' ? 'Please select a role' : null}
            />

            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Open Modal Dialog</Button>
              <Button variant="primary" onClick={() => showToast('Style Guide notification demo!', 'success')}>Trigger Toast Alert</Button>
            </div>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Confirm Asset Transfer"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => { setIsModalOpen(false); showToast('Transfer Approved', 'success'); }}>Approve</Button>
                </>
              }
            >
              <p className="text-sm text-steel">
                Are you sure you want to approve this asset transfer request? This will reallocate the tag <AssetTagChip tag="AF-0012" /> to Engineering department.
              </p>
            </Modal>
          </div>

          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">6. Search Bar & Tabs</h2>
            
            <Tabs
              tabs={[
                { id: 'tab-1', label: 'Departments' },
                { id: 'tab-2', label: 'Categories' },
                { id: 'tab-3', label: 'Employee Directory' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="mt-4">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search tags, serial numbers, locations..."
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'available', label: 'Available' },
                      { value: 'allocated', label: 'Allocated' },
                    ],
                  },
                ]}
                activeFilters={activeFilters}
                onFilterChange={setActiveFilters}
              />
            </div>
          </div>
        </section>

        {/* Data Grid, Calendar, Timeline */}
        <section className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-8">
          <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-2">7. Complex Layout Data Grid, Timeline & Calendar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-xs font-semibold text-steel block mb-4">DataTable Inventory:</span>
              <DataTable
                columns={columns}
                data={tableData}
                rowActions={[
                  { label: 'View Details', onClick: (row) => showToast(`Selected ${row.name}`, 'info') },
                  { label: 'Deallocate', onClick: (row) => showToast(`Deallocating ${row.name}`, 'warning'), disabled: (row) => row.status !== 'allocated' },
                ]}
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-steel block mb-4">Unified Timeline Logs:</span>
              <Timeline events={timelineEvents} />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-steel block mb-4">Booking TimeSlotGrid:</span>
            <Calendar
              resources={[
                { id: 1, name: 'Conf Room Alpha', capacity: 10 },
                { id: 2, name: 'Training Lab B', capacity: 30 },
              ]}
              bookings={[
                { id: 1, assetId: 1, startTime: new Date().setHours(9, 0, 0, 0), endTime: new Date().setHours(11, 0, 0, 0), bookedBy: 'Raj (Engineering)' },
                { id: 2, assetId: 2, startTime: new Date().setHours(13, 0, 0, 0), endTime: new Date().setHours(14, 0, 0, 0), bookedBy: 'Ankit (Marketing)' },
              ]}
              onSlotSelect={(res, hour) => showToast(`Reserved slot at ${hour}:00 for ${res.name}`, 'success')}
            />
          </div>
        </section>

        {/* Empty States */}
        <section className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display text-ink uppercase tracking-wider mb-6">8. Empty States</h2>
          <EmptyState
            icon={Package}
            title="No Assets Registered"
            description="There are currently no items in this category. Register your first physical asset to start tracking its lifecycle."
            actionLabel="Register New Asset"
            onAction={() => showToast('Form launch demo', 'info')}
          />
        </section>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <ToastProvider>
      <StyleGuideContent />
    </ToastProvider>
  );
}
