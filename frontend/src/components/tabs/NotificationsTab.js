'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Bell, CheckCheck } from 'lucide-react';

export default function NotificationsTab({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = res.data.data || res.data;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All marked as read');
      loadNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getTypeColor = (type) => {
    const colors = {
      allocation: 'bg-blue-400',
      maintenance: 'bg-yellow-400',
      booking: 'bg-blue-500',
      transfer: 'bg-purple-400',
      transfer_request: 'bg-purple-400',
      overdue: 'bg-orange-400',
      audit: 'bg-red-400',
      role_request: 'bg-pink-400',
    };
    return colors[type] || 'bg-gray-400';
  };

  const filterTabs = ['all', 'alerts', 'approvals', 'bookings'];

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'alerts') return ['overdue', 'audit', 'maintenance'].includes(n.type);
    if (filter === 'approvals') return ['transfer', 'transfer_request', 'role_request'].includes(n.type);
    if (filter === 'bookings') return n.type === 'booking';
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800">
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>No notifications to show.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-6 py-4 cursor-pointer transition-colors ${
                    n.isRead ? 'bg-white' : 'bg-blue-50/30'
                  } hover:bg-gray-50`}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                >
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getTypeColor(n.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {n.title || n.message}
                    </p>
                    {n.title && n.message && n.title !== n.message && (
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{getTimeAgo(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
