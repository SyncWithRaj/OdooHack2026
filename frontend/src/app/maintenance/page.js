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
import { Wrench, ShieldAlert, Plus, Check, PenTool } from 'lucide-react';

function MaintenanceContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);

  // Modals state
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Forms state
  const [newReq, setNewReq] = useState({ assetId: '', description: '', priority: 'medium' });
  const [assignDetails, setAssignDetails] = useState({ reqId: '', technicianName: '' });
  const [resolveDetails, setResolveDetails] = useState({ reqId: '', resolutionNotes: 'Resolved successfully. Restored in working order.' });

  const loadData = async () => {
    try {
      const maintList = await api.get('/maintenance');
      setMaintenance(maintList);

      const assetsList = await api.get('/assets');
      setAssets(assetsList);
    } catch (err) {
      console.error('Failed to load maintenance requests:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', newReq);
      showToast('Maintenance request logged and queued for review.', 'success');
      setIsReqModalOpen(false);
      setNewReq({ assetId: '', description: '', priority: 'medium' });
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit request', 'error');
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      // Approve flips Asset status to under_maintenance
      await api.patch(`/maintenance/${id}/status`, { status: 'approved' });
      showToast('Request approved! Asset status flipped to Under Maintenance.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.patch(`/maintenance/${id}/status`, { status: 'rejected' });
      showToast('Request declined.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/maintenance/${assignDetails.reqId}/status`, {
        status: 'technician_assigned',
        technicianName: assignDetails.technicianName
      });
      showToast(`Technician ${assignDetails.technicianName} assigned.`, 'success');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Technician assignment failed', 'error');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      // Resolve flips Asset status back to available
      await api.post(`/maintenance/${resolveDetails.reqId}/resolve`, {
        resolutionNotes: resolveDetails.resolutionNotes
      });
      showToast('Issue marked resolved. Asset is now Available.', 'success');
      setIsResolveModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Resolution logging failed', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  const columns = [
    { key: 'tag', label: 'Tag', render: (_, row) => <AssetTagChip tag={row.asset?.assetTag} /> },
    { key: 'assetName', label: 'Asset Name', render: (_, row) => row.asset?.name },
    { key: 'raisedBy', label: 'Raised By', render: (_, row) => row.raisedBy?.name || 'Employee' },
    { key: 'priority', label: 'Priority', render: (val) => <span className={`font-mono text-xs uppercase font-semibold ${val === 'urgent' || val === 'high' ? 'text-status-lost' : 'text-steel'}`}>{val}</span> },
    { key: 'technicianName', label: 'Technician', render: (val) => val || <span className="text-steel italic">Unassigned</span> },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge domain="maintenance" status={val} /> },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-ink">MAINTENANCE PIPELINE</h1>
            <p className="text-steel text-sm mt-1">Review breakdown reports, delegate technicians, and log hardware resolution audits.</p>
          </div>
          <Button variant="primary" onClick={() => setIsReqModalOpen(true)} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Raise Request
          </Button>
        </div>

        {/* Requests Table grid */}
        <div className="flex flex-col gap-4">
          <DataTable
            columns={columns}
            data={maintenance}
            rowActions={[
              {
                label: 'Approve Request',
                onClick: (row) => handleApproveRequest(row.id),
                disabled: (row) => row.status !== 'pending' || !(user?.role === 'admin' || user?.role === 'asset_manager')
              },
              {
                label: 'Decline / Reject',
                onClick: (row) => handleRejectRequest(row.id),
                disabled: (row) => row.status !== 'pending' || !(user?.role === 'admin' || user?.role === 'asset_manager')
              },
              {
                label: 'Assign Technician',
                onClick: (row) => {
                  setAssignDetails({ reqId: row.id, technicianName: row.technicianName || '' });
                  setIsAssignModalOpen(true);
                },
                disabled: (row) => (row.status !== 'approved' && row.status !== 'technician_assigned') || !(user?.role === 'admin' || user?.role === 'asset_manager')
              },
              {
                label: 'Log Resolution',
                onClick: (row) => {
                  setResolveDetails({ reqId: row.id, resolutionNotes: 'Restored to inventory after full diagnostic.' });
                  setIsResolveModalOpen(true);
                },
                disabled: (row) => (row.status === 'resolved' || row.status === 'pending' || row.status === 'rejected') || !(user?.role === 'admin' || user?.role === 'asset_manager')
              }
            ]}
          />
        </div>

        {/* Modal: Raise Request */}
        <Modal
          isOpen={isReqModalOpen}
          onClose={() => setIsReqModalOpen(false)}
          title="Raise Maintenance Request"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReqModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="maint-req-form">Submit Request</Button>
            </>
          }
        >
          <form id="maint-req-form" onSubmit={handleCreateRequest} className="space-y-4">
            <FormField
              label="Select Asset"
              type="select"
              required
              placeholder="Choose asset needing diagnostic"
              value={newReq.assetId}
              onChange={(e) => setNewReq({ ...newReq, assetId: e.target.value })}
              options={assets.map(a => ({ value: a.id, label: `${a.name} (${a.assetTag})` }))}
            />

            <FormField
              label="Issue Description"
              type="textarea"
              required
              placeholder="Provide detail on defect, breakage or error logs..."
              value={newReq.description}
              onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
            />

            <FormField
              label="Priority Level"
              type="select"
              required
              value={newReq.priority}
              onChange={(e) => setNewReq({ ...newReq, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
          </form>
        </Modal>

        {/* Modal: Assign Technician */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Maintenance Technician"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="assign-form">Assign</Button>
            </>
          }
        >
          <form id="assign-form" onSubmit={handleAssignTechnician}>
            <FormField
              label="Technician Name"
              required
              placeholder="e.g. Robert Smith (Hardware Dept)"
              value={assignDetails.technicianName}
              onChange={(e) => setAssignDetails({ ...assignDetails, technicianName: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Log Resolution */}
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title="Log Repair Resolution"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" form="resolve-form">Confirm Resolution</Button>
            </>
          }
        >
          <form id="resolve-form" onSubmit={handleResolve}>
            <FormField
              label="Resolution Diagnostic Notes"
              type="textarea"
              required
              placeholder="e.g. Swapped motherboard. System boots up successfully."
              value={resolveDetails.resolutionNotes}
              onChange={(e) => setResolveDetails({ ...resolveDetails, resolutionNotes: e.target.value })}
              helperText="Logging resolution automatically marks the asset as Available in the directory."
            />
          </form>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default function MaintenancePage() {
  return (
    <ToastProvider>
      <MaintenanceContent />
    </ToastProvider>
  );
}
