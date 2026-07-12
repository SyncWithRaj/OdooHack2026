'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Calendar, ArrowRightLeft, User, Building, AlertTriangle, ShieldCheck } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';
import WorkflowPipeline from '../shared/WorkflowPipeline';

export default function AllocationsTab({ user, refreshAssets }) {
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isManager = ['admin', 'asset_manager'].includes(user?.role);

  // Allocate Modal state
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assigneeType, setAssigneeType] = useState('user'); // user | dept
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [assignedToDeptId, setAssignedToDeptId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [submittingAllocate, setSubmittingAllocate] = useState(false);

  // Return Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Transfer Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAllocationId, setTransferAllocationId] = useState(null);
  const [transferAsset, setTransferAsset] = useState(null);
  const [transferHolderName, setTransferHolderName] = useState('');
  const [transferTargetType, setTransferTargetType] = useState('user'); // user | dept
  const [transferTargetUserId, setTransferTargetUserId] = useState('');
  const [transferTargetDeptId, setTransferTargetDeptId] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const fetchAllocationsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/allocations');
      setAllocations(res.data.data.allocations || []);

      const assetsRes = await api.get('/assets');
      setAssets(assetsRes.data.data.assets || []);

      if (isManager) {
        const empRes = await api.get('/employees');
        setEmployees(empRes.data.data.employees || []);

        const deptRes = await api.get('/departments');
        setDepartments(deptRes.data.data.departments || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load allocations directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocationsData();
  }, []);

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an asset');
      return;
    }

    const asset = assets.find(a => a.id === parseInt(selectedAssetId));
    if (asset?.status === 'allocated') {
      toast.error('Asset is already allocated. Use Transfer Request instead.');
      return;
    }

    try {
      setSubmittingAllocate(true);
      await api.post('/allocations', {
        assetId: parseInt(selectedAssetId),
        assignedToUserId: assigneeType === 'user' ? parseInt(assignedToUserId) : undefined,
        assignedToDeptId: assigneeType === 'dept' ? parseInt(assignedToDeptId) : undefined,
        expectedReturnDate: expectedReturnDate || undefined
      });
      toast.success('Asset allocated successfully');
      setIsAllocateModalOpen(false);
      // Reset
      setSelectedAssetId('');
      setAssignedToUserId('');
      setAssignedToDeptId('');
      setExpectedReturnDate('');
      fetchAllocationsData();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate asset');
    } finally {
      setSubmittingAllocate(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocation) return;
    try {
      setSubmittingReturn(true);
      await api.post(`/allocations/${selectedAllocation.id}/return`, {
        returnConditionNotes: returnNotes
      });
      toast.success('Asset returned to inventory');
      setIsReturnModalOpen(false);
      setSelectedAllocation(null);
      setReturnNotes('');
      fetchAllocationsData();
      if (refreshAssets) refreshAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferAllocationId) return;

    try {
      setSubmittingTransfer(true);
      await api.post(`/allocations/${transferAllocationId}/transfer`, {
        targetUserId: transferTargetType === 'user' ? parseInt(transferTargetUserId) : undefined,
        targetDeptId: transferTargetType === 'dept' ? parseInt(transferTargetDeptId) : undefined
      });
      toast.success('Transfer request submitted successfully');
      setIsTransferModalOpen(false);
      setTransferAllocationId(null);
      setTransferAsset(null);
      setTransferHolderName('');
      setTransferTargetUserId('');
      setTransferTargetDeptId('');
      fetchAllocationsData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transfer request');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Find active holder info for selected asset in allocate modal (Conflict Check)
  const getSelectedAssetConflict = () => {
    if (!selectedAssetId) return null;
    const asset = assets.find(a => a.id === parseInt(selectedAssetId));
    if (asset?.status === 'allocated') {
      const activeAlloc = allocations.find(a => a.assetId === asset.id && a.status === 'active');
      const holderName = activeAlloc?.assignedToUser?.name || activeAlloc?.assignedToDept?.name || 'an employee';
      return {
        holderName,
        allocationId: activeAlloc?.id,
        asset
      };
    }
    return null;
  };

  const conflict = getSelectedAssetConflict();

  const filteredAllocations = allocations.filter(alloc => 
    alloc.asset.name.toLowerCase().includes(search.toLowerCase()) ||
    alloc.asset.assetTag.toLowerCase().includes(search.toLowerCase()) ||
    (alloc.assignedToUser && alloc.assignedToUser.name.toLowerCase().includes(search.toLowerCase())) ||
    (alloc.assignedToDept && alloc.assignedToDept.name.toLowerCase().includes(search.toLowerCase()))
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
      key: 'assignee',
      label: 'Assigned To',
      sortable: true,
      render: (row) => {
        if (row.assignedToUser) {
          return (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-steel" />
              <div className="flex flex-col">
                <span className="font-semibold text-ink">{row.assignedToUser.name}</span>
                <span className="text-xs text-steel/60">{row.assignedToUser.email}</span>
              </div>
            </div>
          );
        } else if (row.assignedToDept) {
          return (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-steel" />
              <span className="font-semibold text-ink">Dept: {row.assignedToDept.name}</span>
            </div>
          );
        }
        return '—';
      }
    },
    {
      key: 'allocationDate',
      label: 'Allocation Date',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-steel">{new Date(row.allocationDate).toLocaleDateString()}</span>
    },
    {
      key: 'expectedReturnDate',
      label: 'Expected Return',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-steel">
          {row.expectedReturnDate ? new Date(row.expectedReturnDate).toLocaleDateString() : 'No Limit'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
          row.status === 'active' ? 'bg-status-available/10 text-status-available border border-status-available/20' :
          row.status === 'returned' ? 'bg-status-retired/10 text-status-retired border border-status-retired/20' :
          'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const isOverdue = row.status === 'active' && row.expectedReturnDate && new Date(row.expectedReturnDate) < new Date();
        return (
          <div className="flex justify-end gap-2">
            {row.status === 'active' && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTransferAllocationId(row.id);
                    setTransferAsset(row.asset);
                    setTransferHolderName(row.assignedToUser?.name || row.assignedToDept?.name || 'unknown');
                    setIsTransferModalOpen(true);
                  }}
                  icon={ArrowRightLeft}
                  className="!p-1.5 !px-1.5 hover:!text-accent"
                  title="Initiate Transfer"
                />
                {isManager && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedAllocation(row);
                      setIsReturnModalOpen(true);
                    }}
                    className={`!p-1.5 !px-3 font-semibold text-xs ${isOverdue ? 'border-status-lost hover:bg-status-lost/5' : ''}`}
                  >
                    Return
                  </Button>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ];

  const allocationSteps = [
    {
      id: 'registered',
      label: 'Inventory',
      description: 'Asset logged in system',
      status: 'completed',
      icon: ShieldCheck
    },
    {
      id: 'assigned',
      label: 'Assignment',
      description: 'Assignee selected',
      status: 'completed',
      icon: User
    },
    {
      id: 'active',
      label: 'Active Service',
      description: 'Asset in active service',
      status: 'current',
      icon: ArrowRightLeft
    },
    {
      id: 'returned',
      label: 'Returned',
      description: 'Re-inventoried or transferred',
      status: 'upcoming',
      icon: RefreshCw
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Asset Allocations</h2>
          <p className="mt-1 text-sm text-steel">
            Manage allocations to staff and departments, record returns, or start transfer requests.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchAllocationsData()}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          {isManager && (
            <Button
              variant="primary"
              onClick={() => setIsAllocateModalOpen(true)}
              icon={Plus}
            >
              Allocate Asset
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Visualization */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold font-mono text-steel uppercase tracking-wider">Allocation Lifecycle Pipeline</h3>
        <WorkflowPipeline steps={allocationSteps} />
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white border border-hairline rounded-lg shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search allocations by asset, holder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredAllocations}
        loading={loading}
        emptyTitle="No allocations active"
        emptyDescription={isManager ? "Allocate an asset to a user or department to get started." : "No allocations fit your search query."}
        emptyActionLabel={isManager ? "Allocate Asset" : null}
        emptyOnAction={isManager ? () => setIsAllocateModalOpen(true) : null}
        emptyActionIcon={Plus}
      />

      {/* Allocate Modal (with Conflict Check) */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => {
          setIsAllocateModalOpen(false);
          setSelectedAssetId('');
        }}
        title="Allocate Asset"
      >
        <form onSubmit={handleAllocateSubmit} className="flex flex-col gap-4">
          <FormField
            label="Asset to Allocate"
            id="alloc-asset"
            type="select"
            required
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          >
            <option value="">Select Asset...</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag}) — Status: {asset.status}
              </option>
            ))}
          </FormField>

          {/* Conflict Warning & Transfer Request CTA */}
          {conflict ? (
            <div className="p-4 bg-status-lost/5 border border-status-lost/20 rounded flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 text-status-lost">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider font-display">Conflict Detected</p>
                  <p className="text-xs text-steel mt-0.5">
                    This asset is currently allocated to <span className="font-bold text-ink">{conflict.holderName}</span>.
                  </p>
                </div>
              </div>
              <div className="flex justify-end border-t border-status-lost/10 pt-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsAllocateModalOpen(false);
                    setTransferAllocationId(conflict.allocationId);
                    setTransferAsset(conflict.asset);
                    setTransferHolderName(conflict.holderName);
                    setIsTransferModalOpen(true);
                  }}
                  icon={ArrowRightLeft}
                  className="!py-1"
                >
                  Request Transfer
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 bg-surface p-3 rounded border border-hairline">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-steel cursor-pointer">
                  <input
                    type="radio"
                    name="assignee-type"
                    checked={assigneeType === 'user'}
                    onChange={() => setAssigneeType('user')}
                    className="text-accent focus:ring-accent"
                  />
                  Employee
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-steel cursor-pointer">
                  <input
                    type="radio"
                    name="assignee-type"
                    checked={assigneeType === 'dept'}
                    onChange={() => setAssigneeType('dept')}
                    className="text-accent focus:ring-accent"
                  />
                  Department
                </label>
              </div>

              {assigneeType === 'user' ? (
                <FormField
                  label="Target Employee"
                  id="alloc-user"
                  type="select"
                  required
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </FormField>
              ) : (
                <FormField
                  label="Target Department"
                  id="alloc-dept"
                  type="select"
                  required
                  value={assignedToDeptId}
                  onChange={(e) => setAssignedToDeptId(e.target.value)}
                >
                  <option value="">Select Department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </FormField>
              )}

              <FormField
                label="Expected Return Date"
                id="alloc-return-date"
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />

              <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsAllocateModalOpen(false);
                    setSelectedAssetId('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={submittingAllocate}>Allocate Asset</Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedAllocation(null);
        }}
        title="Process Asset Return"
      >
        {selectedAllocation && (
          <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
            <div className="p-4 bg-surface border border-hairline rounded">
              <p className="text-xs uppercase font-bold text-steel">Returning Asset</p>
              <div className="flex items-center gap-2 mt-1">
                <AssetTagChip tag={selectedAllocation.asset.assetTag} />
                <span className="text-sm font-semibold text-ink">{selectedAllocation.asset.name}</span>
              </div>
              <p className="text-xs text-steel mt-2">
                Held by:{' '}
                <span className="font-semibold text-ink">
                  {selectedAllocation.assignedToUser?.name || selectedAllocation.assignedToDept?.name}
                </span>
              </p>
            </div>

            <FormField
              label="Return Condition Notes"
              id="ret-notes"
              type="textarea"
              placeholder="Record any damage, serial number verification or general comments..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsReturnModalOpen(false);
                  setSelectedAllocation(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submittingReturn}>Confirm Return</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Transfer Request Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferAllocationId(null);
          setTransferAsset(null);
        }}
        title="Initiate Transfer Request"
      >
        {transferAsset && (
          <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
            <div className="p-4 bg-surface border border-hairline rounded">
              <p className="text-xs uppercase font-bold text-steel">Transferring Asset</p>
              <div className="flex items-center gap-2 mt-1">
                <AssetTagChip tag={transferAsset.assetTag} />
                <span className="text-sm font-semibold text-ink">{transferAsset.name}</span>
              </div>
              <p className="text-xs text-steel mt-2">
                Current Holder: <span className="font-semibold text-ink">{transferHolderName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-surface p-3 rounded border border-hairline">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-steel cursor-pointer">
                <input
                  type="radio"
                  name="transfer-target-type"
                  checked={transferTargetType === 'user'}
                  onChange={() => setTransferTargetType('user')}
                  className="text-accent focus:ring-accent"
                />
                To Employee
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-steel cursor-pointer">
                <input
                  type="radio"
                  name="transfer-target-type"
                  checked={transferTargetType === 'dept'}
                  onChange={() => setTransferTargetType('dept')}
                  className="text-accent focus:ring-accent"
                />
                To Department
              </label>
            </div>

            {transferTargetType === 'user' ? (
              <FormField
                label="Transfer Target User"
                id="transfer-user"
                type="select"
                required
                value={transferTargetUserId}
                onChange={(e) => setTransferTargetUserId(e.target.value)}
              >
                <option value="">Select Target User...</option>
                {employees
                  .filter(e => e.name !== transferHolderName)
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
              </FormField>
            ) : (
              <FormField
                label="Transfer Target Department"
                id="transfer-dept"
                type="select"
                required
                value={transferTargetDeptId}
                onChange={(e) => setTransferTargetDeptId(e.target.value)}
              >
                <option value="">Select Target Department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </FormField>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferAllocationId(null);
                  setTransferAsset(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submittingTransfer}>Submit Transfer Request</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
