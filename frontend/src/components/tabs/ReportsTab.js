'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Loader2, BarChart3, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export default function ReportsTab({ user }) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, assetRes, maintRes, allocRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/assets'),
        api.get('/maintenance'),
        api.get('/allocations'),
      ]);
      setKpis(kpiRes.data.data.kpis || kpiRes.data.data);
      setAssets(assetRes.data.data.assets || []);
      setMaintenance(maintRes.data.data.maintenanceRequests || []);
      setAllocations(allocRes.data.data.allocations || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  // Compute analytics from data
  const statusCounts = {};
  assets.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const categoryCounts = {};
  assets.forEach(a => {
    const cat = a.category?.name || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Most allocated assets (by allocation count)
  const assetAllocCounts = {};
  allocations.forEach(al => {
    assetAllocCounts[al.assetId] = (assetAllocCounts[al.assetId] || 0) + 1;
  });
  const mostUsed = Object.entries(assetAllocCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([assetId, count]) => {
      const asset = assets.find(a => a.id === parseInt(assetId));
      return { asset, count };
    });

  // Idle assets (available and not allocated recently)
  const idleAssets = assets.filter(a => a.status === 'available').slice(0, 5);

  // Maintenance frequency by priority
  const maintByPriority = {};
  maintenance.forEach(m => {
    maintByPriority[m.priority] = (maintByPriority[m.priority] || 0) + 1;
  });

  // Overdue returns
  const now = new Date();
  const overdueAllocations = allocations.filter(al => {
    if (al.status !== 'active' || !al.expectedReturnDate) return false;
    return new Date(al.expectedReturnDate) < now;
  });

  // Simple bar renderer
  const SimpleBar = ({ label, value, max, color }) => (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-gray-600 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-gray-900">{value}</span>
    </div>
  );

  const maxCatCount = Math.max(...Object.values(categoryCounts), 1);
  const maxPriorityCount = Math.max(...Object.values(maintByPriority), 1);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h2>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Utilization by Category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Utilization by category
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <SimpleBar key={cat} label={cat} value={count} max={maxCatCount} color="bg-blue-500" />
            ))}
          </div>
        </div>

        {/* Maintenance Frequency */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" /> Maintenance Frequency
          </h3>
          <div className="space-y-3">
            {Object.entries(maintByPriority).map(([priority, count]) => (
              <SimpleBar key={priority} label={priority} value={count} max={maxPriorityCount} color={priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'} />
            ))}
            {Object.keys(maintByPriority).length === 0 && <p className="text-sm text-gray-400">No maintenance data</p>}
          </div>
        </div>
      </div>

      {/* Most used & Idle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Most used assets</h3>
          <div className="space-y-2">
            {mostUsed.map(({ asset, count }, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{asset?.name || 'Unknown'} <span className="text-xs text-gray-400 font-mono">{asset?.assetTag}</span></span>
                <span className="text-gray-500">{count} allocation{count > 1 ? 's' : ''}</span>
              </div>
            ))}
            {mostUsed.length === 0 && <p className="text-sm text-gray-400">No data</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Idle assets</h3>
          <div className="space-y-2">
            {idleAssets.map(a => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{a.name} <span className="text-xs text-gray-400 font-mono">{a.assetTag}</span></span>
                <span className="text-gray-400 text-xs">{a.location}</span>
              </div>
            ))}
            {idleAssets.length === 0 && <p className="text-sm text-gray-400">All assets are in use</p>}
          </div>
        </div>
      </div>

      {/* Overdue / Nearing retirement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" /> Assets due for maintenance / nearing retirement
        </h3>
        <div className="space-y-2">
          {assets.filter(a => a.status === 'under_maintenance').map(a => (
            <div key={a.id} className="text-sm text-gray-700">
              <span className="font-mono text-xs text-red-600 mr-2">{a.assetTag}</span> — currently under maintenance
            </div>
          ))}
          {overdueAllocations.map(al => (
            <div key={al.id} className="text-sm text-gray-700">
              <span className="font-mono text-xs text-orange-600 mr-2">{al.asset?.assetTag}</span> — overdue return (was due {new Date(al.expectedReturnDate).toLocaleDateString()})
            </div>
          ))}
          {assets.filter(a => a.status === 'under_maintenance').length === 0 && overdueAllocations.length === 0 && (
            <p className="text-sm text-gray-400">No flagged assets</p>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          const data = JSON.stringify({ assets, allocations, maintenance }, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'assetflow-report.json'; a.click();
        }}
        className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-900"
      >
        Export report
      </button>
    </div>
  );
}
