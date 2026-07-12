'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, ArrowRightLeft, Check, X, ShieldAlert } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function TransfersTab({ user }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transfers');
      setTransfers(res.data.data.transfers || []);
    } catch (err) {
      toast.error('Failed to load transfers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleApprove = async (id) => {
    try {
      const confirmApprove = window.confirm('Are you sure you want to approve this transfer? The asset will be immediately re-allocated.');
      if (!confirmApprove) return;

      const res = await api.patch(`/transfers/${id}/approve`);
      toast.success('Transfer request approved and asset re-allocated');
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve transfer');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please specify a reason for rejection');
      return;
    }

    try {
      setSubmittingReject(true);
      await api.patch(`/transfers/${selectedTransferId}/reject`, {
        rejectionReason
      });
      toast.success('Transfer request rejected');
      setIsRejectModalOpen(false);
      setSelectedTransferId(null);
      setRejectionReason('');
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject transfer');
    } finally {
      setSubmittingReject(false);
    }
  };

  const isEligibleToApprove = (transfer) => {
    if (transfer.status === 'requested') {
      // Department Head approval step
      if (user.role === 'department_head') {
        return transfer.targetDeptId === user.departmentId || transfer.targetUser?.departmentId === user.departmentId || transfer.currentAllocation?.assignedToDeptId === user.departmentId || transfer.currentAllocation?.assignedToUser?.departmentId === user.departmentId;
      }
    } else if (transfer.status === 'pending_asset_manager') {
      // Asset Manager / Admin approval step
      if (['admin', 'asset_manager'].includes(user.role)) {
        return true;
      }
    }
    return false;
  };

  const filteredTransfers = transfers.filter(t => 
    t.asset.name.toLowerCase().includes(search.toLowerCase()) ||
    t.asset.assetTag.toLowerCase().includes(search.toLowerCase()) ||
    t.requestedBy.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.targetUser && t.targetUser.name.toLowerCase().includes(search.toLowerCase())) ||
    (t.targetDept && t.targetDept.name.toLowerCase().includes(search.toLowerCase()))
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
      key: 'requestedBy',
      label: 'Requested By',
      sortable: true,
      render: (row) => <span className="font-semibold text-ink">{row.requestedBy.name}</span>
    },
    {
      key: 'target',
      label: 'Transfer To',
      sortable: true,
      render: (row) => {
        if (row.targetUser) {
          return <span className="font-semibold text-ink">User: {row.targetUser.name}</span>;
        } else if (row.targetDept) {
          return <span className="font-semibold text-ink">Dept: {row.targetDept.name}</span>;
        }
        return '—';
      }
    },
    {
      key: 'createdAt',
      label: 'Requested At',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-steel">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge domain="transfer" status={row.status} />
    },
    {
      key: 'notes',
      label: 'Details/Reason',
      render: (row) => (
        <span className="text-xs text-steel block max-w-xs truncate" title={row.rejectionReason}>
          {row.status === 'rejected' ? `Rejected: ${row.rejectionReason}` : 'Pending review'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        if ((row.status === 'requested' || row.status === 'pending_asset_manager') && isEligibleToApprove(row)) {
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => handleApprove(row.id)}
                icon={Check}
                className="!p-1.5 !px-3 hover:!bg-status-available/10 hover:!text-status-available font-semibold text-xs border-status-available/20"
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedTransferId(row.id);
                  setIsRejectModalOpen(true);
                }}
                icon={X}
                className="!p-1.5 !px-3 hover:!bg-status-lost/10 hover:!text-status-lost font-semibold text-xs border-status-lost/20"
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
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Asset Transfers</h2>
          <p className="mt-1 text-sm text-steel">
            Approve or reject asset ownership transfer requests between employees and departments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchTransfers()}
            icon={RefreshCw}
          >
            Refresh
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
            placeholder="Search transfer requests by asset, target or requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        loading={loading}
        emptyTitle="No transfer requests"
        emptyDescription="There are no transfer requests currently registered in the system."
      />

      {/* Reject Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedTransferId(null);
        }}
        title="Reject Transfer Request"
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
          <FormField
            label="Rejection Reason"
            id="rej-reason"
            type="textarea"
            required
            placeholder="Specify why this transfer request is being rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedTransferId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingReject}>Reject Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
