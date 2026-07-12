'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Bell, Calendar } from 'lucide-react';
import Button from '../shared/Button';
import DataTable from '../shared/DataTable';
import FormField from '../shared/FormField';

export default function NotificationsTab({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtering
  const [isReadFilter, setIsReadFilter] = useState('');
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch more than the limit of 10 usually used in the dropdown
      const res = await api.get('/notifications?limit=200');
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      toast.success('Marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = 
      notif.title.toLowerCase().includes(search.toLowerCase()) ||
      notif.message.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = 
      isReadFilter === '' ? true :
      isReadFilter === 'read' ? notif.isRead :
      !notif.isRead;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div className="flex flex-col">
          <span className={`font-semibold text-sm ${row.isRead ? 'text-steel' : 'text-ink'}`}>{row.title}</span>
          <span className="text-xs text-steel/70">{row.type}</span>
        </div>
      )
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => (
        <span className={`text-sm ${row.isRead ? 'text-steel' : 'text-ink'}`}>{row.message}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
          row.isRead ? 'bg-steel/10 text-steel border border-steel/20' : 'bg-status-maintenance/10 text-status-maintenance border border-status-maintenance/20'
        }`}>
          {row.isRead ? 'Read' : 'Unread'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-ink">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="text-xs text-steel font-mono">{new Date(row.createdAt).toLocaleTimeString()}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          {!row.isRead && (
            <Button variant="secondary" onClick={() => markAsRead(row.id)} className="!py-1 !px-2 text-xs">
              Mark Read
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-6 h-6 text-accent" /> System Notifications
          </h2>
          <p className="mt-1 text-sm text-steel">
            View all system alerts, reminders, and broadcast notifications.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="secondary" onClick={fetchNotifications} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-md bg-white text-ink placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <FormField
            id="filter-status"
            type="select"
            value={isReadFilter}
            onChange={(e) => setIsReadFilter(e.target.value)}
            noLabel
          >
            <option value="">All Statuses</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </FormField>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredNotifications}
        loading={loading}
        emptyTitle="No notifications found"
        emptyDescription="There are no notifications matching the current filters."
      />
    </div>
  );
}
