'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import DataTable from '@/components/shared/DataTable';
import Button from '@/components/shared/Button';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import AssetTagChip from '@/components/shared/AssetTagChip';
import StatusBadge from '@/components/shared/StatusBadge';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { ShieldCheck, Plus, AlertTriangle, CheckSquare, Eye } from 'lucide-react';

function AuditContent() {
  const { user, loading, logout } = () => useAuth();
  const auth = useAuth();
  const { showToast } = useToast();

  const [cycles, setCycles] = useState([]);
  const [activeCycleDetails, setActiveCycleDetails] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modals state
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  // Forms state
  const [newCycle, setNewCycle] = useState({ title: '', scopeType: 'location', scopeLocation: 'HQ - 3rd Floor', scopeDepartmentId: '', startDate: '', endDate: '' });
  const [verifyItem, setVerifyItem] = useState({ itemId: '', assetName: '', assetTag: '', status: 'verified', conditionNotes: '' });

  const loadData = async () => {
    try {
      const cycleList = await api.get('/audits');
      setCycles(cycleList);

      const empList = await api.get('/employees');
      setEmployees(empList);

      const deptList = await api.get('/departments');
      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to load audits:', err);
    }
  };

  useEffect(() => {
    if (auth.user) {
      loadData();
    }
  }, [auth.user]);

  const handleLaunchCycle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/audits', newCycle);
      showToast('New audit cycle initialized successfully!', 'success');
      setIsCycleModalOpen(false);
      setNewCycle({ title: '', scopeType: 'location', scopeLocation: 'HQ - 3rd Floor', scopeDepartmentId: '', startDate: '', endDate: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Audit cycle initialization failed', 'error');
    }
  };

  const handleSelectCycle = async (id) => {
    try {
      const details = await api.get(`/audits/${id}`);
      setActiveCycleDetails(details);
    } catch (err) {
      showToast('Failed to load cycle verification list.', 'error');
    }
  };

  const handleVerifyItem = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/audits/items/${verifyItem.itemId}`, {
        status: verifyItem.status,
        conditionNotes: verifyItem.conditionNotes
      });
      showToast('Item verification status saved.', 'success');
      setIsVerifyModalOpen(false);
      
      // Refresh current active cycle view
      if (activeCycleDetails) {
        handleSelectCycle(activeCycleDetails.id);
      }
    } catch (err) {
      showToast('Verification failed', 'error');
    }
  };

  const handleCloseCycle = async (id) => {
    try {
      await api.post(`/audits/${id}/close`, {});
      showToast('Audit cycle locked and closed. Missing items cascaded to Lost status.', 'success');
      setActiveCycleDetails(null);
      loadData();
    } catch (err) {
      showToast('Failed to close cycle', 'error');
    }
  };

  if (auth.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  const cycleColumns = [
    { key: 'title', label: 'Audit Title', sortable: true },
    { key: 'scope', label: 'Scope', render: (_, row) => row.scopeLocation || row.scopeDepartment?.name || 'Global' },
    { key: 'startDate', label: 'Start Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="audit" status={val} /> },
  ];

  const itemColumns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'expectedStatus', label: 'Expected Status', render: (_, row) => <StatusBadge domain="asset" status={row.asset?.status} /> },
    { key: 'verification', label: 'Verified Status', render: (val, row) => <StatusBadge domain="audit" status={row.status} /> },
    { key: 'notes', label: 'Notes / Remarks', render: (val) => val || <span className="text-steel italic">None</span> },
  ];

  // Detect discrepancies
  const discrepancies = activeCycleDetails?.items.filter(item => {
    if (item.status === 'unverified') return false;
    // Discrepancy if missing or damaged
    return item.status === 'missing' || item.status === 'damaged';
  }) || [];

  return (
    <Sidebar user={auth.user} onLogout={auth.logout}>
      <div className="flex flex-col gap-8">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">ASSET AUDITS</h1>
            <p className="text-steel text-sm mt-1">Execute physical inventory reconciliations, resolve discrepancies, and lock audits.</p>
          </div>
          {auth.user?.role === 'admin' && (
            <Button variant="primary" onClick={() => setIsCycleModalOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Create Audit Cycle
            </Button>
          )}
        </div>

        {/* Audit Cycles List */}
        <div className="flex flex-col gap-4">
          <DataTable
            columns={cycleColumns}
            data={cycles}
            rowActions={[
              {
                label: 'View Verification Items',
                onClick: (row) => handleSelectCycle(row.id)
              },
              {
                label: 'Close Cycle (Lock)',
                onClick: (row) => handleCloseCycle(row.id),
                disabled: (row) => row.status !== 'open' || auth.user?.role !== 'admin'
              }
            ]}
          />
        </div>

        {/* Active Verification Panel */}
        {activeCycleDetails && (
          <div className="border-t border-hairline pt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-surface border border-hairline p-4 rounded-[10px]">
                <div>
                  <h3 className="font-bold text-base font-display text-ink uppercase tracking-wider">
                    Verify: {activeCycleDetails.title}
                  </h3>
                  <span className="text-xs text-steel font-mono">
                    Status: <strong className="text-accent-ink uppercase">{activeCycleDetails.status}</strong>
                  </span>
                </div>
                {activeCycleDetails.status === 'open' && auth.user?.role === 'admin' && (
                  <Button variant="destructive" onClick={() => handleCloseCycle(activeCycleDetails.id)}>
                    Close & Lock Cycle
                  </Button>
                )}
              </div>

              <DataTable
                columns={itemColumns}
                data={activeCycleDetails.items}
                onRowClick={(row) => {
                  if (activeCycleDetails.status !== 'open') return;
                  setVerifyItem({
                    itemId: row.id,
                    assetName: row.asset?.name,
                    assetTag: row.asset?.assetTag,
                    status: row.status === 'unverified' ? 'verified' : row.status,
                    conditionNotes: row.notes || ''
                  });
                  setIsVerifyModalOpen(true);
                }}
              />
            </div>

            {/* Discrepancy report side panel */}
            <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-status-lost animate-pulse" /> Live Discrepancies
              </h3>
              <p className="text-xs text-steel leading-relaxed">
                Items marked as Missing or Damaged are displayed below. Closing the audit cycle will automatically mark all Missing items as <StatusBadge domain="asset" status="lost" />.
              </p>
              
              <div className="space-y-3 mt-2">
                {discrepancies.length === 0 ? (
                  <div className="text-center py-6 text-xs text-steel italic bg-surface border border-hairline rounded-[6px]">
                    No discrepancies flagged.
                  </div>
                ) : (
                  discrepancies.map((item) => (
                    <div key={item.id} className="p-3 bg-surface border border-hairline rounded-[6px] flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <AssetTagChip tag={item.asset?.assetTag} />
                        <StatusBadge domain="audit" status={item.status} />
                      </div>
                      <span className="font-semibold text-xs text-ink">{item.asset?.name}</span>
                      {item.notes && <span className="text-[11px] text-steel font-mono font-medium">Notes: {item.notes}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Audit Cycle */}
        <Modal
          isOpen={isCycleModalOpen}
          onClose={() => setIsCycleModalOpen(false)}
          title="Create Audit Verification Cycle"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCycleModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="cycle-form">Initialize Cycle</Button>
            </>
          }
        >
          <form id="cycle-form" onSubmit={handleLaunchCycle} className="space-y-4">
            <FormField
              label="Audit Cycle Title"
              required
              placeholder="e.g. Q3 Hardware Audit HQ"
              value={newCycle.title}
              onChange={(e) => setNewCycle({ ...newCycle, title: e.target.value })}
            />

            <FormField
              label="Scope Scope Type"
              type="select"
              required
              value={newCycle.scopeType}
              onChange={(e) => setNewCycle({ ...newCycle, scopeType: e.target.value })}
              options={[
                { value: 'location', label: 'Physical Site Location' },
                { value: 'department', label: 'Department Scoped' }
              ]}
            />

            {newCycle.scopeType === 'location' ? (
              <FormField
                label="Scope Location Site"
                placeholder="e.g. HQ - 3rd Floor"
                value={newCycle.scopeLocation}
                onChange={(e) => setNewCycle({ ...newCycle, scopeLocation: e.target.value })}
              />
            ) : (
              <FormField
                label="Scope Department"
                type="select"
                placeholder="Select department"
                value={newCycle.scopeDepartmentId}
                onChange={(e) => setNewCycle({ ...newCycle, scopeDepartmentId: e.target.value })}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
              />
            )}

            <FormField
              label="Start Audit Date"
              type="date"
              required
              value={newCycle.startDate}
              onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
            />

            <FormField
              label="End Audit Date"
              type="date"
              required
              value={newCycle.endDate}
              onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Verify Item */}
        <Modal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          title="Verify Asset Presence"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="verify-form">Save Verification</Button>
            </>
          }
        >
          <form id="verify-form" onSubmit={handleVerifyItem} className="space-y-4">
            <div className="p-3 bg-surface border border-hairline rounded-[6px] text-xs">
              <span className="text-steel block">Physical verification:</span>
              <span className="font-bold text-ink flex items-center gap-2 mt-1">
                <AssetTagChip tag={verifyItem.assetTag} /> {verifyItem.assetName}
              </span>
            </div>

            <FormField
              label="Verification Result"
              type="select"
              required
              value={verifyItem.status}
              onChange={(e) => setVerifyItem({ ...verifyItem, status: e.target.value })}
              options={[
                { value: 'verified', label: 'Verified (Present)' },
                { value: 'missing', label: 'Missing (Not found)' },
                { value: 'damaged', label: 'Damaged (Present, needs repair)' },
              ]}
            />

            <FormField
              label="Audit Condition Remarks"
              type="textarea"
              placeholder="Provide context or physical notes..."
              value={verifyItem.conditionNotes}
              onChange={(e) => setVerifyItem({ ...verifyItem, conditionNotes: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function AuditPage() {
  return (
    <ToastProvider>
      <AuditContent />
    </ToastProvider>
  );
}
