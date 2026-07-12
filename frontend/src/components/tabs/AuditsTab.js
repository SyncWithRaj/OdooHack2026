'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Plus, Clipboard, Eye, Calendar, User, CheckCircle, AlertTriangle, FileSpreadsheet, Lock } from 'lucide-react';
import AssetTagChip from '../shared/AssetTagChip';
import StatusBadge from '../shared/StatusBadge';
import Button from '../shared/Button';
import FormField from '../shared/FormField';
import Modal from '../shared/Modal';
import DataTable from '../shared/DataTable';

export default function AuditsTab({ user }) {
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Cycle Details State
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [itemsSearch, setItemsSearch] = useState('');

  // Create Cycle Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [scopeType, setScopeType] = useState('all'); // all | department | location
  const [scopeDepartmentId, setScopeDepartmentId] = useState('');
  const [scopeLocation, setScopeLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAuditorIds, setSelectedAuditorIds] = useState([]);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Verify Item Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAssetId, setVerifyAssetId] = useState(null);
  const [verifyAssetName, setVerifyAssetName] = useState('');
  const [verifyAssetTag, setVerifyAssetTag] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('verified'); // verified | missing | damaged
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const fetchAuditCycles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audits');
      setCycles(res.data.data.auditCycles || []);

      const deptRes = await api.get('/departments');
      setDepartments(deptRes.data.data.departments || []);

      const empRes = await api.get('/employees');
      setEmployees(empRes.data.data.employees || []);
    } catch (err) {
      toast.error('Failed to load audit cycles directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/audits/${id}`);
      setSelectedCycle(res.data.data.auditCycle);
    } catch (err) {
      toast.error('Failed to load audit cycle details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditCycles();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      fetchCycleDetails(selectedCycleId);
    }
  }, [selectedCycleId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      toast.error('Title, start date, and end date are required');
      return;
    }

    if (scopeType === 'department' && !scopeDepartmentId) {
      toast.error('Please select a target department');
      return;
    }

    if (scopeType === 'location' && !scopeLocation) {
      toast.error('Please specify a target location');
      return;
    }

    try {
      setSubmittingCreate(true);
      await api.post('/audits', {
        title,
        scopeType,
        scopeDepartmentId: scopeType === 'department' ? parseInt(scopeDepartmentId) : undefined,
        scopeLocation: scopeType === 'location' ? scopeLocation : undefined,
        startDate,
        endDate,
        auditorIds: selectedAuditorIds.map(id => parseInt(id))
      });

      toast.success('Audit cycle created and items populated');
      setIsCreateModalOpen(false);
      // Reset
      setTitle('');
      setScopeType('all');
      setScopeDepartmentId('');
      setScopeLocation('');
      setStartDate('');
      setEndDate('');
      setSelectedAuditorIds([]);
      fetchAuditCycles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create audit cycle');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCycleId || !verifyAssetId) return;

    try {
      setSubmittingVerify(true);
      await api.post(`/audits/${selectedCycleId}/verify`, {
        assetId: verifyAssetId,
        status: verifyStatus,
        notes: verifyNotes
      });

      toast.success('Item verified successfully');
      setIsVerifyModalOpen(false);
      setVerifyAssetId(null);
      setVerifyAssetName('');
      setVerifyAssetTag('');
      setVerifyNotes('');
      fetchCycleDetails(selectedCycleId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify item');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleCloseCycle = async () => {
    if (!selectedCycleId) return;
    const confirmClose = window.confirm('Are you sure you want to close this audit cycle? This will lock all verified records, and missing assets will automatically transition to "Lost" state.');
    if (!confirmClose) return;

    try {
      const res = await api.post(`/audits/${selectedCycleId}/close`);
      toast.success(`Audit cycle closed successfully. ${res.data.data.discrepanciesCreated} discrepancies recorded.`);
      fetchAuditCycles();
      fetchCycleDetails(selectedCycleId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close audit cycle');
    }
  };

  const handleAuditorCheckboxChange = (id) => {
    if (selectedAuditorIds.includes(id)) {
      setSelectedAuditorIds(selectedAuditorIds.filter(x => x !== id));
    } else {
      setSelectedAuditorIds([...selectedAuditorIds, id]);
    }
  };

  const isAssignedAuditor = () => {
    if (!selectedCycle) return false;
    if (user.role === 'admin') return true; // Admins can audit anything
    return selectedCycle.auditors.some(a => a.id === user.id);
  };

  const filteredCycles = cycles.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.scopeLocation && c.scopeLocation.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      key: 'title',
      label: 'Audit Cycle Title',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 border border-accent/20 rounded text-accent">
            <Clipboard className="w-4 h-4" />
          </div>
          <span className="font-bold text-ink">{row.title}</span>
        </div>
      )
    },
    {
      key: 'scopeType',
      label: 'Scope Details',
      render: (row) => {
        if (row.scopeType === 'department') {
          return <span className="text-xs font-semibold text-steel">Dept: {row.scopeDepartment?.name}</span>;
        } else if (row.scopeType === 'location') {
          return <span className="text-xs font-semibold text-steel">Location: {row.scopeLocation}</span>;
        }
        return <span className="text-xs font-semibold text-steel">Org-Wide (All)</span>;
      }
    },
    {
      key: 'auditors',
      label: 'Auditors',
      render: (row) => (
        <span className="text-xs text-steel font-medium">
          {row.auditors.map(a => a.name).join(', ') || 'No auditors assigned'}
        </span>
      )
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (row) => (
        <span className="font-mono text-xs text-steel">
          {new Date(row.startDate).toLocaleDateString()} – {new Date(row.endDate).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'itemsCount',
      label: 'Items / Issues',
      render: (row) => (
        <div className="flex gap-2">
          <span className="font-mono text-xs font-semibold bg-surface border border-hairline px-2 py-0.5 rounded text-ink" title="Audit items">
            {row._count?.items ?? 0} items
          </span>
          {row._count?.discrepancies > 0 && (
            <span className="font-mono text-xs font-semibold bg-status-lost/10 border border-status-lost/25 px-2 py-0.5 rounded text-status-lost flex items-center gap-0.5" title="Discrepancies found">
              <AlertTriangle className="w-3 h-3" /> {row._count.discrepancies}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
          row.status === 'open' ? 'bg-status-available/10 text-status-available border-status-available/20' :
          'bg-status-disposed/10 text-status-disposed border-status-disposed/25'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => setSelectedCycleId(row.id)}
            icon={Eye}
            className="!p-1.5 !px-3 font-semibold text-xs"
          >
            Open Audit
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {selectedCycle ? (
        // Detailed Interactive Audit Cycle View
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-hairline pb-4">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => {
                  setSelectedCycle(null);
                  setSelectedCycleId(null);
                  fetchAuditCycles();
                }}
                className="text-xs font-bold text-accent hover:underline mb-1 text-left"
              >
                ← Back to Cycles List
              </button>
              <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">{selectedCycle.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  selectedCycle.status === 'open' ? 'bg-status-available/10 text-status-available' : 'bg-status-disposed/10 text-status-disposed'
                }`}>
                  {selectedCycle.status}
                </span>
                <span className="text-xs text-steel">• Scope: <span className="font-semibold text-ink capitalize">{selectedCycle.scopeType}</span></span>
                <span className="text-xs text-steel">• Auditor Assignees: <span className="font-semibold text-ink">{selectedCycle.auditors.map(a => a.name).join(', ')}</span></span>
              </div>
            </div>

            {selectedCycle.status === 'open' && ['admin', 'asset_manager'].includes(user.role) && (
              <Button
                variant="destructive"
                onClick={handleCloseCycle}
                icon={Lock}
              >
                Close & Lock Cycle
              </Button>
            )}
          </div>

          {detailsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-steel text-sm">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Loading audit items scope...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audit items list table */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm flex items-center gap-2">
                  <Search className="w-5 h-5 text-steel" />
                  <input
                    type="text"
                    placeholder="Filter audit items list..."
                    value={itemsSearch}
                    onChange={(e) => setItemsSearch(e.target.value)}
                    className="block w-full border-none bg-transparent text-ink text-sm focus:outline-none placeholder-steel/50"
                  />
                </div>

                <div className="bg-white border border-hairline rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-hairline">
                      <thead className="bg-surface">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Asset</th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Verified By</th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-steel">Audit Status</th>
                          <th className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline bg-white">
                        {selectedCycle.items
                          .filter(item => item.asset.name.toLowerCase().includes(itemsSearch.toLowerCase()) || item.asset.assetTag.toLowerCase().includes(itemsSearch.toLowerCase()))
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <AssetTagChip tag={item.asset.assetTag} />
                                  <span className="font-semibold text-ink text-sm">{item.asset.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-steel">
                                {item.verifiedBy ? (
                                  <span className="font-medium text-ink">{item.verifiedBy.name}</span>
                                ) : <span className="text-steel/40">Unverified</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold capitalize ${
                                  item.status === 'verified' ? 'bg-status-available/10 text-status-available border border-status-available/20' :
                                  item.status === 'missing' ? 'bg-status-lost/10 text-status-lost border border-status-lost/20' :
                                  item.status === 'damaged' ? 'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20' :
                                  'bg-status-retired/10 text-status-retired border border-status-retired/20'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                {selectedCycle.status === 'open' && isAssignedAuditor() && (
                                  <Button
                                    variant="secondary"
                                    onClick={() => {
                                      setVerifyAssetId(item.assetId);
                                      setVerifyAssetName(item.asset.name);
                                      setVerifyAssetTag(item.asset.assetTag);
                                      setVerifyStatus(item.status !== 'unverified' ? item.status : 'verified');
                                      setVerifyNotes(item.notes || '');
                                      setIsVerifyModalOpen(true);
                                    }}
                                    icon={CheckCircle}
                                    className="!py-1"
                                  >
                                    Verify
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Side Information Panel: Discrepancy & Closed cycle summaries */}
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2">
                    Discrepancy Report
                  </h3>
                  
                  {selectedCycle.status === 'open' ? (
                    <div className="text-xs text-steel flex flex-col gap-2">
                      <p>Discrepancy records will compile and lock once this audit cycle closes.</p>
                      <p className="font-semibold text-status-maintenance">
                        Current unverified count: {selectedCycle.items.filter(i => i.status === 'unverified').length} / {selectedCycle.items.length}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {selectedCycle.discrepancies && selectedCycle.discrepancies.length > 0 ? (
                        selectedCycle.discrepancies.map(disc => (
                          <div key={disc.id} className="p-3 border border-hairline rounded bg-status-lost/5 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 text-status-lost font-semibold text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Discrepancy Found</span>
                            </div>
                            <span className="text-xs font-bold text-ink">{disc.asset.name}</span>
                            <div className="flex justify-between text-[10px] text-steel">
                              <span>Expected: {disc.expectedStatus}</span>
                              <span className="font-bold text-status-lost">Found: {disc.foundStatus}</span>
                            </div>
                            {disc.details && (
                              <p className="text-[10px] text-steel italic mt-1 font-mono">{disc.details}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-status-available font-semibold bg-status-available/5 border border-status-available/20 rounded">
                          ✓ Perfect Match. No discrepancies found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // List of audit cycles
        <div className="flex flex-col gap-6">
          <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
            <div>
              <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider">Asset Auditing</h2>
              <p className="mt-1 text-sm text-steel">
                Conduct periodic physically verification sweeps, track missing inventory, and compile discrepancy reports.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button 
                variant="secondary"
                onClick={() => fetchAuditCycles()}
                icon={RefreshCw}
              >
                Refresh
              </Button>
              {user.role === 'admin' && (
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={Plus}
                >
                  Create Cycle
                </Button>
              )}
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
                placeholder="Search audit cycles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-hairline rounded-md bg-white text-ink text-sm placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          {/* Cycles Table */}
          <DataTable
            columns={columns}
            data={filteredCycles}
            loading={loading}
            emptyTitle="No audit cycles registered"
            emptyDescription="Create an audit cycle scope to begin physically verifying asset inventory."
            emptyActionLabel={user.role === 'admin' ? "Create First Cycle" : null}
            emptyOnAction={user.role === 'admin' ? () => setIsCreateModalOpen(true) : null}
            emptyActionIcon={Plus}
          />
        </div>
      )}

      {/* Create Cycle Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision Audit Cycle"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <FormField
            label="Audit Cycle Title"
            id="audit-title"
            required
            placeholder="e.g. Q3 Hardware Physical Verification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Start Date"
              id="audit-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormField
              label="End Date"
              id="audit-end"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <FormField
            label="Audit Scope Classification"
            id="audit-scope-type"
            type="select"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
          >
            <option value="all">Org-Wide (All Assets)</option>
            <option value="department">Department Scope</option>
            <option value="location">Location Scope</option>
          </FormField>

          {scopeType === 'department' && (
            <FormField
              label="Target Department"
              id="audit-scope-dept"
              type="select"
              required
              value={scopeDepartmentId}
              onChange={(e) => setScopeDepartmentId(e.target.value)}
            >
              <option value="">Select Department...</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </FormField>
          )}

          {scopeType === 'location' && (
            <FormField
              label="Target Location"
              id="audit-scope-loc"
              type="select"
              required
              value={scopeLocation}
              onChange={(e) => setScopeLocation(e.target.value)}
            >
              <option value="">Select Location...</option>
              <option value="HQ">HQ</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Remote">Remote</option>
            </FormField>
          )}

          {/* Assigned Auditors Multiselect (simple checklist) */}
          <div className="flex flex-col gap-1.5 border-t border-hairline pt-3">
            <span className="text-xs uppercase font-bold text-steel">Assign Auditors</span>
            <div className="max-h-36 overflow-y-auto border border-hairline rounded p-2 flex flex-col gap-1 bg-white">
              {employees.map(emp => (
                <label key={emp.id} className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer hover:bg-surface p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedAuditorIds.includes(emp.id.toString())}
                    onChange={() => handleAuditorCheckboxChange(emp.id.toString())}
                    className="rounded border-hairline text-accent focus:ring-accent w-4 h-4"
                  />
                  <span>{emp.name} ({emp.email})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submittingCreate}>Spin Up Audit</Button>
          </div>
        </form>
      </Modal>

      {/* Verify Item Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setVerifyAssetId(null);
        }}
        title="Verify Asset Location & Condition"
      >
        <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
          <div className="p-4 bg-surface border border-hairline rounded">
            <span className="text-xs font-bold uppercase text-steel">Verifying Asset</span>
            <div className="flex items-center gap-2 mt-1">
              <AssetTagChip tag={verifyAssetTag} />
              <span className="text-sm font-bold text-ink">{verifyAssetName}</span>
            </div>
          </div>

          <FormField
            label="Verification Result Status"
            id="ver-status"
            type="select"
            required
            value={verifyStatus}
            onChange={(e) => setVerifyStatus(e.target.value)}
          >
            <option value="verified">Verified (Perfect Alignment)</option>
            <option value="damaged">Damaged (Needs Repair/Upkeep)</option>
            <option value="missing">Missing (Unaccounted For)</option>
          </FormField>

          <FormField
            label="Auditor Field Notes"
            id="ver-notes"
            type="textarea"
            placeholder="Record condition details, checked serial number labels or location updates..."
            value={verifyNotes}
            onChange={(e) => setVerifyNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-4 border-t border-hairline pt-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsVerifyModalOpen(false);
                setVerifyAssetId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submittingVerify}>Record Verification</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
