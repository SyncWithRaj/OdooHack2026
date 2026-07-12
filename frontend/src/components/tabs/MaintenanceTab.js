'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Plus, Wrench, Check, X, UserCheck, Play, ClipboardCheck } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function MaintenanceTab({ user, refreshAssets }) {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Raise Request Modal State
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submittingRaise, setSubmittingRaise] = useState(false);

  // Assign Tech Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [technicianName, setTechnicianName] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Resolve Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveRequestId, setResolveRequestId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Approve Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveRequestId, setApproveRequestId] = useState(null);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/maintenance');
      setRequests(res.data.data.maintenanceRequests || []);

      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.data.assets || []);
    } catch (err) {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    if (!assetId) {
      toast.error('Please select an asset');
      return;
    }

    try {
      setSubmittingRaise(true);
      await api.post('/maintenance', {
        assetId: parseInt(assetId),
        description,
        priority
      });
      toast.success('Maintenance ticket raised successfully');
      setIsRaiseModalOpen(false);
      setAssetId('');
      setDescription('');
      setPriority('medium');
      fetchMaintenanceData();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit maintenance request');
    } finally {
      setSubmittingRaise(false);
    }
  };

  const handleStatusTransition = async (id, status, extraData = {}) => {
    try {
      await api.patch(`/maintenance/${id}/status`, {
        status,
        ...extraData
      });
      toast.success(`Ticket status updated to ${status}`);
      fetchMaintenanceData();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!technicianName.trim()) {
      toast.error('Please specify a technician name');
      return;
    }

    try {
      setSubmittingAssign(true);
      await handleStatusTransition(selectedRequestId, 'technician_assigned', { technicianName });
      setIsAssignModalOpen(false);
      setSelectedRequestId(null);
      setTechnicianName('');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please write resolution notes');
      return;
    }

    try {
      setSubmittingResolve(true);
      await api.post(`/maintenance/${resolveRequestId}/resolve`, {
        resolutionNotes
      });
      toast.success('Maintenance ticket marked resolved');
      setIsResolveModalOpen(false);
      setResolveRequestId(null);
      setResolutionNotes('');
      fetchMaintenanceData();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve maintenance ticket');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveStartDate || !approveEndDate) {
      toast.error('Please specify the maintenance duration');
      return;
    }
    
    try {
      setSubmittingApprove(true);
      await handleStatusTransition(approveRequestId, 'approved', { 
        startDate: approveStartDate, 
        endDate: approveEndDate 
      });
      setIsApproveModalOpen(false);
      setApproveRequestId(null);
      setApproveStartDate('');
      setApproveEndDate('');
    } finally {
      setSubmittingApprove(false);
    }
  };

  const isManager = ['admin', 'asset_manager'].includes(user?.role);

  const filteredRequests = requests.filter(req => 
    req.asset.name.toLowerCase().includes(search.toLowerCase()) ||
    req.asset.assetTag.toLowerCase().includes(search.toLowerCase()) ||
    req.description.toLowerCase().includes(search.toLowerCase()) ||
    req.raisedBy.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'asset',
      label: 'Asset',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <AssetTagChip tag={row.asset.assetTag} />
          <span className="font-semibold text-ink">{row.asset.name}</span>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize ${
          row.priority === 'urgent' ? 'bg-status-lost/10 text-status-lost border border-status-lost/20' :
          row.priority === 'high' ? 'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20' :
          row.priority === 'medium' ? 'bg-status-allocated/10 text-status-allocated border border-status-allocated/20' :
          'bg-status-retired/10 text-status-retired border border-status-retired/20'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      key: 'raisedBy',
      label: 'Raised By',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-ink">{row.raisedBy.name}</span>
    },
    {
      key: 'description',
      label: 'Issue Description',
      render: (row) => <span className="text-xs text-steel block max-w-xs truncate" title={row.description}>{row.description}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge domain="maintenance" status={row.status} />
    },
    {
      key: 'technician',
      label: 'Technician',
      render: (row) => <span className="text-xs font-medium text-steel">{row.technicianName || 'Not Assigned'}</span>
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        if (!isManager) return null;
        
        return (
          <div className="flex justify-end gap-2">
            {row.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setApproveRequestId(row.id);
                    setIsApproveModalOpen(true);
                  }}
                  icon={Check}
                  className="!p-1.5 !px-3 hover:!bg-status-available/10 hover:!text-status-available text-xs font-semibold border-status-available/20"
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusTransition(row.id, 'rejected')}
                  icon={X}
                  className="!p-1.5 !px-3 hover:!bg-status-lost/10 hover:!text-status-lost text-xs font-semibold border-status-lost/20"
                >
                  Reject
                </Button>
              </>
            )}

            {row.status === 'approved' && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedRequestId(row.id);
                  setIsAssignModalOpen(true);
                }}
                icon={UserCheck}
                className="!p-1.5 !px-3 text-xs font-semibold hover:border-accent"
              >
                Assign Tech
              </Button>
            )}

            {row.status === 'technician_assigned' && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleStatusTransition(row.id, 'in_progress')}
                  icon={Play}
                  className="!p-1.5 !px-3 text-xs font-semibold hover:border-accent"
                >
                  Start Repair
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResolveRequestId(row.id);
                    setIsResolveModalOpen(true);
                  }}
                  icon={ClipboardCheck}
                  className="!p-1.5 !px-3 text-xs font-semibold hover:border-status-available/50"
                >
                  Resolve
                </Button>
              </div>
            )}

            {row.status === 'in_progress' && (
              <Button
                variant="secondary"
                onClick={() => {
                  setResolveRequestId(row.id);
                  setIsResolveModalOpen(true);
                }}
                icon={ClipboardCheck}
                className="!p-1.5 !px-3 text-xs font-semibold hover:border-status-available/50"
              >
                Resolve
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Maintenance Tickets</h2>
          <p className="mt-1 text-sm text-steel">
            Submit asset repair requests, allocate technicians, track ongoing jobs, and view logs.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchMaintenanceData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsRaiseModalOpen(true)}
            icon={Plus}
          >
            Request Maintenance
          </Button>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="p-4 bg-white border border-hairline rounded-lg shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search tickets by asset name, tag, priority..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Tickets Directory Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        loading={loading}
        emptyTitle="No maintenance tickets"
        emptyDescription="There are no maintenance or repair tickets logged."
        emptyActionLabel="Create Ticket"
        emptyOnAction={() => setIsRaiseModalOpen(true)}
        emptyActionIcon={Plus}
      />

      {/* Raise Maintenance Request Modal */}
      <Modal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        title="Raise Maintenance Request"
      >
        <form onSubmit={handleRaiseSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset requiring repair"
            id="maint-asset-select"
            type="select"
            required
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            <option value="">Select Asset...</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag}) — Status: {asset.status}
              </option>
            ))}
          </FormField>

          <FormField
            label="Priority Level"
            id="maint-priority-select"
            type="select"
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </FormField>

          <FormField
            label="Details of Issue"
            id="maint-desc"
            type="textarea"
            required
            placeholder="Describe what's wrong with the asset..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsRaiseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingRaise}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Technician Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRequestId(null);
        }}
        title="Assign Technician"
      >
        <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
          <FormField
            label="Technician Name"
            id="tech-name"
            required
            placeholder="e.g. John Doe, ACME Support Team..."
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingAssign}>Assign & Proceed</Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolveRequestId(null);
        }}
        title="Mark Ticket as Resolved"
      >
        <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
          <FormField
            label="Resolution/Repair Notes"
            id="res-notes"
            type="textarea"
            required
            placeholder="Explain what was fixed, parts replaced, or general resolution notes..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsResolveModalOpen(false);
                setResolveRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingResolve}>Resolve Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* Approve Maintenance Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setApproveRequestId(null);
          setApproveStartDate('');
          setApproveEndDate('');
        }}
        title="Approve Maintenance & Set Duration"
      >
        <form onSubmit={handleApproveSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-steel mb-2">
            Setting the duration will automatically cancel any existing bookings that overlap with this maintenance window.
          </p>
          <FormField
            label="Start Date"
            id="approve-start-date"
            type="datetime-local"
            required
            value={approveStartDate}
            onChange={(e) => setApproveStartDate(e.target.value)}
          />
          <FormField
            label="End Date"
            id="approve-end-date"
            type="datetime-local"
            required
            value={approveEndDate}
            onChange={(e) => setApproveEndDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsApproveModalOpen(false);
                setApproveRequestId(null);
                setApproveStartDate('');
                setApproveEndDate('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingApprove}>Approve Maintenance</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
