'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ClipboardCheck } from 'lucide-react';

export default function AuditTab({ user }) {
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleDetail, setCycleDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', scopeType: 'location', scopeLocation: '', startDate: '', endDate: '' });

  useEffect(() => { loadCycles(); }, []);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audits');
      setCycles(res.data.data.auditCycles || []);
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCycleDetail = async (id) => {
    try {
      const res = await api.get(`/audits/${id}`);
      setCycleDetail(res.data.data.auditCycle || res.data.data);
      setSelectedCycle(id);
    } catch (err) {
      toast.error('Failed to load audit details');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/audits', form);
      toast.success('Audit cycle created');
      setShowCreateModal(false);
      setForm({ title: '', scopeType: 'location', scopeLocation: '', startDate: '', endDate: '' });
      loadCycles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create audit');
    }
  };

  const handleVerifyItem = async (itemId, status) => {
    try {
      await api.post(`/audits/${selectedCycle}/verify`, { auditItemId: itemId, status, conditionNotes: '' });
      toast.success(`Item marked as ${status}`);
      loadCycleDetail(selectedCycle);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleCloseCycle = async () => {
    try {
      await api.post(`/audits/${selectedCycle}/close`);
      toast.success('Audit cycle closed');
      setSelectedCycle(null);
      setCycleDetail(null);
      loadCycles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close audit');
    }
  };

  const getVerificationBadge = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      missing: 'bg-red-100 text-red-800',
      damaged: 'bg-orange-100 text-orange-800',
      unverified: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Detail view when a cycle is selected
  if (selectedCycle && cycleDetail) {
    const items = cycleDetail.items || cycleDetail.auditItems || [];
    const discrepancies = items.filter(i => i.status === 'missing' || i.status === 'damaged');

    return (
      <div>
        <button onClick={() => { setSelectedCycle(null); setCycleDetail(null); }} className="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back to cycles</button>
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900">{cycleDetail.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Auditors: {cycleDetail.scopeLocation || 'All locations'} • {cycleDetail.startDate} to {cycleDetail.endDate}
          </p>
          <span className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${cycleDetail.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {cycleDetail.status}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                {cycleDetail.status === 'open' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <span className="font-mono text-xs text-blue-600 mr-2">{item.asset?.assetTag}</span>
                    {item.asset?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.asset?.location || '—'}</td>
                  <td className="px-6 py-4">{getVerificationBadge(item.status)}</td>
                  {cycleDetail.status === 'open' && (
                    <td className="px-6 py-4 flex gap-2">
                      {item.status === 'unverified' && (
                        <>
                          <button onClick={() => handleVerifyItem(item.id, 'verified')} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">Verified</button>
                          <button onClick={() => handleVerifyItem(item.id, 'missing')} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">Missing</button>
                          <button onClick={() => handleVerifyItem(item.id, 'damaged')} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded hover:bg-orange-100">Damaged</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {discrepancies.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {discrepancies.length} asset(s) flagged — discrepancy report generated automatically
          </div>
        )}

        {cycleDetail.status === 'open' && ['admin', 'asset_manager'].includes(user?.role) && (
          <button onClick={handleCloseCycle} className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-900">
            Close audit cycle
          </button>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audit Cycles</h2>
        {['admin'].includes(user?.role) && (
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> Create Audit
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="space-y-3">
          {cycles.map(cycle => (
            <div
              key={cycle.id}
              onClick={() => loadCycleDetail(cycle.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{cycle.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cycle.startDate} to {cycle.endDate} • {cycle.scopeLocation || 'All'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cycle.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {cycle.status}
                </span>
              </div>
            </div>
          ))}
          {cycles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No audit cycles yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Audit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Audit Cycle</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Q3 HQ Verification" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope Location</label>
                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.scopeLocation} onChange={(e) => setForm({...form, scopeLocation: e.target.value})} placeholder="e.g. HQ - 3rd Floor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
