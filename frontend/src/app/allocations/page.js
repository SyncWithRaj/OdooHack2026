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
import { HandHelping, RefreshCw, Undo2, ArrowLeftRight } from 'lucide-react';

function AllocationsContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals state
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Forms state
  const [newAlloc, setNewAlloc] = useState({ assetId: '', assignedToUserId: '', expectedReturnDate: '' });
  const [returnDetails, setReturnDetails] = useState({ allocationId: '', assetTag: '', assetName: '', returnConditionNotes: 'Returned in good condition', condition: 'Good' });
  const [transferDetails, setTransferDetails] = useState({ allocationId: '', assetTag: '', assetName: '', targetUserId: '' });
  
  // Conflict warning details
  const [allocConflict, setAllocConflict] = useState(null);

  const loadData = async () => {
    try {
      const allocList = await api.get('/allocations');
      setAllocations(allocList);

      const transList = await api.get('/transfers');
      setTransfers(transList);

      const assetList = await api.get('/assets');
      setAssets(assetList);

      const empList = await api.get('/employees');
      setEmployees(empList);
    } catch (err) {
      console.error('Failed to load allocations:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Conflict Checking on allocation form changes
  const handleAllocAssetChange = (e) => {
    const assetId = parseInt(e.target.value);
    setNewAlloc({ ...newAlloc, assetId });

    if (!assetId) {
      setAllocConflict(null);
      return;
    }

    const selectedAsset = assets.find(a => a.id === assetId);
    if (selectedAsset && selectedAsset.status === 'allocated') {
      // Find the current allocation holder
      const activeAlloc = allocations.find(al => al.assetId === assetId && al.status === 'active');
      const holderName = activeAlloc?.assignedToUser?.name || 'an Employee';
      setAllocConflict({
        message: `Warning: This asset is currently held by ${holderName}. You cannot directly allocate it.`,
        allocationId: activeAlloc?.id,
        assetName: selectedAsset.name,
        assetTag: selectedAsset.assetTag
      });
    } else {
      setAllocConflict(null);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (allocConflict) {
      showToast('Cannot allocate: Asset is currently held by someone else.', 'warning');
      return;
    }

    try {
      await api.post('/allocations', newAlloc);
      showToast('Asset allocated successfully!', 'success');
      setIsAllocModalOpen(false);
      setNewAlloc({ assetId: '', assignedToUserId: '', expectedReturnDate: '' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to allocate asset', 'error');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${returnDetails.allocationId}/return`, {
        returnConditionNotes: returnDetails.returnConditionNotes,
        condition: returnDetails.condition
      });
      showToast('Asset returned to available inventory.', 'success');
      setIsReturnModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Return check-in failed', 'error');
    }
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${transferDetails.allocationId}/transfer`, {
        targetUserId: parseInt(transferDetails.targetUserId)
      });
      showToast('Transfer request submitted to manager.', 'success');
      setIsTransferModalOpen(false);
      setIsAllocModalOpen(false); // close parent allocation modal if open
      setAllocConflict(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Transfer request failed', 'error');
    }
  };

  const handleApproveTransfer = async (id) => {
    try {
      await api.patch(`/transfers/${id}/approve`, {});
      showToast('Transfer approved and asset reallocated.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleRejectTransfer = async (id) => {
    try {
      await api.patch(`/transfers/${id}/reject`, { rejectionReason: 'Declined by Admin' });
      showToast('Transfer request rejected.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  // Filter allocations to only show active ones
  const activeAllocations = allocations.filter(a => a.status === 'active');

  const allocColumns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'assignedTo', label: 'Assigned To', render: (_, row) => row.assignedToUser?.name || 'Department' },
    { key: 'allocationDate', label: 'Allocated At', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'expectedReturnDate', label: 'Due Date', render: (val, row) => {
      const isOverdue = val && new Date(val) < new Date();
      return (
        <span className={`font-mono text-xs font-semibold ${isOverdue ? 'text-status-lost animate-pulse' : 'text-ink'}`}>
          {val ? new Date(val).toLocaleDateString() : 'Infinite'}
          {isOverdue && ' (OVERDUE)'}
        </span>
      );
    }},
  ];

  const transColumns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'requester', label: 'From Holder', render: (_, row) => row.requestedBy?.name },
    { key: 'target', label: 'Target Recipient', render: (_, row) => row.targetUser?.name || 'Department' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="transfer" status={val} /> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-8">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">ALLOCATIONS & TRANSFERS</h1>
            <p className="text-steel text-sm mt-1">Assign hardware to employees, process cross-department transfers, and manage returns.</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'asset_manager') && (
            <Button variant="primary" onClick={() => setIsAllocModalOpen(true)} className="flex items-center gap-1.5">
              <HandHelping className="w-4 h-4" /> Allocate Asset
            </Button>
          )}
        </div>

        {/* Active Allocations grid */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 text-accent" /> Active Allocations
          </h2>
          <DataTable
            columns={allocColumns}
            data={activeAllocations}
            rowActions={[
              {
                label: 'Check In / Return',
                onClick: (row) => {
                  setReturnDetails({
                    allocationId: row.id,
                    assetTag: row.asset?.assetTag,
                    assetName: row.asset?.name,
                    returnConditionNotes: 'Returned in good condition',
                    condition: row.asset?.condition || 'Good'
                  });
                  setIsReturnModalOpen(true);
                },
                disabled: () => !(user?.role === 'admin' || user?.role === 'asset_manager')
              },
              {
                label: 'Initiate Transfer',
                onClick: (row) => {
                  setTransferDetails({
                    allocationId: row.id,
                    assetTag: row.asset?.assetTag,
                    assetName: row.asset?.name,
                    targetUserId: ''
                  });
                  setIsTransferModalOpen(true);
                }
              }
            ]}
          />
        </div>

        {/* Transfer Requests workflow */}
        <div className="border-t border-hairline pt-8 flex flex-col gap-4">
          <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-4.5 h-4.5 text-accent" /> Transfer Requests Pipeline
          </h2>
          <DataTable
            columns={transColumns}
            data={transfers}
            rowActions={[
              {
                label: 'Approve Transfer',
                onClick: (row) => handleApproveTransfer(row.id),
                disabled: (row) => row.status !== 'requested' || !(user?.role === 'admin' || user?.role === 'asset_manager' || user?.role === 'department_head')
              },
              {
                label: 'Reject Transfer',
                onClick: (row) => handleRejectTransfer(row.id),
                disabled: (row) => row.status !== 'requested' || !(user?.role === 'admin' || user?.role === 'asset_manager' || user?.role === 'department_head')
              }
            ]}
          />
        </div>

        {/* Modal: Allocate Asset */}
        <Modal
          isOpen={isAllocModalOpen}
          onClose={() => setIsAllocModalOpen(false)}
          title="Allocate Asset"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAllocModalOpen(false)}>Cancel</Button>
              {allocConflict ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setTransferDetails({
                      allocationId: allocConflict.allocationId,
                      assetTag: allocConflict.assetTag,
                      assetName: allocConflict.assetName,
                      targetUserId: ''
                    });
                    setIsTransferModalOpen(true);
                  }}
                >
                  Request Transfer
                </Button>
              ) : (
                <Button variant="primary" type="submit" form="alloc-form">Allocate</Button>
              )}
            </>
          }
        >
          <form id="alloc-form" onSubmit={handleAllocate} className="space-y-4">
            <FormField
              label="Select Asset"
              type="select"
              required
              placeholder="Select an asset"
              value={newAlloc.assetId}
              onChange={handleAllocAssetChange}
              options={assets.filter(a => a.status === 'available' || a.status === 'allocated').map(a => ({ value: a.id, label: `${a.name} (${a.assetTag}) — ${a.status.toUpperCase()}` }))}
            />

            {allocConflict && (
              <div className="p-4 bg-status-maintenance/10 border border-status-maintenance/30 rounded-[6px] text-xs text-status-maintenance font-mono font-medium">
                {allocConflict.message}
                <span className="block mt-2 font-sans font-normal text-steel">
                  You can request a cross-transfer to re-allocate this tag without return check-in.
                </span>
              </div>
            )}

            {!allocConflict && (
              <>
                <FormField
                  label="Assign To Employee"
                  type="select"
                  required
                  placeholder="Select employee"
                  value={newAlloc.assignedToUserId}
                  onChange={(e) => setNewAlloc({ ...newAlloc, assignedToUserId: e.target.value })}
                  options={employees.map(e => ({ value: e.id, label: e.name }))}
                />
                <FormField
                  label="Expected Return Date"
                  type="date"
                  value={newAlloc.expectedReturnDate}
                  onChange={(e) => setNewAlloc({ ...newAlloc, expectedReturnDate: e.target.value })}
                />
              </>
            )}
          </form>
        </Modal>

        {/* Modal: Check In / Return */}
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title="Return Asset Check-In"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="return-form">Confirm Return</Button>
            </>
          }
        >
          <form id="return-form" onSubmit={handleReturn} className="space-y-4">
            <div className="p-3 bg-surface border border-hairline rounded-[6px] text-xs">
              <span className="text-steel block">Asset tag returning:</span>
              <span className="font-bold text-ink flex items-center gap-2 mt-1">
                <AssetTagChip tag={returnDetails.assetTag} /> {returnDetails.assetName}
              </span>
            </div>

            <FormField
              label="Return Condition Notes"
              type="textarea"
              required
              value={returnDetails.returnConditionNotes}
              onChange={(e) => setReturnDetails({ ...returnDetails, returnConditionNotes: e.target.value })}
            />

            <FormField
              label="Asset Condition Status"
              type="select"
              required
              value={returnDetails.condition}
              onChange={(e) => setReturnDetails({ ...returnDetails, condition: e.target.value })}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' },
                { value: 'Damaged', label: 'Damaged' },
              ]}
              helperText="Marking as Damaged will alert technical maintenance staff."
            />
          </form>
        </Modal>

        {/* Modal: Initiate Transfer */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Request Asset Transfer"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="transfer-form">Request Transfer</Button>
            </>
          }
        >
          <form id="transfer-form" onSubmit={handleRequestTransfer} className="space-y-4">
            <div className="p-3 bg-surface border border-hairline rounded-[6px] text-xs">
              <span className="text-steel block">Transferring asset tag:</span>
              <span className="font-bold text-ink flex items-center gap-2 mt-1">
                <AssetTagChip tag={transferDetails.assetTag} /> {transferDetails.assetName}
              </span>
            </div>

            <FormField
              label="Target Recipient Employee"
              type="select"
              required
              placeholder="Select target employee"
              value={transferDetails.targetUserId}
              onChange={(e) => setTransferDetails({ ...transferDetails, targetUserId: e.target.value })}
              options={employees.map(e => ({ value: e.id, label: e.name }))}
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function AllocationsPage() {
  return (
    <ToastProvider>
      <AllocationsContent />
    </ToastProvider>
  );
}
