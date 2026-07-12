'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import KPICard from '@/components/shared/KPICard';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import AssetTagChip from '@/components/shared/AssetTagChip';
import StatusBadge from '@/components/shared/StatusBadge';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import {
  Package,
  CheckCircle2,
  Wrench,
  CalendarCheck2,
  ArrowLeftRight,
  AlertTriangle,
  Plus,
  BookOpen
} from 'lucide-react';

function DashboardContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();
  
  const [kpis, setKpis] = useState({
    available: 0,
    allocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    overdueReturns: 0
  });
  
  const [overdueItems, setOverdueItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  
  // Forms state
  const [newAsset, setNewAsset] = useState({ name: '', categoryId: '', condition: 'New', location: '', acquisitionCost: '' });
  const [newMaint, setNewMaint] = useState({ assetId: '', description: '', priority: 'medium' });

  const loadDashboardData = async () => {
    try {
      const kpiData = await api.get('/analytics/kpis');
      setKpis(kpiData);

      // Fetch assets & categories for quick forms
      const assetList = await api.get('/assets');
      setAssets(assetList);
      
      const catList = await api.get('/categories');
      setCategories(catList);

      // Fetch active allocations to compute overdue returns
      const allocList = await api.get('/allocations');
      const now = new Date();
      const overdue = allocList.filter(al => {
        if (al.status !== 'active' || !al.expectedReturnDate) return false;
        return new Date(al.expectedReturnDate) < now;
      });
      setOverdueItems(overdue);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', newAsset);
      showToast('New asset registered successfully!', 'success');
      setIsAssetModalOpen(false);
      setNewAsset({ name: '', categoryId: '', condition: 'New', location: '', acquisitionCost: '' });
      loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to register asset', 'error');
    }
  };

  const handleRaiseMaint = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', newMaint);
      showToast('Maintenance pipeline request submitted.', 'success');
      setIsMaintModalOpen(false);
      setNewMaint({ assetId: '', description: '', priority: 'medium' });
      loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to raise request', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">
        SYSTEM LOADING...
      </div>
    );
  }

  // Columns for overdue returns list
  const overdueColumns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'holder', label: 'Holder', render: (_, row) => row.assignedToUser?.name || 'Department' },
    { key: 'expectedReturn', label: 'Due Date', render: (val, row) => <span className="text-status-lost font-mono font-medium">{new Date(row.expectedReturnDate).toLocaleDateString()}</span> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">SYSTEM STATUS</h1>
            <p className="text-steel text-sm mt-1">
              Welcome back, <strong className="text-ink">{user?.name}</strong>. Here is the operational summary.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {(user?.role === 'admin' || user?.role === 'asset_manager') && (
              <Button variant="primary" onClick={() => setIsAssetModalOpen(true)} className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Register Asset
              </Button>
            )}
            <Button variant="secondary" onClick={() => setIsMaintModalOpen(true)} className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Raise Maintenance
            </Button>
          </div>
        </div>

        {/* Dashboard KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard label="Available Assets" value={kpis.available} trend="Ready to allocate" icon={Package} />
          <KPICard label="Active Allocations" value={kpis.allocated} trend="Held by employees" icon={CheckCircle2} />
          <KPICard label="Maintenance Pipeline" value={kpis.maintenanceToday} trend="Pending reviews" icon={Wrench} />
          <KPICard label="Resource Bookings" value={kpis.activeBookings} trend="Upcoming reservations" icon={CalendarCheck2} />
          <KPICard label="Pending Transfers" value={kpis.pendingTransfers} trend="Awaiting approval" icon={ArrowLeftRight} />
          <KPICard label="Overdue Returns" value={kpis.overdueReturns} trend="System flags active" trendType={kpis.overdueReturns > 0 ? 'down' : 'neutral'} icon={AlertTriangle} />
        </div>

        {/* Overdue Returns Section */}
        {overdueItems.length > 0 && (
          <div className="border border-status-lost/30 bg-status-lost/5 rounded-[10px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-status-lost" />
              <h2 className="text-base font-bold font-display text-status-lost uppercase tracking-wider">
                Critical Overdue Returns
              </h2>
            </div>
            <DataTable
              columns={overdueColumns}
              data={overdueItems}
              pageSize={5}
            />
          </div>
        )}

        {/* Welcome Guideline/Intro card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm">
            <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" /> AssetFlow Quick Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-surface rounded-[6px] border border-hairline">
                <span className="font-semibold text-ink block mb-1">1. Tags & QR Codes</span>
                <p className="text-steel leading-relaxed">
                  Every asset has a unique monospaced tag like <AssetTagChip tag="AF-0001" />. QR tags and stickers are printed for physically attaching tags to office gear.
                </p>
              </div>
              <div className="p-3 bg-surface rounded-[6px] border border-hairline">
                <span className="font-semibold text-ink block mb-1">2. Allocations & Return</span>
                <p className="text-steel leading-relaxed">
                  Assign assets to employees or departments. Set expected return dates. Returns check in condition status to prevent damage loops.
                </p>
              </div>
              <div className="p-3 bg-surface rounded-[6px] border border-hairline">
                <span className="font-semibold text-ink block mb-1">3. Audits & Verification</span>
                <p className="text-steel leading-relaxed">
                  Auditors verify physical presence. Closing an audit automatically marks missing items as <StatusBadge domain="asset" status="lost" />.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink uppercase tracking-wider mb-2">Current System State</h3>
              <p className="text-xs text-steel leading-relaxed">
                Database active. Backend API is connected. System rules are being enforced. Role-scoped view is applied to: <strong className="text-accent-ink uppercase font-mono">{user?.role}</strong>.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-xs text-steel font-mono">
              <span>Tenant ID: org_001</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Modal: Register Asset */}
        <Modal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          title="Register New Asset"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAssetModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="asset-form">Register</Button>
            </>
          }
        >
          <form id="asset-form" onSubmit={handleCreateAsset}>
            <FormField
              label="Asset Name"
              placeholder="e.g. iPhone 15 Pro"
              required
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            />
            <FormField
              label="Category"
              type="select"
              required
              placeholder="Select asset category"
              value={newAsset.categoryId}
              onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
            <FormField
              label="Acquisition Cost ($)"
              type="number"
              placeholder="e.g. 999.00"
              value={newAsset.acquisitionCost}
              onChange={(e) => setNewAsset({ ...newAsset, acquisitionCost: e.target.value })}
              helperText="Cost is for report ranking only. No accounting entity links."
            />
            <FormField
              label="Initial Location"
              placeholder="e.g. Room A cabinet"
              value={newAsset.location}
              onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Raise Maintenance */}
        <Modal
          isOpen={isMaintModalOpen}
          onClose={() => setIsMaintModalOpen(false)}
          title="Raise Maintenance Request"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsMaintModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="maint-form">Submit Request</Button>
            </>
          }
        >
          <form id="maint-form" onSubmit={handleRaiseMaint}>
            <FormField
              label="Select Asset"
              type="select"
              required
              placeholder="Choose asset needing service"
              value={newMaint.assetId}
              onChange={(e) => setNewMaint({ ...newMaint, assetId: e.target.value })}
              options={assets.map(a => ({ value: a.id, label: `${a.name} (${a.assetTag})` }))}
            />
            <FormField
              label="Issue Description"
              type="textarea"
              placeholder="Provide repair specifics..."
              required
              value={newMaint.description}
              onChange={(e) => setNewMaint({ ...newMaint, description: e.target.value })}
            />
            <FormField
              label="Priority Level"
              type="select"
              required
              value={newMaint.priority}
              onChange={(e) => setNewMaint({ ...newMaint, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
