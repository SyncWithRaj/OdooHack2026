'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Package, ArrowRightLeft, Wrench, CalendarCheck, TrendingUp, AlertCircle } from 'lucide-react';

export default function OverviewTab({ user }) {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await api.get('/analytics/kpis');
        setKpis(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && ['admin', 'asset_manager', 'department_head'].includes(user.role)) {
      fetchKpis();
    } else {
      setLoading(false);
    }
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
      <div className={`p-4 rounded-lg ${color}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="ml-5">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}.</p>
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Assets" value={kpis.totalAssets} icon={Package} color="bg-blue-100 text-blue-600" />
          <StatCard title="Active Allocations" value={kpis.activeAllocations} icon={ArrowRightLeft} color="bg-purple-100 text-purple-600" />
          <StatCard title="Open Maintenance" value={kpis.openMaintenance} icon={Wrench} color="bg-orange-100 text-orange-600" />
          <StatCard title="Active Bookings" value={kpis.activeBookings} icon={CalendarCheck} color="bg-green-100 text-green-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Employee Dashboard</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            You are logged in as a standard employee. Use the sidebar to view your assigned assets and request maintenance.
          </p>
        </div>
      )}

      {kpis && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col items-center justify-center text-gray-400">
            <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
            <p>Asset Utilization Chart (Available with more data)</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col items-center justify-center text-gray-400">
             <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
            <p>Recent Alerts</p>
          </div>
        </div>
      )}
    </div>
  );
}
