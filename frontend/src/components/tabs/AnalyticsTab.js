'use client';

import { useEffect, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BarChart3, TrendingUp, AlertTriangle, Building2, Download, RefreshCw, CalendarCheck } from 'lucide-react';
import Button from '../shared/Button';
import KPICard from '../shared/KPICard';

export default function AnalyticsTab({ user }) {
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [kpis, setKpis] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [maintenanceFreq, setMaintenanceFreq] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);
  const [heatmap, setHeatmap] = useState({});

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [kpiRes, utilRes, maintRes, deptRes, heatRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/utilization'),
        api.get('/analytics/maintenance-frequency'),
        api.get('/analytics/department-summary'),
        api.get('/analytics/heatmaps')
      ]);

      setKpis(kpiRes.data.data.kpis);
      setUtilization(utilRes.data.data.utilization || []);
      setMaintenanceFreq(maintRes.data.data.maintenanceFrequency || []);
      setDeptSummary(deptRes.data.data.departmentSummary || []);
      setHeatmap(heatRes.data.data.heatmap || {});
    } catch (err) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    // Generate simple CSV for Department Summary
    let csv = "Department,Employee Count,Active Allocations\n";
    deptSummary.forEach(row => {
      csv += `"${row.departmentName}",${row.employeeCount},${row.activeAllocations}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'department_summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-hairline rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-hairline rounded-lg" />
          <div className="h-32 bg-hairline rounded-lg" />
          <div className="h-32 bg-hairline rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-hairline rounded-lg" />
          <div className="h-80 bg-hairline rounded-lg" />
        </div>
      </div>
    );
  }

  // Calculate most used / idle assets based on allocations + bookings
  const sortedUtilization = [...utilization].sort((a, b) => {
    const scoreA = a._count.allocations + a._count.bookings;
    const scoreB = b._count.allocations + b._count.bookings;
    return scoreB - scoreA; // descending
  });

  const mostUsed = sortedUtilization.slice(0, 5);
  const leastUsed = [...sortedUtilization].reverse().slice(0, 5).filter(a => (a._count.allocations + a._count.bookings) === 0);

  // Calculate highest maintenance assets
  const highMaintenanceAssets = [];
  maintenanceFreq.forEach(cat => {
    cat.assets.forEach(asset => {
      highMaintenanceAssets.push({
        ...asset,
        category: cat.categoryName
      });
    });
  });
  highMaintenanceAssets.sort((a, b) => b._count.maintenanceRequests - a._count.maintenanceRequests);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxHeatmapValue = Math.max(...Object.values(heatmap).map(day => Math.max(...Object.values(day))));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-steel">
            Operational insights, asset utilization trends, and system health metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="secondary" onClick={fetchAnalytics} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" onClick={handleExportCSV} icon={Download}>
            Export Summary (CSV)
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Organization Assets" 
          value={(kpis?.assetsAvailable || 0) + (kpis?.assetsAllocated || 0)} 
          icon={TrendingUp} 
          trend={{ label: 'Overall inventory size', type: 'neutral' }} 
        />
        <KPICard 
          title="Active Maintenance Issues" 
          value={kpis?.maintenanceToday || 0} 
          icon={AlertTriangle} 
          className={kpis?.maintenanceToday > 0 ? "border-status-maintenance" : ""}
          trend={{ label: 'Requires attention', type: kpis?.maintenanceToday > 0 ? 'negative' : 'positive' }} 
        />
        <KPICard 
          title="Active Allocations" 
          value={kpis?.assetsAllocated || 0} 
          icon={Building2} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Top Utilized Assets
          </h3>
          <div className="flex flex-col gap-3">
            {mostUsed.length > 0 ? mostUsed.map((asset, idx) => {
              const score = asset._count.allocations + asset._count.bookings;
              return (
                <div key={asset.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-steel font-mono font-bold w-4">{idx + 1}.</span>
                    <span className="font-semibold text-ink">{asset.name}</span>
                    <span className="text-xs text-steel font-mono">({asset.assetTag})</span>
                  </div>
                  <span className="bg-surface border border-hairline px-2 py-0.5 rounded text-xs font-semibold text-accent">
                    {score} interactions
                  </span>
                </div>
              );
            }) : <span className="text-sm text-steel">No utilization data available.</span>}
          </div>
        </div>

        {/* High Maintenance Assets */}
        <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-lost" /> High Maintenance Assets
          </h3>
          <div className="flex flex-col gap-3">
            {highMaintenanceAssets.slice(0, 5).length > 0 ? highMaintenanceAssets.slice(0, 5).map((asset, idx) => (
              <div key={asset.id} className="flex flex-col gap-1.5 p-3 rounded bg-status-lost/5 border border-status-lost/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">{asset.name} <span className="text-xs font-mono font-normal text-steel ml-1">({asset.assetTag})</span></span>
                  <span className="text-xs font-bold text-status-lost">{asset._count.maintenanceRequests} repair tickets</span>
                </div>
                <div className="w-full bg-white rounded-full h-1.5">
                  <div className="bg-status-lost h-1.5 rounded-full" style={{ width: `${Math.min((asset._count.maintenanceRequests / 10) * 100, 100)}%` }}></div>
                </div>
              </div>
            )) : <span className="text-sm text-steel text-center py-4 bg-surface rounded">No major maintenance issues flagged.</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Summary */}
        <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Department Allocation Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-steel uppercase font-semibold border-b border-hairline">
                  <th className="py-2">Department</th>
                  <th className="py-2">Members</th>
                  <th className="py-2 text-right">Active Allocations</th>
                </tr>
              </thead>
              <tbody>
                {deptSummary.map(dept => (
                  <tr key={dept.departmentId} className="border-b border-hairline hover:bg-surface/50">
                    <td className="py-3 font-semibold text-ink">{dept.departmentName}</td>
                    <td className="py-3 text-steel">{dept.employeeCount}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex justify-center min-w-[2rem] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded">
                        {dept.activeAllocations}
                      </span>
                    </td>
                  </tr>
                ))}
                {deptSummary.length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-steel text-xs">No department data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Heatmap */}
        <div className="bg-white border border-hairline rounded-lg p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-steel border-b border-hairline pb-2 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> Resource Booking Heatmap
          </h3>
          <p className="text-xs text-steel">Peak usage windows across all shared resources.</p>
          
          <div className="flex flex-col gap-1 mt-2">
            {/* Simple heatmap visualization */}
            <div className="flex gap-1 text-[10px] text-steel font-mono mb-1">
              <div className="w-8"></div>
              {/* Show only every 3 hours to save space */}
              {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                <div key={h} className="flex-1 text-center">{h}:00</div>
              ))}
            </div>
            
            {days.map((day, dIdx) => (
              <div key={dIdx} className="flex gap-1 items-center h-6">
                <div className="w-8 text-[10px] text-steel font-semibold uppercase">{day}</div>
                {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
                  // Aggregate 3 hours
                  const val = (heatmap[dIdx]?.[h] || 0) + (heatmap[dIdx]?.[h+1] || 0) + (heatmap[dIdx]?.[h+2] || 0);
                  const intensity = maxHeatmapValue > 0 ? (val / (maxHeatmapValue * 3)) : 0;
                  
                  return (
                    <div 
                      key={h} 
                      className="flex-1 h-full rounded-sm transition-colors duration-200"
                      style={{ 
                        backgroundColor: intensity === 0 ? 'var(--color-surface)' : `rgba(0, 102, 255, ${Math.max(0.1, intensity)})`,
                        border: intensity === 0 ? '1px solid var(--color-hairline)' : 'none'
                      }}
                      title={`${day} ${h}:00 - ${val} bookings`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
