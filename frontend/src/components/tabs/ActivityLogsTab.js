'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Activity, Calendar } from 'lucide-react';
import Button from '../shared/Button';
import DataTable from '../shared/DataTable';
import FormField from '../shared/FormField';

export default function ActivityLogsTab({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtering
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      if (startDate) params.startDate = startDate;
      
      const res = await api.get('/analytics/logs', { params });
      setLogs(res.data.data.logs || []);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityTypeFilter, startDate]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.user && log.user.name.toLowerCase().includes(search.toLowerCase())) ||
    log.entityType.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'user',
      label: 'Actor',
      render: (row) => (
        <div className="flex flex-col">
          {row.user ? (
            <>
              <span className="font-semibold text-ink text-sm">{row.user.name}</span>
              <span className="text-xs text-steel/70">{row.user.email}</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-steel/60 italic">System Auto-process</span>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action Taken',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-ink text-sm uppercase tracking-wider">{row.action.replace(/_/g, ' ')}</span>
          <span className="text-xs text-steel font-mono">{row.entityType} #{row.entityId}</span>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Metadata Details',
      render: (row) => (
        <span className="text-[10px] text-steel font-mono block max-w-xs truncate" title={JSON.stringify(row.details)}>
          {row.details ? JSON.stringify(row.details) : '—'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-ink">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="text-xs text-steel font-mono">{new Date(row.createdAt).toLocaleTimeString()}</span>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" /> Activity Logs
          </h2>
          <p className="mt-1 text-sm text-steel">
            Complete audit trail of all administrative and user actions across the platform.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="secondary" onClick={fetchLogs} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-lg p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search action or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-md bg-white text-ink placeholder-steel/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>

        <div className="md:col-span-1">
          <FormField
            id="filter-entity"
            type="select"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            noLabel
          >
            <option value="">All Entities</option>
            <option value="asset">Asset Management</option>
            <option value="allocation">Allocations</option>
            <option value="booking">Resource Bookings</option>
            <option value="maintenance">Maintenance</option>
            <option value="audit">Audits & Discrepancies</option>
            <option value="user">User Accounts</option>
          </FormField>
        </div>

        <div className="md:col-span-1 relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-steel">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-md bg-white text-ink focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyTitle="No activity logs found"
        emptyDescription="There are no actions matching the current filters."
      />
    </div>
  );
}
