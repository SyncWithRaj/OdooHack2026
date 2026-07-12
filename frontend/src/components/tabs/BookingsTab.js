'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, CalendarDays } from 'lucide-react';

export default function BookingsTab({ user }) {
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bookRes, assetRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/assets'),
      ]);
      setBookings(bookRes.data.data.bookings || []);
      const allAssets = assetRes.data.data.assets || [];
      setAssets(allAssets.filter(a => a.isBookable));
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bookings', form);
      toast.success('Booking created');
      setShowModal(false);
      setForm({ assetId: '', startTime: '', endTime: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed — possible time conflict');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Booking</h2>
          <p className="mt-1 text-sm text-gray-500">Book shared resources like conference rooms and equipment.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" /> Book Resource
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.asset?.name || `Resource #${b.assetId}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.startTime).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.endTime).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.user?.name || b.bookedBy || '—'}</td>
                  <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                  <td className="px-6 py-4">
                    {(b.status === 'upcoming') && (
                      <button onClick={() => handleCancel(b.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Book Resource</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                <select required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.assetId} onChange={(e) => setForm({...form, assetId: e.target.value})}>
                  <option value="">Select bookable resource</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="datetime-local" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="datetime-local" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
