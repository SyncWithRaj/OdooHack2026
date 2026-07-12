'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Package, CheckCircle2, Wrench, CalendarCheck, ArrowRightLeft, AlertTriangle, Plus, CalendarDays, Loader2 } from 'lucide-react';

export default function OverviewTab({ user, setActiveTab }) {
  const [kpis, setKpis] = useState(null);
  const [overdueReturns, setOverdueReturns] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const [kpiRes, allocRes, maintRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/allocations'),
        api.get('/maintenance'),
      ]);

      const kpiData = kpiRes.data.data.kpis || kpiRes.data.data;
      setKpis(kpiData);

      // Compute overdue returns
      const allocs = allocRes.data.data.allocations || [];
      const now = new Date();
      const overdue = allocs.filter(al => {
        if (al.status !== 'active' || !al.expectedReturnDate) return false;
        return new Date(al.expectedReturnDate) < now;
      });
      setOverdueReturns(overdue);

      // Build recent activity from allocations + maintenance
      const maints = maintRes.data.data.maintenanceRequests || [];
      const activity = [];
      allocs.slice(0, 3).forEach(al => {
        activity.push({
          text: `${al.asset?.assetTag || 'Asset'} — allocated to ${al.assignedToUser?.name || 'employee'}`,
          time: al.allocatedAt || al.createdAt,
        });
      });
      maints.slice(0, 3).forEach(m => {
        activity.push({
          text: `${m.asset?.assetTag || 'Asset'} — maintenance ${m.status}`,
          time: m.createdAt,
        });
      });
      activity.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activity.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className={`rounded-xl border border-gray-200 bg-white p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value ?? '—'}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back, <strong className="text-gray-900">{user?.name}</strong>.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Available" value={kpis?.totalAssets ?? kpis?.available} icon={Package} color="bg-blue-100 text-blue-600" />
        <StatCard title="Allocated" value={kpis?.activeAllocations ?? kpis?.allocated} icon={CheckCircle2} color="bg-green-100 text-green-600" />
        <StatCard title="Available" value={kpis?.availableAssets} icon={Package} color="bg-teal-100 text-teal-600" />
        <StatCard title="Active Bookings" value={kpis?.activeBookings} icon={CalendarCheck} color="bg-purple-100 text-purple-600" />
        <StatCard title="Transfers" value={kpis?.pendingTransfers} icon={ArrowRightLeft} color="bg-yellow-100 text-yellow-600" />
        <StatCard title="Upcoming returns" value={kpis?.overdueReturns ?? overdueReturns.length} icon={AlertTriangle} color="bg-red-100 text-red-600" />
      </div>

      {/* Overdue Alert */}
      {overdueReturns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {overdueReturns.length} asset(s) overdue for return — flagged for followup
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => setActiveTab('assets')} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1.5" /> Register asset
        </button>
        <button onClick={() => setActiveTab('bookings')} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
          <CalendarDays className="h-4 w-4 mr-1.5" /> Book resource
        </button>
        <button onClick={() => setActiveTab('maintenance')} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
          <Wrench className="h-4 w-4 mr-1.5" /> Raise requests
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              {item.text}
            </div>
          ))}
          {recentActivity.length === 0 && (
            <p className="text-sm text-gray-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
