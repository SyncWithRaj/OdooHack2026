'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ArrowRightLeft, CornerDownRight } from 'lucide-react';

export default function AllocationsTab({ user }) {
  const [subTab, setSubTab] = useState('allocations');
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ assetId: '', assignedToUserId: '', expectedReturnDate: '', allocationNotes: '' });
  const [transferForm, setTransferForm] = useState({ allocationId: '', targetUserId: '', reason: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allocRes, transRes, assetRes, empRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/transfers'),
        api.get('/assets'),
        api.get('/employees').catch(() => ({ data: { data: { employees: [] } } })),
      ]);
      setAllocations(allocRes.data.data.allocations || []);
      setTransfers(transRes.data.data.transfers || []);
      setAssets(assetRes.data.data.assets || []);
      setEmployees(empRes.data.data.employees || []);
    } catch (err) {
      console.error('Failed to load allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...allocForm };
      if (!payload.expectedReturnDate) delete payload.expectedReturnDate;
      await api.post('/allocations', payload);
      toast.success('Asset allocated successfully');
      setShowAllocModal(false);
      setAllocForm({ assetId: '', assignedToUserId: '', expectedReturnDate: '', allocationNotes: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    }
  };

  const handleReturn = async (allocId) => {
    try {
      await api.post(`/allocations/${allocId}/return`, { returnConditionNotes: 'Returned in good condition' });
      toast.success('Asset returned');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
  };

  const handleTransferRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${transferForm.allocationId}/transfer`, { 
        targetUserId: parseInt(transferForm.targetUserId),
        rejectionReason: transferForm.reason // Using this field name based on typical schema mappings or we can pass a notes field if supported
      });
      toast.success('Transfer request submitted');
      setShowTransferModal(false);
      setTransferForm({ allocationId: '', targetUserId: '', reason: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer request failed');
    }
  };

  const handleApproveTransfer = async (id) => {
    try {
      await api.patch(`/transfers/${id}/approve`);
      toast.success('Transfer approved');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleRejectTransfer = async (id) => {
    try {
      await api.patch(`/transfers/${id}/reject`, { rejectionReason: 'Rejected by admin' });
      toast.success('Transfer rejected');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      returned: 'bg-gray-100 text-gray-800',
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const availableAssets = assets.filter(a => a.status === 'available');
  const activeAllocations = allocations.filter(a => a.status === 'active');

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setSubTab('allocations')} className={`px-4 py-2 rounded-md text-sm font-medium ${subTab === 'allocations' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          Allocations
        </button>
        <button onClick={() => setSubTab('transfers')} className={`px-4 py-2 rounded-md text-sm font-medium ${subTab === 'transfers' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          Transfers
        </button>
        {['admin', 'asset_manager'].includes(user?.role) && subTab === 'allocations' && (
          <button onClick={() => setShowAllocModal(true)} className="ml-auto inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Allocate Asset
          </button>
        )}
        {subTab === 'transfers' && (
          <button onClick={() => setShowTransferModal(true)} className="ml-auto inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            <ArrowRightLeft className="h-4 w-4 mr-1" /> Request Transfer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* Allocations Table */}
          {subTab === 'allocations' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allocations.map(alloc => (
                    <tr key={alloc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <span className="font-mono text-xs text-blue-600 mr-2">{alloc.asset?.assetTag}</span>
                        <span className="font-medium text-gray-900">{alloc.asset?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{alloc.assignedToUser?.name || alloc.assignedToDept?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">{getStatusBadge(alloc.status)}</td>
                      <td className="px-6 py-4">
                        {alloc.status === 'active' && ['admin', 'asset_manager'].includes(user?.role) && (
                          <button onClick={() => handleReturn(alloc.id)} className="text-xs text-blue-600 hover:underline">Return</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allocations.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No allocations found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Transfers Table */}
          {subTab === 'transfers' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.asset?.name || `Asset #${t.assetId}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.requestedBy?.name || t.requestedByUser?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.targetUser?.name || '—'}</td>
                      <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                      <td className="px-6 py-4 flex gap-2">
                        {t.status === 'requested' && ['admin', 'asset_manager', 'department_head'].includes(user?.role) && (
                          <>
                            <button onClick={() => handleApproveTransfer(t.id)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">Approve</button>
                            <button onClick={() => handleRejectTransfer(t.id)} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">Reject</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No transfer requests.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Allocate Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Allocate Asset</h3>
              <button onClick={() => setShowAllocModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={allocForm.assetId} onChange={(e) => setAllocForm({...allocForm, assetId: e.target.value})}>
                  <option value="">Select available asset</option>
                  {availableAssets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={allocForm.assignedToUserId} onChange={(e) => setAllocForm({...allocForm, assignedToUserId: e.target.value})}>
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={allocForm.expectedReturnDate} onChange={(e) => setAllocForm({...allocForm, expectedReturnDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Notes</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional notes" value={allocForm.allocationNotes} onChange={(e) => setAllocForm({...allocForm, allocationNotes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAllocModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Transfer</h3>
              <button onClick={() => setShowTransferModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleTransferRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Allocation</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={transferForm.allocationId} onChange={(e) => setTransferForm({...transferForm, allocationId: e.target.value})}>
                  <option value="">Select allocation to transfer</option>
                  {activeAllocations.map(a => <option key={a.id} value={a.id}>{a.asset?.assetTag} — {a.asset?.name} (held by {a.assignedToUser?.name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={transferForm.targetUserId} onChange={(e) => setTransferForm({...transferForm, targetUserId: e.target.value})}>
                  <option value="">Select target employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional reason" value={transferForm.reason} onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
