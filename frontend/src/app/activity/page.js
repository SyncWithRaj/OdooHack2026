'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import DataTable from '@/components/shared/DataTable';
import SearchBar from '@/components/shared/SearchBar';
import StatusBadge from '@/components/shared/StatusBadge';
import { ToastProvider, useToast } from '@/components/shared/Toast';
import useAuth from '@/utils/useAuth';
import { api } from '@/utils/api';
import { History, Bell } from 'lucide-react';

function ActivityLogsContent() {
  const { user, loading, logout } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  const loadLogsData = async () => {
    try {
      const logsList = await api.get('/analytics/logs');
      setLogs(logsList);

      const notifList = await api.get('/notifications');
      setNotifications(notifList);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadLogsData();
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      showToast('All notifications marked read.', 'success');
      loadLogsData();
    } catch (err) {
      showToast('Failed to update notifications', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface font-mono text-xs text-steel">SYSTEM LOADING...</div>;
  }

  // Filter logs by search and type
  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchAction = log.action?.toLowerCase().includes(query);
      const matchEntity = log.entityType?.toLowerCase().includes(query);
      if (!matchAction && !matchEntity) return false;
    }

    if (activeFilters.entityType && log.entityType !== activeFilters.entityType) return false;

    return true;
  });

  const logColumns = [
    { key: 'action', label: 'Action Log Event', sortable: true },
    { key: 'entityType', label: 'Module Entity', render: (val) => <span className="font-mono text-xs uppercase text-steel">{val}</span> },
    { key: 'entityId', label: 'Entity ID', render: (val) => <span className="font-mono text-xs">{val || 'N/A'}</span> },
    { key: 'createdAt', label: 'Event Timestamp', render: (val) => new Date(val).toLocaleString() },
  ];

  return (
    <Sidebar user={user} onLogout={logout}>
      <div className="flex flex-col gap-8">
        
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">ACTIVITY LOGS & ALERTS</h1>
          <p className="text-steel text-sm mt-1">Audit append-only system trails, session event histories, and corporate alert receipts.</p>
        </div>

        {/* Notifications list */}
        <div className="bg-surface-raised border border-hairline rounded-[10px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-accent" /> System Notifications
            </h2>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-mono font-semibold text-status-lost hover:underline cursor-pointer"
              >
                Mark All Read
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-xs text-steel italic">
                No notification alerts found.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border rounded-[6px] transition-all flex flex-col gap-1.5 ${
                    notif.isRead
                      ? 'bg-surface border-hairline opacity-65'
                      : 'bg-accent/5 border-accent/25 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-ink">{notif.title}</span>
                    <span className="text-[10px] font-mono text-steel">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-steel leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Append-only logs */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-accent" /> Append-Only System Audit Trail
          </h2>

          <div className="p-4 bg-surface-raised border border-hairline rounded-[10px] shadow-xs">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search audit trail actions..."
              filters={[
                {
                  key: 'entityType',
                  label: 'Category Entity',
                  options: [
                    { value: 'auth', label: 'Auth & Login' },
                    { value: 'asset', label: 'Asset Registry' },
                    { value: 'allocation', label: 'Allocations' },
                    { value: 'transfer', label: 'Transfers' },
                    { value: 'department', label: 'Departments' },
                  ]
                }
              ]}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>

          <DataTable
            columns={logColumns}
            data={filteredLogs}
            pageSize={10}
          />
        </div>

      </div>
    </Sidebar>
  );
}

export default function ActivityLogsPage() {
  return (
    <ToastProvider>
      <ActivityLogsContent />
    </ToastProvider>
  );
}
