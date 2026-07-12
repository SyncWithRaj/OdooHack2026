'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Check, X, Package } from 'lucide-react';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function AssetRequestsTab({ user }) {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [justification, setJustification] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Status Update Modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // approve, reject
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/asset-requests');
      setRequests(res.data.data || []);

      const catRes = await api.get('/categories');
      setCategories(catRes.data.data.categories || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load asset requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId || !justification) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmittingRequest(true);
      await api.post('/asset-requests', {
        categoryId: parseInt(selectedCategoryId),
        justification,
      });
      toast.success('Asset request submitted successfully');
      setIsRequestModalOpen(false);
      setSelectedCategoryId('');
      setJustification('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit asset request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    let targetStatus = '';
    if (actionType === 'reject') {
      targetStatus = 'rejected';
      if (!rejectionReason) {
        toast.error('Please provide a reason for rejection');
        return;
      }
    } else {
      // approve
      if (user.role === 'department_head') {
        targetStatus = 'pending_asset_manager';
      } else if (user.role === 'asset_manager' || user.role === 'admin') {
        targetStatus = 'approved';
      }
    }

    try {
      setSubmittingStatus(true);
      await api.patch(`/asset-requests/${selectedRequest.id}/status`, {
        status: targetStatus,
        rejectionReason: actionType === 'reject' ? rejectionReason : undefined,
      });
      toast.success(`Request ${actionType}d successfully`);
      setIsStatusModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionType} request`);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.category.name.toLowerCase().includes(search.toLowerCase()) ||
    req.requestedBy.name.toLowerCase().includes(search.toLowerCase()) ||
    req.status.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
             <Package className="w-4 h-4" />
          </div>
          <span className="font-semibold text-ink">{row.category.name}</span>
        </div>
      )
    },
    {
      key: 'requester',
      label: 'Requested By',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink">{row.requestedBy.name}</span>
          {row.requestedBy.department && (
            <span className="text-xs text-steel">Dept: {row.requestedBy.department.name}</span>
          )}
        </div>
      )
    },
    {
      key: 'justification',
      label: 'Justification',
      render: (row) => <span className="text-sm text-steel max-w-xs truncate block">{row.justification}</span>
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-steel">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
          row.status === 'approved' || row.status === 'allocated' ? 'bg-status-available/10 text-status-available border border-status-available/20' :
          row.status === 'rejected' ? 'bg-status-retired/10 text-status-retired border border-status-retired/20' :
          'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20'
        }`}>
          {row.status.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const canApproveDept = user.role === 'department_head' && row.status === 'pending_dept_head';
        const canApproveMgr = (user.role === 'asset_manager' || user.role === 'admin') && row.status === 'pending_asset_manager';
        
        if (canApproveDept || canApproveMgr) {
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedRequest(row);
                  setActionType('approve');
                  setIsStatusModalOpen(true);
                }}
                icon={Check}
                className="!p-1.5 !px-3 text-xs"
              >
                {canApproveMgr ? 'Issue' : 'Approve'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setSelectedRequest(row);
                  setActionType('reject');
                  setIsStatusModalOpen(true);
                }}
                icon={X}
                className="!p-1.5 !px-3 text-xs"
              >
                Reject
              </Button>
            </div>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">
            {['admin', 'asset_manager'].includes(user?.role) ? 'Issue Requests' : 'Asset Requests'}
          </h2>
          <p className="mt-1 text-sm text-steel">
            View and manage employee requests for new assets.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsRequestModalOpen(true)}
            icon={Plus}
          >
            Request New Asset
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white border border-hairline rounded-lg shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search requests by category, requester, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        loading={loading}
        emptyTitle="No asset requests"
        emptyDescription="There are no asset requests matching your criteria."
        emptyActionLabel="Request Asset"
        emptyOnAction={() => setIsRequestModalOpen(true)}
        emptyActionIcon={Plus}
      />

      {/* New Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedCategoryId('');
          setJustification('');
        }}
        title="Request New Asset"
      >
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset Category"
            id="req-category"
            type="select"
            required
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">Select Category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </FormField>

          <FormField
            label="Justification"
            id="req-justification"
            type="textarea"
            required
            placeholder="Why do you need this asset?"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingRequest}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
      >
        {selectedRequest && (
          <form onSubmit={handleStatusSubmit} className="flex flex-col gap-4">
            <div className="p-4 bg-surface border border-hairline rounded">
              <p className="text-xs uppercase font-bold text-steel">Request Details</p>
              <p className="text-sm font-semibold text-ink mt-2">
                {selectedRequest.requestedBy.name} requested a {selectedRequest.category.name}
              </p>
              <p className="text-xs text-steel italic mt-1">"{selectedRequest.justification}"</p>
            </div>

            {actionType === 'reject' && (
              <FormField
                label="Rejection Reason"
                id="reject-reason"
                type="textarea"
                required
                placeholder="Why is this request being rejected?"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            )}

            {actionType === 'approve' && (
              <p className="text-sm text-ink">
                Are you sure you want to approve this request?
                {user.role === 'department_head' && " It will be forwarded to the Asset Manager for final approval."}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant={actionType === 'approve' ? 'primary' : 'destructive'} 
                type="submit" 
                loading={submittingStatus}
              >
                {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
