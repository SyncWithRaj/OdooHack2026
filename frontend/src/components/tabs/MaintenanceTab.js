'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, X } from 'lucide-react';

const COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'border-gray-300 bg-gray-50' },
  { key: 'approved', label: 'Approved', color: 'border-yellow-300 bg-yellow-50' },
  { key: 'technician_assigned', label: 'Technician assigned', color: 'border-blue-300 bg-blue-50' },
  { key: 'in_progress', label: 'In progress', color: 'border-purple-300 bg-purple-50' },
  { key: 'resolved', label: 'Resolved', color: 'border-green-300 bg-green-50' },
];

export default function MaintenanceTab({ user }) {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'medium' });

  // Status change modal
  const [statusModal, setStatusModal] = useState(null);
  const [techName, setTechName] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [maintRes, assetRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets'),
      ]);
      setRequests(maintRes.data.data.maintenanceRequests || []);
      setAssets(assetRes.data.data.assets || []);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', form);
      toast.success('Maintenance request created');
      setShowModal(false);
      setForm({ assetId: '', description: '', priority: 'medium' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === 'resolved') {
        await api.post(`/maintenance/${id}/resolve`, { resolutionNotes: resolveNotes || 'Resolved' });
      } else {
        const body = { status: newStatus };
        if (newStatus === 'technician_assigned' && techName) {
          body.technicianName = techName;
        }
        await api.patch(`/maintenance/${id}/status`, body);
      }
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      setStatusModal(null);
      setTechName('');
      setResolveNotes('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const getNextStatus = (current) => {
    const flow = { pending: 'approved', approved: 'technician_assigned', technician_assigned: 'in_progress', in_progress: 'resolved' };
    return flow[current];
  };

  const getPriorityColor = (priority) => {
    const colors = { low: 'text-gray-600', medium: 'text-yellow-600', high: 'text-orange-600', urgent: 'text-red-600' };
    return colors[priority] || 'text-gray-600';
  };

  const getCardBg = (status) => {
    if (status === 'resolved') return 'bg-green-700 text-white';
    return 'bg-white text-gray-900';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
          <p className="mt-1 text-xs text-gray-400">Approving a card moves the asset to under maintenance, resolving returns it to available.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Raise Request
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const items = requests.filter(r => r.status === col.key);
            return (
              <div key={col.key} className={`flex-shrink-0 w-56 rounded-lg border ${col.color} p-3`}>
                <h3 className="text-xs font-semibold text-gray-700 uppercase mb-3 tracking-wider">{col.label}</h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getCardBg(item.status)}`}
                      onClick={() => {
                        const next = getNextStatus(item.status);
                        if (next && ['admin', 'asset_manager'].includes(user?.role)) {
                          setStatusModal({ id: item.id, current: item.status, next });
                        }
                      }}
                    >
                      <div className="font-mono text-xs font-bold mb-1">{item.asset?.assetTag || `#${item.assetId}`}</div>
                      <div className="text-xs leading-relaxed truncate">{item.description}</div>
                      {item.technicianName && (
                        <div className="text-xs mt-1 opacity-70">tech: {item.technicianName}</div>
                      )}
                      {item.resolvedAt && (
                        <div className="text-xs mt-1 opacity-70">resolved {new Date(item.resolvedAt).toLocaleDateString()}</div>
                      )}
                      <div className={`text-xs mt-1 font-medium ${item.status === 'resolved' ? 'opacity-70' : getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">No items</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Raise Maintenance Request</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.assetId} onChange={(e) => setForm({...form, assetId: e.target.value})}>
                  <option value="">Select asset</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                <textarea required rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Move to "{statusModal.next.replace('_', ' ')}"?
            </h3>
            {statusModal.next === 'technician_assigned' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician Name</label>
                <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="e.g. R Varma" />
              </div>
            )}
            {statusModal.next === 'resolved' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={2} value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setStatusModal(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700">Cancel</button>
              <button onClick={() => handleStatusChange(statusModal.id, statusModal.next)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
